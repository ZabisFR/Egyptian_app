'use client';

import { useState } from 'react';
import Link from 'next/link';
import ArabicText from '@/components/ArabicText';
import QuizEngine, { type QuizQuestionView, type QuizResult } from '@/components/QuizEngine';
import ScoreDial from '@/components/ScoreDial';
import StreakBadge from '@/components/StreakBadge';
import type { Streak } from '@/lib/streak';

export default function DailyReview({
  questions,
  initialStreak,
  onComplete,
}: {
  questions: QuizQuestionView[];
  /** Série au moment où la page a été chargée, avant que ce jour ne compte. */
  initialStreak: Streak;
  onComplete: (result: QuizResult) => Promise<Streak | undefined>;
}) {
  // La série affichée par QuizEngine.renderResult doit être celle D'APRÈS
  // l'enregistrement — sinon l'écran de résultat annoncerait encore hier. `onComplete`
  // de QuizEngine ne fait que déclencher l'appel ; c'est cet état qui porte le résultat
  // jusqu'au rendu, une fois la réponse du serveur arrivée.
  const [streak, setStreak] = useState(initialStreak);

  return (
    <QuizEngine
      questions={questions}
      onComplete={async (result) => {
        const suivante = await onComplete(result);
        if (suivante) setStreak(suivante);
      }}
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

            <div className="mt-4">
              <StreakBadge streak={streak} />
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
                        <p className="text-[var(--muted)]">
                          <ArabicText>{q.question_text}</ArabicText>
                        </p>
                        <p className="mt-1">
                          <span className="text-[var(--carmine-text)] line-through">
                            <ArabicText>{a.given}</ArabicText>
                          </span>
                          {' → '}
                          <span className="font-medium text-[var(--malachite-text)]">
                            <ArabicText>{q.correct_answer}</ArabicText>
                          </span>
                          {q.glosses?.[q.correct_answer] && (
                            <span className="text-[var(--muted)]">
                              {' '}
                              (<ArabicText>{q.glosses[q.correct_answer]}</ArabicText>)
                            </span>
                          )}
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
