import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LetterAudioButton from './LetterAudioButton';
import { ALPHABET_AUDIO } from '@/lib/alphabet-audio';
import type { Lesson, VocabItem } from '@/lib/types';

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

export default function LessonViewer({
  lesson,
  vocab,
}: {
  lesson: Lesson;
  vocab: VocabItem[];
}) {
  // Les 28 lettres de l'alphabet (Jours 1-8 de module-01) ont un fichier audio ; le reste
  // du contenu n'en a pas. On restreint le lookup à ce module précis plutôt que de se fier
  // à l'unicité globale des noms de lettres à travers tout le contenu — plus sûr si un
  // futur module réutilise un jour un mot comme "Ra" ou "Lam" dans un autre contexte.
  const isAlphabetLesson =
    lesson.module_id === 'module-01' && lesson.day !== null && lesson.day <= 8;

  return (
    <>
      {lesson.day !== null && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Jour {lesson.day}
        </p>
      )}

      {/*
        Pas de `whitespace-nowrap` sur les tables : la plupart en ont 2-3 colonnes de
        prose (description, exemple) qui se lisent bien en enveloppant le texte. Forcer
        une seule ligne rendait presque toutes les tables de leçon plus larges que
        l'écran sur mobile — visuellement « ça dépasse », même si un défilement interne
        la contenait techniquement. `overflow-x-auto` reste en filet de sécurité pour les
        rares mots ou séquences arabes trop longs pour être coupés.
      */}
      <article className="prose prose-neutral mt-2 max-w-none dark:prose-invert prose-table:block prose-table:overflow-x-auto prose-th:text-left prose-blockquote:not-italic">

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={
            isAlphabetLesson
              ? {
                  td: ({ node: _node, children, ...props }) => {
                    const text = extractText(children).trim();
                    const audioSrc = ALPHABET_AUDIO[text];
                    return (
                      <td {...props}>
                        {children}
                        {audioSrc && <LetterAudioButton src={audioSrc} label={text} />}
                      </td>
                    );
                  },
                }
              : undefined
          }
        >
          {lesson.content_markdown}
        </ReactMarkdown>
      </article>

      {vocab.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Vocabulaire ({vocab.length})
          </h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-[var(--border)]">
              {vocab.map((v) => (
                <tr key={v.id}>
                  <td className="arabic py-2 pr-4 text-right align-middle" dir="rtl">
                    {v.arabic}
                  </td>
                  <td className="py-2 pr-4 font-medium">{v.transliteration}</td>
                  <td className="py-2 text-[var(--muted)]">
                    {v.french}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
