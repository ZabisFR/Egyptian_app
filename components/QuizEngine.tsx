'use client';

import { useEffect, useState, useTransition } from 'react';
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
  const wasRight = picked !== null && picked === question.correct_answer;

  // Série de bonnes réponses consécutives : c'est la mécanique qui donne envie
  // d'enchaîner. Recalculée depuis les réponses plutôt que gardée dans un état à part —
  // impossible qu'elle se désynchronise du score.
  const streak = (() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) n++;
    return n;
  })();

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

  // Clavier : les chiffres choisissent, Entrée enchaîne. Sur un quiz de vingt questions,
  // c'est la différence entre « répondre » et « viser puis cliquer » vingt fois.
  // Les raccourcis sont affichés sur chaque bouton : un raccourci invisible n'existe pas.
  useEffect(() => {
    if (done) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Enter' && picked !== null) {
        event.preventDefault();
        next();
        return;
      }

      const n = Number(event.key);
      if (picked === null && Number.isInteger(n) && n >= 1 && n <= question.choices.length) {
        event.preventDefault();
        pick(question.choices[n - 1]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (done) {
    return (
      <div className="fade-in">
        {renderResult({ answers, score: scorePercent(answers) })}
        {saving && <p className="mt-4 text-sm text-[var(--muted)]">Enregistrement…</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow tabular">
          Question {index + 1} / {questions.length}
        </p>
        {streak >= 2 && (
          <p className="cartouche pop" key={streak}>
            Série de {streak}
          </p>
        )}
      </div>

      <div className="mt-2">
        <ProgressBar
          value={index}
          max={questions.length}
          label={`Question ${index + 1} sur ${questions.length}`}
          showLabel={false}
        />
      </div>

      {/* `key` sur la question : React remonte le bloc à chaque changement, ce qui rejoue
          l'animation d'entrée. Sans lui, seul le texte changerait, sur place. */}
      <h2 key={question.id} className="display rise mt-8 text-2xl leading-snug sm:text-3xl">
        {question.question_text}
      </h2>

      {/* Annonce vocale du résultat : sans elle, un lecteur d'écran ne signale que le
          changement de couleur — c'est-à-dire rien. */}
      <p aria-live="polite" className="sr-only">
        {picked === null
          ? ''
          : wasRight
            ? 'Bonne réponse.'
            : `Mauvaise réponse. La bonne réponse est ${question.correct_answer}.`}
      </p>

      <ul className="mt-6 space-y-2.5">
        {question.choices.map((choice, i) => {
          const isCorrect = choice === question.correct_answer;
          const isPicked = choice === picked;

          let tone = 'choice';
          if (picked !== null) {
            if (isCorrect) tone = 'choice choice-right pop';
            else if (isPicked) tone = 'choice choice-wrong shake';
            else tone = 'choice choice-faded';
          }

          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => pick(choice)}
                disabled={picked !== null}
                aria-pressed={isPicked}
                className={tone}
              >
                <span className="choice-key" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="flex-1 text-left">{choice}</span>
                {picked !== null && isCorrect && (
                  <span aria-hidden="true" className="text-[var(--malachite-text)]">
                    ✓
                  </span>
                )}
                {picked !== null && isPicked && !isCorrect && (
                  <span aria-hidden="true" className="text-[var(--carmine-text)]">
                    ✗
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {picked !== null && (
        <div className="fade-in mt-7">
          <p
            className={`text-sm font-semibold ${
              wasRight ? 'text-[var(--malachite-text)]' : 'text-[var(--carmine-text)]'
            }`}
          >
            {wasRight ? 'Exact.' : `La bonne réponse était : ${question.correct_answer}`}
          </p>
          <button type="button" onClick={next} className="btn-sand mt-3 w-full">
            {isLast ? 'Voir mon résultat' : 'Question suivante'}
            <kbd className="hidden rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-70 sm:inline">
              Entrée
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}
