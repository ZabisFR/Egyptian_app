'use client';

import Link from 'next/link';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';
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
            <p className="text-sm text-[var(--muted)]">Votre niveau estimé</p>
            <p className="display mt-1 text-6xl">{level}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {result.score}% de bonnes réponses sur {result.answers.length} questions.
            </p>

            <table className="mt-8 w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row) => (
                  <tr key={row.level}>
                    <td className="py-2 font-medium">{row.level}</td>
                    <td className="py-2 text-right text-[var(--muted)]">
                      {row.correct} / {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-6 text-sm text-[var(--muted)]">
              Un palier est validé à partir de 60 % de bonnes réponses, et la progression
              s&apos;arrête au premier palier manqué.
            </p>

            {isLoggedIn ? (
              <p className="mt-6 text-sm text-[var(--malachite)]">
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
                  className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[color-mix(in_srgb,var(--gold)_10%,transparent)]"
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
