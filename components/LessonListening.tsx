'use client';

import { useState } from 'react';
import QuizEngine, { type QuizQuestionView } from './QuizEngine';
import ListeningResult from './ListeningResult';

/**
 * Bloc « À l'oreille » en fin de leçon : les mots de la leçon, joués sans être écrits.
 *
 * Fermé par défaut : un son qui part tout seul à l'ouverture d'une leçon surprend, et la
 * lecture automatique n'est de toute façon permise qu'après un geste de l'élève — le clic
 * sur « Commencer » en est un. Rien n'est enregistré, comme dans l'entraînement.
 */
export default function LessonListening({ questions }: { questions: QuizQuestionView[] }) {
  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState(questions);
  const [round, setRound] = useState(0);

  return (
    <section className="card-sand mt-12 p-5 sm:p-6" aria-labelledby="ecoute-titre">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="ecoute-titre" className="display text-xl">
            À l’oreille
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Les {questions.length} mots de cette leçon, prononcés sans être écrits : retrouvez
            leur sens.
          </p>
        </div>
        {!started && (
          <button type="button" onClick={() => setStarted(true)} className="btn-sand">
            ▶ Commencer
          </button>
        )}
      </div>

      {started && (
        <div className="mt-6">
          <QuizEngine
            key={round}
            questions={order}
            renderResult={(result) => (
              <ListeningResult title="À l’oreille" result={result} questions={order}>
                <button
                  type="button"
                  onClick={() => {
                    // Nouvel ordre tiré au clic, pas pendant le rendu.
                    setOrder([...questions].sort(() => Math.random() - 0.5));
                    setRound((r) => r + 1);
                  }}
                  className="btn-sand"
                >
                  Recommencer
                </button>
                <button type="button" onClick={() => setStarted(false)} className="btn-outline">
                  Fermer
                </button>
              </ListeningResult>
            )}
          />
        </div>
      )}
    </section>
  );
}
