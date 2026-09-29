'use client';

import { useEffect, useRef, useState } from 'react';
import ArabicText from './ArabicText';
import ProgressBar from './ProgressBar';
import { judgeAnswer, type Verdict } from '@/lib/arabizi';
import type { Exercise } from '@/lib/exercises';

/**
 * Moteur des exercices à trou : on tape la réponse, on ne la choisit pas.
 *
 * C'est la différence avec `QuizEngine`, et elle est volontaire : reconnaître « Baroo7 »
 * parmi quatre formes n'apprend pas à la produire. Le QCM reste disponible, mais seulement
 * après avoir cliqué « je sèche » — l'aide est un choix conscient, et l'écran de résultat
 * distingue ensuite les réponses trouvées seul de celles trouvées avec les propositions.
 *
 * Aucune donnée n'est envoyée au serveur : l'entraînement ne compte ni dans l'XP ni dans
 * la validation des modules. On peut donc se tromper autant qu'on veut, ce qui est la
 * condition pour oser répondre sans réfléchir à ce qu'on risque.
 */

export type DrillAnswer = {
  exercise: Exercise;
  given: string;
  verdict: Verdict;
  /** L'apprenant a demandé les propositions avant de répondre. */
  helped: boolean;
};

export type DrillResult = {
  answers: DrillAnswer[];
  /** Pourcentage de réponses justes, aide comprise. */
  score: number;
  /** Combien de justes l'ont été sans les propositions. */
  unaided: number;
};

/** Le trou se lit comme un trou : un long tiret bas est plus visible que trois. */
function Sentence({ text }: { text: string }) {
  const parts = text.split('___');

  return (
    <p className="display text-2xl leading-relaxed sm:text-3xl">
      {parts.map((part, i) => (
        <span key={i}>
          <ArabicText>{part}</ArabicText>
          {i < parts.length - 1 && (
            <span
              aria-label="mot manquant"
              className="mx-1 inline-block w-24 border-b-2 border-dashed border-[var(--gold)] align-baseline"
            />
          )}
        </span>
      ))}
    </p>
  );
}

