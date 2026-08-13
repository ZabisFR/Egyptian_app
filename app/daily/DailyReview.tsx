'use client';

import Link from 'next/link';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';
import ScoreDial from '@/components/ScoreDial';

export default function DailyReview({
  questions,
  onComplete,
}: {
  questions: QuizQuestionView[];
  onComplete: (result: QuizResult) => Promise<void>;
}) {
  return (
    <QuizEngine
      questions={questions}
      onComplete={onComplete}
      renderResult={(result: QuizResult) => {
        const correct = result.answers.filter((a) => a.correct).length;
        const missed = result.answers.filter((a) => !a.correct);

        return (
          <div>
            <p className="eyebrow">Révision du jour terminée</p>

            <div className="mt-5">
              <ScoreDial
                value={result.score}
                tone={missed.length === 0 ? 'pass' : 'neutral'}
                caption={`${correct} sur ${result.answers.length} — revenez demain pour une nouvelle sélection.`}
              />
            </div>

            {missed.length > 0 && (
              <section className="mt-8">
                <h2 className="eyebrow">À revoir ({missed.length})</h2>
                <ul className="mt-3 divide-y divide-[var(--border)]">
                  {missed.map((a) => {
                    const q = questions.find((x) => x.id === a.question_id);
                    if (!q) return null;
                    return (
                      <li key={a.question_id} className="py-2 text-sm">
                        <p className="text-[var(--muted)]">{q.question_text}</p>
                        <p className="mt-1">
                          <span className="text-[var(--carmine-text)] line-through">
                            {a.given}
                          </span>
                          {' → '}
                          <span className="font-medium text-[var(--malachite-text)]">
                            {q.correct_answer}
                          </span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-sand">
                Tableau de bord
              </Link>
              <Link href="/modules" className="btn-outline">
                Continuer un module
              </Link>
            </div>
          </div>
        );
      }}
    />
  );
}
