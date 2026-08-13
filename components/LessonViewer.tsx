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
      {lesson.day !== null && <p className="eyebrow">Jour {lesson.day}</p>}

      {/*
        Pas de `whitespace-nowrap` sur les tables : la plupart en ont 2-3 colonnes de
        prose (description, exemple) qui se lisent bien en enveloppant le texte. Forcer
        une seule ligne rendait presque toutes les tables de leçon plus larges que
        l'écran sur mobile.
      */}
      <article className="prose mt-2 max-w-none prose-th:text-left prose-blockquote:not-italic">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            /*
              Chaque table est enveloppée dans un conteneur défilant plutôt que passée en
              `display: block` : mise en block, elle perd son rôle « table » dans l'arbre
              d'accessibilité et un lecteur d'écran n'associe plus les cellules à leurs
              en-têtes — sur une table de conjugaison, c'est la moitié de l'information.
            */
            table: ({ node: _node, children, ...props }) => (
              <div className="table-scroll" tabIndex={0}>
                <table {...props}>{children}</table>
              </div>
            ),
            ...(isAlphabetLesson
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
              : {}),
          }}
        >
          {lesson.content_markdown}
        </ReactMarkdown>
      </article>

      {vocab.length > 0 && (
        <section className="mt-12">
          <div className="egypt-rule">
            <h2 className="eyebrow whitespace-nowrap">Vocabulaire · {vocab.length} mots</h2>
          </div>

          {/*
            Des fiches plutôt qu'un tableau à trois colonnes. Dans un tableau, l'arabe est
            comprimé à la largeur de sa colonne et la translittération lui colle : sur
            mobile, les trois informations finissaient sur trois lignes de taille identique,
            sans hiérarchie. Ici l'arabe domine, la translittération le sous-titre, le
            français conclut — c'est l'ordre dans lequel on apprend un mot.
          */}
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {vocab.map((v) => (
              <li key={v.id} className="card-sand p-4">
                <p className="arabic text-right leading-tight text-[var(--ink)]" dir="rtl">
                  {v.arabic}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--gold-text)]">
                  {v.transliteration}
                </p>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{v.french}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
