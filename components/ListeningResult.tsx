import ArabicText from './ArabicText';
import LetterAudioButton from './LetterAudioButton';
import ScoreDial from './ScoreDial';
import type { QuizQuestionView, QuizResult } from './QuizEngine';

/**
 * Écran de fin d'une série d'écoute (entraînement, fin de leçon) : le score, puis les mots
 * ratés, écrits et réécoutables — c'est la partie utile, le score se regarde une seconde.
 */
export default function ListeningResult({
  title,
  result,
  questions,
  children,
}: {
  title: string;
  result: QuizResult;
  questions: QuizQuestionView[];
  /** Les boutons de suite (nouvelle série, recommencer…). */
  children?: React.ReactNode;
}) {
  const missed = result.answers.filter((a) => !a.correct);
  const right = result.answers.length - missed.length;

  return (
    <div>
      <p className="eyebrow">{title}</p>

      <div className="mt-5">
        <ScoreDial
          value={result.score}
          tone={result.score >= 70 ? 'pass' : 'neutral'}
          caption={`${right} mot${right > 1 ? 's' : ''} reconnu${right > 1 ? 's' : ''} sur ${result.answers.length}`}
        />
      </div>

      {missed.length > 0 ? (
        <div className="card-sand mt-8 p-5">
          <h2 className="display text-lg">À réécouter</h2>
          <ul className="mt-3 space-y-3">
            {missed.map((a) => {
              const q = questions.find((x) => x.id === a.question_id);
              if (!q) return null;
              return (
                <li key={a.question_id} className="flex items-start gap-3 text-sm">
                  {q.audio && (
                    <LetterAudioButton src={q.audio} label={q.reveal ?? q.correct_answer} />
                  )}
                  <div>
                    <p className="font-semibold">
                      <ArabicText>{q.reveal ?? ''}</ArabicText>
                    </p>
                    <p>
                      <span className="text-[var(--malachite-text)]">{q.correct_answer}</span>
                      <span className="text-[var(--muted)]"> — vous aviez choisi « {a.given} »</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-7 rounded-2xl border-2 border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] px-4 py-3 text-sm text-[var(--malachite-text)]">
          Tout reconnu à l’oreille.
        </p>
      )}

      {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}
