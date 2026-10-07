'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CHAT_LIMITS } from '@/lib/chat-config';

type Message = { id: number; role: 'user' | 'assistant'; content: string; interrupted?: boolean };

const SUGGESTIONS = [
  'Comment dit-on « merci beaucoup » ?',
  'Corrige-moi : ana 3ayez kitab gedid',
  'Quelle différence entre « mesh » et « ma…sh » ?',
  'Apprends-moi à commander un café',
];

// Écriture arabe (bloc principal + formes de présentation).
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/**
 * Une réponse du tuteur, ligne par ligne. Chaque ligne a `dir="auto"` : une ligne en
 * écriture arabe s'aligne à droite et se lit de droite à gauche, la translittération et la
 * traduction restent à gauche. Un seul paragraphe pour toute la réponse mélangerait les
 * deux sens de lecture dans le même bloc — la ponctuation se retrouverait au mauvais bout.
 *
 * Seul le gras (`**mot**`) est interprété : pas de HTML, rien que du texte.
 */
function TutorText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <span key={i} className="block h-2" aria-hidden="true" />;
        const isArabic = ARABIC.test(line);
        return (
          <p
            key={i}
            dir="auto"
            lang={isArabic ? 'ar-EG' : undefined}
            className={isArabic ? 'arabic leading-[1.9]' : undefined}
          >
            {line.split(/\*\*(.+?)\*\*/g).map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
            )}
          </p>
        );
      })}
    </>
  );
}

export default function ChatTutor({ initialRemaining }: { initialRemaining: number | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [signedOut, setSignedOut] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  // Une réponse en cours est abandonnée si l'on quitte la page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Suit la réponse qui s'écrit, dans la zone de discussion seulement : la page, elle, ne
  // saute pas.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const outOfMessages = remaining !== null && remaining <= 0;
  const tooLong = input.length > CHAT_LIMITS.maxMessageChars;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || content.length > CHAT_LIMITS.maxMessageChars) return;

    setError(null);
    setBusy(true);

    const userMsg: Message = { id: nextId.current++, role: 'user', content };
    const replyId = nextId.current++;
    const history = [...messages, userMsg];
    setMessages([...history, { id: replyId, role: 'assistant', content: '' }]);
    setInput('');

    // En cas d'échec avant toute réponse : on retire l'échange et on rend le texte à
    // l'élève, pour qu'il n'ait pas à le retaper.
    const rollback = (message: string) => {
      setMessages(history.slice(0, -1));
      setInput(content);
      setError(message);
    };

    const controller = new AbortController();
    abortRef.current = controller;

    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.content)
            .slice(-CHAT_LIMITS.maxHistory)
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
    } catch {
      if (!controller.signal.aborted) {
        rollback('Connexion impossible. Vérifie ta connexion internet puis réessaie.');
      }
      setBusy(false);
      return;
    }

    const header = response.headers.get('X-Chat-Remaining');
    if (header !== null) setRemaining(Number(header));

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 401) setSignedOut(true);
      rollback(data?.error ?? 'Le tuteur n’a pas pu répondre. Réessaie dans un instant.');
      setBusy(false);
      return;
    }

    // Lecture du flux : chaque morceau s'ajoute à la réponse affichée.
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let reply = '';
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((all) => all.map((m) => (m.id === replyId ? { ...m, content: reply } : m)));
      }
    } catch {
      if (controller.signal.aborted) {
        // Page quittée : rien à afficher.
      } else if (!reply) {
        rollback('La réponse a été interrompue. Réessaie dans un instant.');
      } else {
        setMessages((all) =>
          all.map((m) => (m.id === replyId ? { ...m, interrupted: true } : m)),
        );
        setError('La réponse a été interrompue. Tu peux reposer ta question.');
      }
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  if (signedOut) {
    return (
      <div className="card-sand mt-8 p-6">
        <p className="font-semibold">Ta session a expiré.</p>
        <Link href="/auth/login" className="btn-sand mt-4 inline-flex">
          Se reconnecter
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-8" aria-label="Discussion avec le tuteur">
      {/* `role="log"` : un lecteur d'écran annonce les nouveaux messages. `aria-busy`
          retient l'annonce tant que la réponse s'écrit, sinon chaque morceau serait lu. */}
      <div
        ref={listRef}
        role="log"
        aria-busy={busy}
        aria-label="Messages"
        className="chat-log"
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <div className="p-2">
            <p className="text-[var(--muted)]">
              Pose une question sur l’arabe égyptien, ou écris une phrase pour que je la
              corrige. Par exemple :
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="chat-suggestion"
                    disabled={busy || outOfMessages}
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="chat-bubble chat-bubble-user" dir="auto">
                <span className="sr-only">Toi : </span>
                {m.content}
              </div>
            ) : (
              <div key={m.id} className="chat-bubble chat-bubble-tutor">
                <span className="sr-only">Tuteur : </span>
                {m.content ? (
                  <TutorText text={m.content} />
                ) : (
                  <span className="chat-typing">
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span className="sr-only">Le tuteur écrit…</span>
                  </span>
                )}
                {m.interrupted && (
                  <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                    (réponse interrompue)
                  </p>
                )}
              </div>
            ),
          )
        )}
      </div>

      {error && (
        <p role="alert" className="chat-error">
          {error}
        </p>
      )}

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Ton message au tuteur
        </label>
        <div className="flex items-end gap-3">
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Entrée envoie, Maj + Entrée passe à la ligne. Pendant une composition IME
              // (clavier arabe sur mobile), Entrée valide le mot : on ne l'intercepte pas.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            dir="auto"
            rows={2}
            maxLength={CHAT_LIMITS.maxMessageChars}
            disabled={outOfMessages}
            placeholder={outOfMessages ? 'Reviens demain pour de nouveaux messages.' : 'Écris en français, en Arabizi ou en arabe…'}
            aria-describedby="chat-help"
            className="pop-field min-h-[3.25rem] flex-1 resize-none px-4 py-3 outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || outOfMessages || !input.trim() || tooLong}
            className="btn-sand shrink-0 disabled:opacity-40"
          >
            {busy ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>

        <div id="chat-help" className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span aria-live="polite">
            {remaining === null
              ? null
              : remaining > 0
                ? `${remaining} message${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} aujourd’hui`
                : 'Plus de messages aujourd’hui : le compteur repart à minuit.'}
          </span>
          <span className="tabular">
            {input.length}/{CHAT_LIMITS.maxMessageChars}
          </span>
        </div>
      </form>
    </section>
  );
}
