'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';

export default function ModuleQuiz({
  moduleId,
  moduleTitle,
  questions,
  isLoggedIn,
  passThreshold,
  onComplete,
}: {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestionView[];
  isLoggedIn: boolean;
  passThreshold: number;
  onComplete: (result: QuizResult) => Promise<void>;
}) {
  const router = useRouter();

  return (
    <QuizEngine
      questions={questions}
      onComplete={onComplete}
      renderResult={(result: QuizResult) => {
        const correct = result.answers.filter((a) => a.correct).length;
        const passed = result.score >= passThreshold;

        return (
          <div>
            <p className="text-sm text-neutral-500">{moduleTitle}</p>
            <p className="mt-1 text-5xl font-bold">{result.score}%</p>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              {correct} bonnes réponses sur {result.answers.length}.
            </p>

            <p
              className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                passed
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {passed
                ? `Module validé — il fallait ${passThreshold} %.`
                : `Il faut ${passThreshold} % pour valider le module. Relisez les leçons et retentez, le quiz est refaisable autant de fois que nécessaire.`}
            </p>

            {isLoggedIn ? (
              <p className="mt-4 text-sm text-neutral-500">
                Résultat enregistré. L&apos;XP suit votre meilleur score : refaire un quiz
                déjà réussi ne rapporte rien de plus.
              </p>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                <Link href="/auth/signup" className="underline">
                  Créez un compte
                </Link>{' '}
                pour enregistrer votre progression.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/modules/${moduleId}`}
                className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Retour au module
              </Link>
              {/* La graine est tirée dans le gestionnaire de clic, pas pendant le rendu :
                  c'est ce qui garde le composant idempotent tout en donnant un ordre
                  différent à chaque nouvelle tentative. */}
              <button
                type="button"
                onClick={() => {
                  const seed = Math.floor(Math.random() * 1_000_000);
                  router.push(`/modules/${moduleId}/quiz?seed=${seed}`);
                  router.refresh();
                }}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Refaire le quiz
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