export default function DrillEngine({
  exercises,
  renderResult,
}: {
  exercises: Exercise[];
  renderResult: (result: DrillResult) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showChoices, setShowChoices] = useState(false);
  const [answers, setAnswers] = useState<DrillAnswer[]>([]);
  const [done, setDone] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);

  const exercise = exercises[index];
  const isLast = index === exercises.length - 1;

  // La série de bonnes réponses est recalculée depuis les réponses plutôt que gardée à
  // part : impossible qu'elle se désynchronise du reste.
  const streak = (() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0 && answers[i].verdict !== 'wrong'; i--) n++;
    return n;
  })();

  // Le champ reprend le focus à chaque exercice : sur une série de dix, aller rechercher
  // le curseur à la souris dix fois casse le rythme.
  useEffect(() => {
    if (!done && verdict === null) fieldRef.current?.focus();
  }, [index, done, verdict]);

  function submit(given: string, helped: boolean) {
    if (verdict !== null) return; // une seule réponse par exercice

    // Le champ reflète ce qui a été répondu, même quand la réponse vient d'une
    // proposition : sur l'écran figé, un champ vide laisserait croire qu'on n'a rien joué.
    setInput(given);

    const result = judgeAnswer(given, exercise.answer, exercise.accepted);
    setVerdict(result);
    setAnswers((prev) => [...prev, { exercise, given, verdict: result, helped }]);
  }

  function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setInput('');
      setVerdict(null);
      setShowChoices(false);
      return;
    }
    setDone(true);
  }

  // Entrée fait tout : valider, puis enchaîner. Les chiffres ne servent que lorsque les
  // propositions sont affichées — sinon ils doivent pouvoir être tapés dans le champ.
  useEffect(() => {
    if (done) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (verdict !== null) next();
        else if (input.trim()) submit(input, showChoices);
        return;
      }

      if (verdict !== null || !showChoices) return;

      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= exercise.choices.length) {
        event.preventDefault();
        submit(exercise.choices[n - 1], true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (done) {
    const right = answers.filter((a) => a.verdict !== 'wrong');
    return (
      <div className="fade-in">
        {renderResult({
          answers,
          score: Math.round((right.length / answers.length) * 100),
          unaided: right.filter((a) => !a.helped).length,
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow tabular">
          {index + 1} / {exercises.length}
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
          max={exercises.length}
          label={`Exercice ${index + 1} sur ${exercises.length}`}
          showLabel={false}
        />
      </div>

      {/* `key` sur le bloc : React le remonte à chaque exercice, ce qui rejoue l'animation
          d'entrée. Sans lui, seul le texte changerait, sur place. */}
      <div key={exercise.id} className="rise mt-8">
        <p className="text-sm font-semibold text-[var(--lapis-text)]">
          {exercise.instruction}
        </p>

        <div className="mt-3">
          <Sentence text={exercise.sentence} />
        </div>

        {exercise.hint && (
          <p className="mt-3 text-sm text-[var(--muted)]">{exercise.hint}</p>
        )}
      </div>

      <form
        className="mt-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (verdict !== null) next();
          else if (input.trim()) submit(input, showChoices);
        }}
      >
        <label className="block">
          <span className="sr-only">Votre réponse</span>
          <input
            ref={fieldRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={verdict !== null}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Tapez le mot manquant"
            aria-invalid={verdict === 'wrong'}
            className={`pop-field w-full px-4 py-3.5 text-lg outline-none ${
              verdict === null ? '' : verdict === 'wrong' ? 'pop-field-wrong' : 'pop-field-right'
            }`}
          />
        </label>

        {verdict === null && (
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="submit" disabled={!input.trim()} className="btn-sand disabled:opacity-40">
              Valider
              <kbd className="hidden rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-70 sm:inline">
                Entrée
              </kbd>
            </button>
            {!showChoices && (
              <button
                type="button"
                onClick={() => setShowChoices(true)}
                className="btn-outline"
              >
                Je sèche
              </button>
            )}
          </div>
        )}
      </form>

      {/* Les propositions n'apparaissent qu'à la demande. Elles restent visibles après
          coup : c'est en revoyant les trois formes voisines qu'on comprend son erreur. */}
      {showChoices && (
        <ul className="fade-in mt-5 space-y-2.5">
          {exercise.choices.map((choice, i) => {
            const isCorrect = choice === exercise.answer;
            let tone = 'choice';
            if (verdict !== null) {
              if (isCorrect) tone = 'choice choice-right';
              else tone = 'choice choice-faded';
            }

            return (
              <li key={choice}>
                <button
                  type="button"
                  onClick={() => submit(choice, true)}
                  disabled={verdict !== null}
                  className={tone}
                >
                  <span className="choice-key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-left">
                    {choice}
                    {/* La traduction n'apparaît qu'après la réponse : avant, elle la donnerait. */}
                    {verdict !== null && exercise.glosses[choice] && (
                      <span className="choice-gloss">
                        <ArabicText>{exercise.glosses[choice]}</ArabicText>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Sans cette annonce, un lecteur d'écran ne signale qu'un changement de couleur de
          bordure — c'est-à-dire rien. */}
      <p aria-live="polite" className="sr-only">
        {verdict === null
          ? ''
          : verdict === 'wrong'
            ? `Raté. La réponse était ${exercise.answer}.`
            : `Juste. On écrit ${exercise.answer}.`}
      </p>

      {verdict !== null && (
        <div className="fade-in mt-6">
          <p
            className={`text-sm font-semibold ${
              verdict === 'wrong' ? 'text-[var(--carmine-text)]' : 'text-[var(--malachite-text)]'
            }`}
          >
            {verdict === 'exact' && 'Exact.'}
            {/* On valide la réponse mais on montre la graphie du cours : l'Arabizi n'a pas
                d'orthographe officielle, ce n'est pas une raison pour en apprendre une
                approximative. */}
            {verdict === 'close' && `Juste — au détail près : on écrit « ${exercise.answer} ».`}
            {verdict === 'wrong' && `Raté. La réponse était « ${exercise.answer} ».`}
          </p>

          {exercise.glosses[exercise.answer] && (
            <p className="mt-1 text-sm">
              <span className="font-medium">{exercise.answer}</span>
              {' = '}
              <ArabicText>{exercise.glosses[exercise.answer]}</ArabicText>
            </p>
          )}

          {exercise.note && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              <ArabicText>{exercise.note.replace(/\*\*/g, '').replace(/\*/g, '')}</ArabicText>
            </p>
          )}

          <button type="button" onClick={next} className="btn-sand mt-4 w-full">
            {isLast ? 'Voir mon résultat' : 'Exercice suivant'}
            <kbd className="hidden rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold opacity-70 sm:inline">
              Entrée
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}
