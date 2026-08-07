import { Fragment } from 'react';
import Link from 'next/link';
import { DuneIcon, PyramidIcon } from './DuneIcon';

export type PathLesson = {
  id: string;
  day: number | null;
  title: string;
  order_index: number;
  read: boolean;
};

export type PathSection = { name: string | null; lessons: PathLesson[] };

export type PathQuiz = {
  count: number;
  passed: boolean;
  bestScore: number | null;
  /** Toutes les leçons du module ont-elles été lues ? */
  unlocked: boolean;
};

/**
 * Serpentin : 8 positions qui montent puis redescendent, répétées le long du chemin.
 * Le motif ne se referme pas sur un cercle — il donne l'impression d'un sentier qui
 * louvoie entre les dunes plutôt que d'un zigzag mécanique.
 */
const WAVE = [0, 38, 62, 38, 0, -38, -62, -38];
const offsetAt = (index: number) => WAVE[index % WAVE.length];

/** Traces de pas entre deux nœuds, interpolées entre leurs décalages respectifs. */
function Trail({ from, to }: { from: number; to: number }) {
  return (
    <li aria-hidden="true" className="flex flex-col items-center gap-2 py-1">
      {[0.3, 0.55, 0.8].map((t) => (
        <span
          key={t}
          className="dune-node block h-1.5 w-1.5 rounded-full bg-[var(--sand-line)]"
          style={{ '--offset': from + (to - from) * t } as React.CSSProperties}
        />
      ))}
    </li>
  );
}

export default function LessonPath({
  moduleId,
  sections,
  quiz,
}: {
  moduleId: string;
  sections: PathSection[];
  quiz: PathQuiz | null;
}) {
  const all = sections.flatMap((s) => s.lessons);
  // « Vous êtes ici » : la première leçon non lue. Sur un chemin de 19 étapes, sans ce
  // repère l'apprenant doit relire toutes les coches pour retrouver où il en était.
  const currentId = all.find((l) => !l.read)?.id ?? null;
  const lastId = all.at(-1)?.id ?? null;

  // Rang de chaque leçon sur le serpentin, calculé avant le rendu : une position dérivée
  // d'un compteur muté pendant le JSX dépendrait de l'ordre d'évaluation des `map`.
  const rankById = new Map(all.map((lesson, i) => [lesson.id, i]));

  return (
    <ol className="dune-path mt-8 flex flex-col items-center">
      {sections.map((section, si) => (
        <li key={si} className="w-full">
          {section.name && (
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--sand-line)]" />
              <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {section.name}
              </h2>
              <span className="h-px flex-1 bg-[var(--sand-line)]" />
            </div>
          )}

          <ol className="flex flex-col items-center">
            {section.lessons.map((lesson) => {
              const rank = rankById.get(lesson.id)!;
              const offset = offsetAt(rank);
              const next = offsetAt(rank + 1);
              const isCurrent = lesson.id === currentId;
              const isLast = lesson.id === lastId;

              return (
                <Fragment key={lesson.id}>
                  <li className="flex flex-col items-center">
                    <Link
                      href={`/modules/${moduleId}/${lesson.id}`}
                      aria-label={`${lesson.day === null ? '' : `Jour ${lesson.day} — `}${lesson.title}${lesson.read ? ' (lue)' : ''}`}
                      className={`dune-node group relative flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sand-sun)] sm:h-20 sm:w-20 ${
                        lesson.read ? 'node-done' : 'node-todo'
                      } ${isCurrent ? 'node-current' : ''}`}
                      style={{ '--offset': offset } as React.CSSProperties}
                    >
                      <DuneIcon />
                      {lesson.read && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow dark:bg-emerald-500">
                          ✓
                        </span>
                      )}
                    </Link>

                    <div
                      className="dune-node mt-2 max-w-40 text-center"
                      style={{ '--offset': offset } as React.CSSProperties}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        {lesson.day === null ? 'Étape' : `Jour ${lesson.day}`}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                        {lesson.title}
                      </p>
                    </div>
                  </li>

                  {!isLast && <Trail from={offset} to={next} />}
                </Fragment>
              );
            })}
          </ol>
        </li>
      ))}

      {quiz && quiz.count > 0 && (
        <>
          <Trail from={offsetAt(all.length - 1)} to={0} />
          <li className="mt-2 flex flex-col items-center">
            <Link
              href={`/modules/${moduleId}/quiz`}
              aria-label={`Quiz du module, ${quiz.count} questions${quiz.passed ? ', réussi' : ''}`}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sand-sun)] sm:h-28 sm:w-28 ${
                quiz.unlocked || quiz.passed ? '' : 'pyramid-locked'
              }`}
            >
              <PyramidIcon />
              {quiz.passed && (
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow dark:bg-emerald-500">
                  ✓
                </span>
              )}
            </Link>

            <p className="mt-3 text-sm font-semibold">Quiz du module</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {quiz.passed
                ? `Réussi à ${quiz.bestScore} %`
                : quiz.bestScore !== null
                  ? `Meilleur score : ${quiz.bestScore} %`
                  : `${quiz.count} questions`}
            </p>
            {!quiz.unlocked && !quiz.passed && (
              <p className="mt-1 max-w-56 text-center text-xs text-neutral-400">
                Accessible dès maintenant, mais il vaut mieux avoir lu les leçons.
              </p>
            )}
          </li>
        </>
      )}
    </ol>
  );
}
