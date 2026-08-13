'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';
import ScoreDial from '@/components/ScoreDial';

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
            <p className="eyebrow">{moduleTitle}</p>

            <div className="mt-5">
              <ScoreDial
                value={result.score}
                tone={passed ? 'pass' : 'fail'}
                caption={`${correct} bonnes réponses sur ${result.answers.length}`}
              />
            </div>

            <p
              className={`mt-7 rounded-[var(--r-sm)] px-4 py-3 text-sm ${
                passed
                  ? 'bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] text-[var(--malachite-text)]'
                  : 'bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[var(--gold-text)]'
              }`}
            >
              {passed
                ? `Module validé — il fallait ${passThreshold} %.`
                : `Il faut ${passThreshold} % pour valider le module. Relisez les leçons et retentez, le quiz est refaisable autant de fois que nécessaire.`}
            </p>

            {isLoggedIn ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Résultat enregistré. L&apos;XP suit votre meilleur score : refaire un quiz
                déjà réussi ne rapporte rien de plus.
              </p>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                <Link href="/auth/signup" className="underline">
                  Créez un compte
                </Link>{' '}
                pour enregistrer votre progression.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/modules/${moduleId}`}
                className="btn-sand"
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
                className="btn-outline"
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
