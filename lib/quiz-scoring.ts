import type { Level } from '@/lib/types';

export const LEVEL_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2'];

/** Seuil de réussite d'un palier du test de positionnement. */
const PASS_RATIO = 0.6;

/**
 * Seuil de validation d'un module, conforme au flow de l'architecture.
 *
 * Vit ici et non dans les actions du quiz : un fichier `'use server'` ne peut exporter que
 * des fonctions async, une constante y provoque une erreur de compilation Next.
 */
export const PASS_THRESHOLD = 70;

export type Answer = {
  question_id: string;
  given: string;
  correct: boolean;
  difficulty: string | null;
};

export function scorePercent(answers: Answer[]): number {
  if (answers.length === 0) return 0;
  return Math.round((answers.filter((a) => a.correct).length / answers.length) * 100);
}

/**
 * Assigne un niveau en montant palier par palier et en s'arrêtant au premier échec.
 *
 * Réussir B2 en ayant raté A2 ne signifie pas qu'on est B2 : c'est plus probablement de la
 * chance sur un QCM à 4 choix. On ne valide donc un palier que si tous les précédents le
 * sont aussi. Un apprenant qui échoue dès A1 reste en A1 — c'est le point de départ, pas
 * une sanction.
 */
export function assignLevel(answers: Answer[]): Level {
  let level: Level = 'A1';

  for (const candidate of LEVEL_ORDER) {
    const forLevel = answers.filter((a) => a.difficulty === candidate);
    if (forLevel.length === 0) continue;

    const ratio = forLevel.filter((a) => a.correct).length / forLevel.length;
    if (ratio < PASS_RATIO) break;
    level = candidate;
  }

  return level;
}

/** Détail par palier, pour expliquer le résultat à l'apprenant. */
export function breakdown(answers: Answer[]) {
  return LEVEL_ORDER.map((level) => {
    const forLevel = answers.filter((a) => a.difficulty === level);
    return {
      level,
      correct: forLevel.filter((a) => a.correct).length,
      total: forLevel.length,
    };
  }).filter((row) => row.total > 0);
}
