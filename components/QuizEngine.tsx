'use client';

import { useState, useTransition } from 'react';
import ProgressBar from './ProgressBar';
import { scorePercent, type Answer } from '@/lib/quiz-scoring';

export type QuizQuestionView = {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  difficulty: string | null;
};

export type QuizResult = { answers: Answer[]; score: number };

export default function QuizEngine({
  questions,
  onComplete,
  renderResult,
}: {
  /** Déjà dans l'ordre voulu : le mélange éventuel se fait côté serveur, par graine. */
  questions: QuizQuestionView[];
  /** Server action appelée une seule fois, à la fin. */
  onComplete?: (result: QuizResult) => Promise<void>;
  renderResult: (result: QuizResult) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState(false);
  const [saving, startSaving] = useTransition();

  const question = questions[index];
  const isLast = index === questions.length - 1;

  function pick(choice: string) {
    if (picked !== null) return; // une seule réponse par question
    setPicked(choice);
    setAnswers((prev) => [
      ...prev,
      {
        question_id: question.id,
        given: choice,
        correct: choice === question.correct_answer,
        difficulty: question.difficulty,
      },
    ]);
  }

  function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setPicked(null);
      return;
    }

    setDone(true);
    if (onComplete) {
      const result = { answers, score: scorePercent(answers) };
      startSaving(async () => {
        await onComplete(result);
      });
    }
  }

  if (done) {
    return (
      <div>
        {renderResult({ answers, score: scorePercent(answers) })}
        {saving && <p className="mt-4 text-sm text-[var(--muted)]">Enregistrement…</p>}
      </div>
    );
  }

  return (
    <div>
      <ProgressBar
        value={index}
        max={questions.length}
        label={`Question ${index + 1} sur ${questions.length}`}
      />

      <h2 className="display mt-8 text-2xl">{question.question_text}</h2>

      <ul className="mt-6 space-y-2">
        {question.choices.map((choice) => {
          const isCorrect = choice === question.correct_answer;
          const isPicked = choice === picked;

          let tone =
            'border-[var(--border)] hover:border-[var(--gold)] hover:bg-[color-mix(in_srgb,var(--gold)_7%,transparent)]';
          if (picked !== null) {
            if (isCorrect)
              tone =
                'border-[var(--malachite)] bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)]';
            else if (isPicked)
              tone =
                'border-[var(--carmine)] bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)]';
            else tone = 'border-[var(--border)] opacity-45';
          }

          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => pick(choice)}
                disabled={picked !== null}
                aria-pressed={isPicked}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
              >
                {choice}
                {picked !== null && isCorrect && <span className="ml-2">✓</span>}
                {picked !== null && isPicked && !isCorrect && <span className="ml-2">✗</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="btn-sand mt-8 w-full"
        >
          {isLast ? 'Voir mon résultat' : 'Question suivante'}
        </button>
      )}
    </div>
  );
}
