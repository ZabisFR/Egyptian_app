import { createClient } from '@/lib/supabase/server';
import { todayKey } from '@/lib/daily';

export type Streak = {
  /** Jours consécutifs jusqu'à aujourd'hui (ou hier, si le jour n'est pas encore fait). 0
   *  si la série est déjà rompue — jamais une valeur périmée. */
  current: number;
  /** Le plus long enchaînement jamais atteint, y compris s'il est rompu depuis. */
  best: number;
  doneToday: boolean;
};

const ZERO: Streak = { current: 0, best: 0, doneToday: false };

/** Écart en jours entre deux dates `YYYY-MM-DD` (UTC minuit des deux côtés : le fuseau
 *  n'entre pas en jeu, seul compte l'écart de calendrier). */
function joursEntre(plusAncienne: string, plusRecente: string): number {
  return Math.round((Date.parse(plusRecente) - Date.parse(plusAncienne)) / 86_400_000);
}

/**
 * Calcul pur, séparé de `getStreak` pour rester testable sans contexte Next.js : cette
 * fonction ne touche ni Supabase ni `next/headers`, un script `tsx` autonome peut donc
 * l'exercer directement.
 *
 * `dates` doit être trié du plus récent au plus ancien, au format `YYYY-MM-DD`.
 */
export function computeStreak(dates: string[], today: string): Streak {
  if (dates.length === 0) return ZERO;

  const doneToday = dates[0] === today;

  // La série courante ne compte que si elle touche aujourd'hui ou hier : un jour manqué
  // avant-hier, même avec quinze jours d'ancienne série, donne 0 — pas quinze.
  let current = 0;
  if (doneToday || joursEntre(dates[0], today) === 1) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (joursEntre(dates[i], dates[i - 1]) !== 1) break;
      current++;
    }
  }

  // Le record, lui, regarde tout l'historique — y compris des séries déjà refermées.
  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = joursEntre(dates[i], dates[i - 1]) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  return { current, best: Math.max(best, current), doneToday };
}

/**
 * Série de jours consécutifs de leçon du jour, calculée à la volée depuis l'historique —
 * jamais stockée en base.
 *
 * Un compteur stocké (`profiles.streak_count`) se serait figé au dernier jour où il a été
 * mis à jour, c'est-à-dire la dernière fois que l'utilisateur a fait sa leçon du jour. En
 * cas d'absence de trois jours, la page continuerait d'afficher l'ancienne série tant que
 * l'utilisateur n'a pas rouvert /daily pour la « casser » explicitement — un compteur
 * optimiste qui ment. En la recalculant à chaque lecture depuis `daily_reviews`, la série
 * affichée est toujours celle du jour même, y compris quand elle vient de se rompre sans
 * qu'aucune action n'ait eu lieu.
 *
 * Le volume par utilisateur reste minuscule (une ligne par jour, au mieux quelques
 * milliers sur plusieurs années) : charger tout l'historique pour le recalcul coûte moins
 * qu'une jointure, et évite d'avoir deux sources de vérité à synchroniser.
 */
export async function getStreak(userId: string): Promise<Streak> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('daily_reviews')
    .select('review_date')
    .eq('user_id', userId)
    .order('review_date', { ascending: false })
    .returns<{ review_date: string }[]>();

  const dates = (data ?? []).map((d) => d.review_date);
  return computeStreak(dates, todayKey());
}
