'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { todayKey } from '@/lib/daily';
import type { Answer } from '@/lib/quiz-scoring';

/**
 * Enregistre la leçon du jour.
 *
 * L'insertion peut échouer sur la contrainte unique (user_id, review_date) si l'apprenant
 * rejoue la même journée — c'est le comportement voulu et non une erreur : la première
 * tentative du jour fait foi, et l'XP n'est donc versée qu'une fois.
 */
export async function saveDailyReview(result: { answers: Answer[]; score: number }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('daily_reviews').insert({
    user_id: user.id,
    review_date: todayKey(),
    score: result.score,
    item_count: result.answers.length,
  });

  // 23505 = violation de contrainte unique : la leçon du jour était déjà faite.
  if (error) {
    if (error.code !== '23505') throw new Error(error.message);
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_points')
    .eq('id', user.id)
    .maybeSingle<{ xp_points: number }>();

  // L'XP du jour suit le score : réviser sérieusement rapporte plus que cliquer au hasard,
  // mais l'essentiel est d'avoir ouvert la leçon.
  await supabase
    .from('profiles')
    .update({ xp_points: (profile?.xp_points ?? 0) + Math.round(result.score / 10) })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
}
