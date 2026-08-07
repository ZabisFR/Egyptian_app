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
            <p className="text-sm text-neutral-500">Votre niveau estimé</p>
            <p className="mt-1 text-5xl font-bold">{level}</p>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              {result.score}% de bonnes réponses sur {result.answers.length} questions.
            </p>

            <table className="mt-8 w-full text-sm">
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {rows.map((row) => (
                  <tr key={row.level}>
                    <td className="py-2 font-medium">{row.level}</td>
                    <td className="py-2 text-right text-neutral-500">
                      {row.correct} / {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-6 text-sm text-neutral-500">
              Un palier est validé à partir de 60 % de bonnes réponses, et la progression
              s&apos;arrête au premier palier manqué.
            </p>

            {isLoggedIn ? (
              <p className="mt-6 text-sm text-emerald-700 dark:text-emerald-400">
                Niveau enregistré sur votre profil.
              </p>
            ) : (
              <p className="mt-6 text-sm text-neutral-500">
                <Link href="/auth/signup" className="underline">
                  Créez un compte
                </Link>{' '}
                pour enregistrer ce niveau et suivre votre progression.
              </p>
            )}

            <div className="mt-8 flex gap-3">
              <Link
                href="/modules"
                className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Voir les modules
              </Link>
              {isLoggedIn && (
                <Link
                  href="/profile"
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
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
