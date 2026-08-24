'use client';

import { useState } from 'react';
import { SITE, gmailCompose } from '@/lib/site-config';

/**
 * Les deux façons d'envoyer un retour, côte à côte.
 *
 * Aucun formulaire : en collecter un supposerait une table, une migration, une politique
 * de conservation et une ligne de plus dans /confidentialite — pour un service que la
 * messagerie du visiteur rend déjà.
 *
 * Aucun `mailto:` non plus : il ouvre le client système (Outlook sous Windows) même chez
 * quelqu'un qui n'utilise que Gmail. On propose donc Gmail en action principale, et la
 * copie pour tous les autres — Thunderbird, Outlook web, Proton, un téléphone…
 */
export default function FeedbackActions({
  subject,
  body,
  variant = 'card',
}: {
  subject: string;
  body?: string;
  /** `card` : deux boutons. `inline` : deux liens discrets, en bas d'une leçon. */
  variant?: 'card' | 'inline';
}) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const copied = status === 'ok';

  // En `inline`, le message complet part dans le presse-papier : le contexte de la leçon
  // est justement ce qui rend le retour exploitable, le perdre viderait le signalement
  // de son intérêt. En `card`, il n'y a pas de contexte, l'adresse suffit.
  const payload =
    variant === 'inline'
      ? `À : ${SITE.feedbackEmail}\nObjet : ${subject}\n\n${body ?? ''}`
      : SITE.feedbackEmail;

  function flag(ok: boolean) {
    setStatus(ok ? 'ok' : 'fail');
    setTimeout(() => setStatus('idle'), 3000);
  }

  async function copy() {
    // L'API moderne d'abord. Elle échoue plus souvent qu'on ne croit : elle exige un
    // contexte sécurisé, la permission, ET que le document ait le focus.
    try {
      await navigator.clipboard.writeText(payload);
      flag(true);
      return;
    } catch {
      // On tente le repli plutôt que d'abandonner.
    }

    // Repli historique : `execCommand` est déprécié mais reste implémenté partout, et
    // il ne dépend ni de la permission asynchrone ni d'un contexte sécurisé. Sans lui,
    // un échec de copie laissait le bouton parfaitement muet — l'utilisateur cliquait
    // et il ne se passait rien.
    try {
      const zone = document.createElement('textarea');
      zone.value = payload;
      zone.setAttribute('readonly', '');
      zone.style.position = 'fixed';
      zone.style.top = '0';
      zone.style.opacity = '0';
      document.body.appendChild(zone);
      zone.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(zone);
      flag(ok);
    } catch {
      flag(false);
    }
  }

  const gmail = gmailCompose(subject, body);

  if (variant === 'inline') {
    return (
      <span className="flex shrink-0 items-center gap-3 text-sm">
        <a
          href={gmail}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-1 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          Signaler une coquille
        </a>
        <span aria-hidden="true" className="text-[var(--border)]">
          ·
        </span>
        <button
          type="button"
          onClick={copy}
          className={`inline-block py-1 transition-colors ${
            status === 'fail'
              ? 'text-[var(--carmine-text)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          {copied ? 'Message copié ✓' : status === 'fail' ? 'copie bloquée' : 'copier'}
        </button>
      </span>
    );
  }

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap gap-2.5">
        <a href={gmail} target="_blank" rel="noopener noreferrer" className="btn-sand">
          Écrire via Gmail
        </a>
        <button type="button" onClick={copy} className="btn-outline">
          {copied ? 'Adresse copiée ✓' : "Copier l'adresse"}
        </button>
      </div>
      {/* L'adresse reste lisible en clair : c'est le filet de sécurité si le presse-papier
          est refusé par le navigateur, et ça évite d'avoir à cliquer pour savoir à qui
          on écrit. */}
      <p
        className={`mt-2.5 text-xs ${
          status === 'fail'
            ? 'font-semibold text-[var(--carmine-text)]'
            : 'text-[var(--muted)]'
        }`}
      >
        {status === 'fail' ? 'Copie bloquée — sélectionnez : ' : ''}
        {SITE.feedbackEmail}
      </p>
      <p aria-live="polite" className="sr-only">
        {copied
          ? 'Adresse copiée dans le presse-papier.'
          : status === 'fail'
            ? 'La copie automatique a été bloquée. Sélectionnez l’adresse affichée.'
            : ''}
      </p>
    </div>
  );
}
