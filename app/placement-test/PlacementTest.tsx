'use client';

import Link from 'next/link';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';
import ScoreDial from '@/components/ScoreDial';
import { assignLevel, breakdown } from '@/lib/quiz-scoring';

export default function PlacementTest({
  questions,
  isLoggedIn,
  onComplete,
}: {
  questions: QuizQuestionView[];
  isLoggedIn: boolean;
  onComplete: (result: QuizResult) => Promise<void>;
}) {
  return (
    <QuizEngine
      questions={questions}
      onComplete={onComplete}
      renderResult={(result: QuizResult) => {
        const level = assignLevel(result.answers);
        const rows = breakdown(result.answers);

        return (
          <div>
            <p className="eyebrow">Votre niveau estimé</p>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <p className="display text-7xl leading-none">{level}</p>
              <ScoreDial
                value={result.score}
                caption={`sur ${result.answers.length} questions`}
              />
            </div>

            {/* Le détail par palier : c'est lui qui rend le résultat crédible. Un niveau
                annoncé sans montrer où ça a cassé se discute ; celui-ci s'explique. */}
            <table className="mt-8 w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row) => {
                  const pct = row.total === 0 ? 0 : Math.round((row.correct / row.total) * 100);
                  return (
                    <tr key={row.level}>
                      <td className="py-2.5 font-medium">{row.level}</td>
                      <td className="w-1/2 py-2.5">
                        <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 60 ? 'var(--malachite)' : 'var(--carmine)',
                            }}
                          />
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[var(--muted)] tabular">
                        {row.correct} / {row.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-6 text-sm text-[var(--muted)]">
              Un palier est validé à partir de 60 % de bonnes réponses, et la progression
              s&apos;arrête au premier palier manqué.
            </p>

            {isLoggedIn ? (
              <p className="mt-6 text-sm text-[var(--malachite-text)]">
                Niveau enregistré sur votre profil.
              </p>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)]">
                <Link href="/auth/signup" className="underline">
                  Créez un compte
                </Link>{' '}
                pour enregistrer ce niveau et suivre votre progression.
              </p>
            )}

            <div className="mt-8 flex gap-3">
              <Link
                href="/modules"
                className="btn-sand"
              >
                Voir les modules
              </Link>
              {isLoggedIn && (
                <Link
                  href="/profile"
                  className="btn-outline"
                >
                  Mon profil
                </Link>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
