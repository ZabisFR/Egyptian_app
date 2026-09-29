import { getModules } from '@/lib/content';
import { createClient } from '@/lib/supabase/server';
import { PASS_THRESHOLD } from '@/lib/quiz-scoring';
import type { ModuleStatus } from '@/lib/types';

export type ModuleProgress = {
  moduleId: string;
  lessonsRead: number;
  lessonsTotal: number;
  bestScore: number | null;
  quizPassed: boolean;
  status: ModuleStatus;
};

/**
 * Un module est terminé quand **toutes ses leçons sont lues ET son quiz est réussi**.
 *
 * Le quiz seul ne suffit pas : sur un QCM à 4 choix, 70 % reste atteignable en ayant
 * survolé le contenu. Inversement, lire sans jamais se tester ne prouve rien. Les deux
 * signaux ensemble sont la seule combinaison qui veut dire quelque chose.
 */
export function deriveStatus(
  lessonsRead: number,
  lessonsTotal: number,
  bestScore: number | null
): ModuleStatus {
  const quizPassed = (bestScore ?? 0) >= PASS_THRESHOLD;
  if (lessonsTotal > 0 && lessonsRead >= lessonsTotal && quizPassed) return 'completed';
  if (lessonsRead > 0 || bestScore !== null) return 'in_progress';
  return 'not_started';
}

/**
 * Progression de l'utilisateur sur tous les modules. Le nombre de leçons vient du cache de
 * contenu ; seules les deux lectures propres à l'utilisateur interrogent la base, et
 * aucune pour un visiteur anonyme.
 */
export async function getAllProgress(userId: string | null) {
  const totals = new Map((await getModules()).map((m) => [m.id, m.lessonCount]));

  if (!userId) {
    return new Map<string, ModuleProgress>(
      [...totals].map(([moduleId, lessonsTotal]) => [
        moduleId,
        {
          moduleId,
          lessonsRead: 0,
          lessonsTotal,
          bestScore: null,
          quizPassed: false,
          status: 'not_started' as ModuleStatus,
        },
      ])
    );
  }

  const supabase = await createClient();
  const [{ data: reads }, { data: progressRows }] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('module_id')
      .eq('user_id', userId)
      .returns<{ module_id: string }[]>(),
    supabase
      .from('user_progress')
      .select('module_id, best_score')
      .eq('user_id', userId)
      .returns<{ module_id: string; best_score: number | null }[]>(),
  ]);

  const readCounts = new Map<string, number>();
  for (const row of reads ?? []) {
    readCounts.set(row.module_id, (readCounts.get(row.module_id) ?? 0) + 1);
  }
  const bestScores = new Map(
    (progressRows ?? []).map((r) => [r.module_id, r.best_score])
  );

  return new Map<string, ModuleProgress>(
    [...totals].map(([moduleId, lessonsTotal]) => {
      const lessonsRead = readCounts.get(moduleId) ?? 0;
      const bestScore = bestScores.get(moduleId) ?? null;
      return [
        moduleId,
        {
          moduleId,
          lessonsRead,
          lessonsTotal,
          bestScore,
          quizPassed: (bestScore ?? 0) >= PASS_THRESHOLD,
          status: deriveStatus(lessonsRead, lessonsTotal, bestScore),
        },
      ];
    })
  );
}

/** Rangs des leçons déjà lues dans un module donné. */
export async function getReadLessons(userId: string | null, moduleId: string) {
  if (!userId) return new Set<number>();

  const supabase = await createClient();
  const { data } = await supabase
    .from('lesson_completions')
    .select('lesson_order_index')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .returns<{ lesson_order_index: number }[]>();

  return new Set((data ?? []).map((r) => r.lesson_order_index));
}
