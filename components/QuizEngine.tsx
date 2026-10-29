'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import ArabicText from './ArabicText';
import ProgressBar from './ProgressBar';
import { scorePercent, type Answer } from '@/lib/quiz-scoring';

export type QuizQuestionView = {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  difficulty: string | null;
  /** Traduction de chaque proposition, révélée après la réponse (voir `lib/glosses.ts`). */
  glosses?: Record<string, string>;
  /** Question d'écoute (`lib/listening.ts`) : le son à faire entendre. Le mot n'est pas
   *  écrit dans la question, sinon on la lirait au lieu de l'écouter. */
  audio?: string;
  /** Ce qu'on montre une fois la réponse donnée : le mot entendu, écrit. */
  reveal?: string;
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

  // Question d'écoute : le son part de lui-même à l'arrivée de la question. Le clic qui a
  // mené ici (« Question suivante », « Commencer ») autorise la lecture ; si le navigateur
  // la refuse quand même, le bouton « Écouter » reste là.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  function play() {
    if (!question.audio) return;
    audioRef.current?.pause();
    const audio = new Audio(question.audio);
    // L'état suit les événements du lecteur, jamais un appel direct : c'est lui qui sait
    // si la lecture a vraiment démarré (le navigateur peut la refuser).
    audio.onplay = () => setPlaying(true);
    audio.onpause = audio.onended = () => setPlaying(false);
    audioRef.current = audio;
    audio.play().catch(() => {});
  }
  useEffect(() => {
    if (done || !question.audio) return;
    play();
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
    // Une fois par question : `play` change à chaque rendu, la question non.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, done]);

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
      // Une frappe dans un champ (la recherche du haut de page) appartient au champ :
      // sans ce garde, taper « r » ou un chiffre y rejouait le son ou choisissait une réponse.
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      if (event.key === 'Enter' && picked !== null) {
        event.preventDefault();
        next();
        return;
      }

      if (question.audio && (event.key === 'r' || event.key === 'R')) {
        event.preventDefault();
        play();
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
        <ArabicText>{question.question_text}</ArabicText>
      </h2>

      {question.audio && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={play}
            className="btn-outline gap-2"
            aria-label={playing ? 'Lecture en cours, réécouter' : 'Écouter le mot'}
          >
            <span aria-hidden="true">{playing ? '♪' : '▶'}</span>
            {picked === null ? 'Écouter' : 'Réécouter'}
            <kbd className="hidden rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-70 sm:inline">
              R
            </kbd>
          </button>
          {/* Le mot écrit n'apparaît qu'après la réponse : avant, on le lirait. */}
          {picked !== null && question.reveal && (
            <p className="fade-in text-lg font-semibold">
              <ArabicText>{question.reveal}</ArabicText>
            </p>
          )}
        </div>
      )}

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
                <span className="flex-1 text-left">
                  <ArabicText>{choice}</ArabicText>
                  {/* Après la réponse seulement : avant, la traduction la donnerait. */}
                  {picked !== null && question.glosses?.[choice] && (
                    <span className="choice-gloss">
                      <ArabicText>{question.glosses[choice]}</ArabicText>
                    </span>
                  )}
                </span>
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
