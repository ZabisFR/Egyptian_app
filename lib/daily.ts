import { createClient } from '@/lib/supabase/server';
import { seededShuffle } from '@/lib/shuffle';
import type { QuizQuestionView } from '@/components/QuizEngine';

/** Nombre d'items dans la leçon du jour. Court par construction : le but est qu'elle soit
 *  faite tous les jours, pas qu'elle soit exhaustive. */
export const DAILY_SIZE = 10;

/** Il faut au moins de quoi construire un QCM à 4 choix. */
export const DAILY_MIN_POOL = 4;

/**
 * Date du jour au fuseau de l'apprenant.
 *
 * En UTC, la leçon changerait à 1h ou 2h du matin heure française — au milieu d'une
 * session de révision du soir. On ancre donc le découpage sur Europe/Paris.
 */
export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type VocabRow = {
  id: string;
  arabic: string | null;
  transliteration: string;
  french: string;
  lesson_id: string;
};

export type DailyLesson = {
  date: string;
  questions: QuizQuestionView[];
  /** Taille du vivier révisable, pour expliquer à l'apprenant d'où sortent les items. */
  poolSize: number;
  lessonsRead: number;
  alreadyDone: boolean;
  lastScore: number | null;
};

/**
 * Construit la leçon du jour à partir du vocabulaire des leçons déjà marquées lues.
 *
 * On ne révise que ce que l'apprenant a effectivement lu : une révision qui interroge sur
 * du contenu jamais vu n'est pas une révision, c'est un test surprise. Les distracteurs
 * viennent du même vivier, pour la même raison.
 */
export async function getDailyLesson(userId: string): Promise<DailyLesson> {
  const supabase = await createClient();
  const date = todayKey();

  const [{ data: completions }, { data: allLessons }, { data: existing }] =
    await Promise.all([
      supabase
        .from('lesson_completions')
        .select('module_id, lesson_order_index')
        .eq('user_id', userId)
        .returns<{ module_id: string; lesson_order_index: number }[]>(),
      supabase
        .from('lessons')
        .select('id, module_id, order_index')
        .returns<{ id: string; module_id: string; order_index: number }[]>(),
      supabase
        .from('daily_reviews')
        .select('score')
        .eq('user_id', userId)
        .eq('review_date', date)
        .maybeSingle<{ score: number }>(),
    ]);

  const readKeys = new Set(
    (completions ?? []).map((c) => `${c.module_id}#${c.lesson_order_index}`)
  );
  const readLessonIds = (allLessons ?? [])
    .filter((l) => readKeys.has(`${l.module_id}#${l.order_index}`))
    .map((l) => l.id);

  const base = {
    date,
    lessonsRead: readLessonIds.length,
    alreadyDone: !!existing,
    lastScore: existing?.score ?? null,
  };

  if (readLessonIds.length === 0) {
    return { ...base, questions: [], poolSize: 0 };
  }

  const { data: vocab } = await supabase
    .from('vocab_items')
    .select('id, arabic, transliteration, french, lesson_id')
    .in('lesson_id', readLessonIds)
    .returns<VocabRow[]>();

  // Une traduction qui apparaît deux fois dans le vivier rendrait un distracteur aussi
  // correct que la réponse attendue.
  const counts = new Map<string, number>();
  for (const v of vocab ?? []) counts.set(v.french, (counts.get(v.french) ?? 0) + 1);
  const pool = (vocab ?? []).filter((v) => counts.get(v.french) === 1);

  if (pool.length < DAILY_MIN_POOL) {
    return { ...base, questions: [], poolSize: pool.length };
  }

  // Graine liée à l'utilisateur ET à la date : stable toute la journée, différente demain,
  // et deux apprenants n'ont pas la même leçon le même jour.
  const seed = hash(`${userId}:${date}`);
  const picked = seededShuffle(pool, seed).slice(0, DAILY_SIZE);

  const questions: QuizQuestionView[] = picked.map((item, i) => {
    const itemSeed = hash(`${seed}:${item.id}`);

    // Trois formats en alternance : le sens (arabe → français), la production (français →
    // arabizi) et la lecture (écriture arabe seule → arabizi). Le troisième retombe sur le
    // premier pour un mot sans écriture arabe.
    const kind = i % 3 === 1 ? 'say' : i % 3 === 2 && item.arabic ? 'read' : 'meaning';
    const toArabizi = kind !== 'meaning';

    const distractors: string[] = [];
    const seen = new Set<string>();
    for (const candidate of seededShuffle(pool, itemSeed)) {
      if (candidate.french === item.french) continue;
      if (candidate.transliteration === item.transliteration) continue;
      const value = toArabizi ? candidate.transliteration : candidate.french;
      if (seen.has(value)) continue;
      seen.add(value);
      distractors.push(value);
      if (distractors.length === 3) break;
    }

    const correct = toArabizi ? item.transliteration : item.french;
    const label = item.arabic
      ? `« ${item.arabic} » (${item.transliteration})`
      : `« ${item.transliteration} »`;

    return {
      id: item.id,
      question_text:
        kind === 'say'
          ? `Comment dit-on « ${item.french} » ?`
          : kind === 'read'
            ? `Comment se prononce « ${item.arabic} » ?`
            : `Que veut dire ${label} ?`,
      choices: seededShuffle([correct, ...distractors], itemSeed),
      correct_answer: correct,
      difficulty: null,
    };
  });

  return { ...base, questions, poolSize: pool.length };
}
