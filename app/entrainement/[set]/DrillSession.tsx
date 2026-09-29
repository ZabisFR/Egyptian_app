'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArabicText from '@/components/ArabicText';
import DrillEngine, { type DrillResult } from '@/components/DrillEngine';
import ScoreDial from '@/components/ScoreDial';
import type { Exercise } from '@/lib/exercises';

/**
 * Enrobe `DrillEngine` : écran de résultat et bouton « Nouvelle série ».
 *
 * Même découpage que `ModuleQuiz` — le moteur ne connaît que des exercices, l'appelant
 * décide de ce qu'on affiche à la fin et d'où l'on va ensuite.
 */
export default function DrillSession({
  setId,
  setTitle,
  theme,
  exercises,
}: {
  setId: string;
  setTitle: string;
  theme: string | null;
  exercises: Exercise[];
}) {
  const router = useRouter();

  return (
    <DrillEngine
      exercises={exercises}
      renderResult={(result: DrillResult) => {
        const missed = result.answers.filter((a) => a.verdict === 'wrong');
        const right = result.answers.length - missed.length;

        return (
          <div>
            <p className="eyebrow">{setTitle}</p>

            <div className="mt-5">
              <ScoreDial
                value={result.score}
                tone={result.score >= 70 ? 'pass' : 'neutral'}
                caption={`${right} sur ${result.answers.length}, dont ${result.unaided} sans aide`}
              />
            </div>

            {/* Le récap des ratés est l'écran utile : le score se regarde une seconde, la
                liste des formes manquées se relit. */}
            {missed.length > 0 && (
              <div className="card-sand mt-8 p-5">
                <h2 className="display text-lg">À revoir</h2>
                <ul className="mt-3 space-y-3">
                  {missed.map((a) => (
                    <li key={a.exercise.id} className="text-sm">
                      {/* La consigne est reprise : hors contexte, « Enta ___ » ne dit pas
                          de quel verbe il s'agissait, et la ligne devient illisible. */}
                      <p className="text-xs text-[var(--muted)]">{a.exercise.instruction}</p>
                      <p className="mt-0.5">
                        <ArabicText>{a.exercise.sentence}</ArabicText>
                      </p>
                      <p className="mt-0.5">
                        <span className="font-semibold text-[var(--malachite-text)]">
                          {a.exercise.answer}
                        </span>
                        {a.exercise.glosses[a.exercise.answer] && (
                          <span>
                            {' '}
                            (<ArabicText>{a.exercise.glosses[a.exercise.answer]}</ArabicText>)
                          </span>
                        )}
                        {a.given.trim() && (
                          <span className="text-[var(--muted)]">
                            {' '}
                            — vous aviez écrit « {a.given.trim()} »
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {missed.length === 0 && (
              <p className="mt-7 rounded-[var(--r-sm)] bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] px-4 py-3 text-sm text-[var(--malachite-text)]">
                Série parfaite. Relancez-en une : le tirage change à chaque fois.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {/* La graine est tirée dans le gestionnaire de clic, jamais pendant le rendu :
                  c'est ce qui garde la page idempotente tout en donnant une série
                  différente à chaque relance. */}
              <button
                type="button"
                onClick={() => {
                  const seed = Math.floor(Math.random() * 1_000_000);
                  const query = new URLSearchParams({ seed: String(seed) });
                  if (theme) query.set('theme', theme);
                  router.push(`/entrainement/${setId}?${query}`);
                }}
                className="btn-sand"
              >
                Nouvelle série
              </button>
              <Link href="/entrainement" className="btn-outline">
                Changer d’exercice
              </Link>
            </div>
          </div>
        );
      }}
    />
  );
}
