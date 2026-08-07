/**
 * Génère les questions de quiz à partir du vocabulaire déjà importé, et insère le test de
 * positionnement.
 *
 * Rejouable : supprime d'abord les questions de type 'mcq' (celles que ce script produit)
 * et laisse intactes les questions écrites à la main d'un autre type — notamment les
 * questions de compréhension du module-14.
 *
 *   npm run generate:quiz
 */
import { createClient } from '@supabase/supabase-js';
import { PLACEMENT_QUESTIONS } from './placement-questions';

process.loadEnvFile('.env.local');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

const QUESTIONS_PER_MODULE = 10;

type VocabRow = {
  id: string;
  arabic: string | null;
  transliteration: string;
  french: string;
  lessons: { module_id: string; modules: { level: string } } | null;
};

/** PRNG déterministe : deux exécutions produisent exactement les mêmes questions. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Prend `n` éléments répartis sur toute la liste plutôt que les n premiers. */
function spread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

type NewQuestion = {
  module_id: string | null;
  question_text: string;
  type: string;
  options: { choices: string[] };
  correct_answer: string;
  difficulty: string | null;
};

function buildModuleQuestions(
  moduleId: string,
  level: string,
  items: VocabRow[],
  levelPool: VocabRow[]
): NewQuestion[] {
  // Un item n'est utilisable que si sa traduction est unique dans le module : sinon un
  // distracteur pourrait être une réponse tout aussi correcte.
  const frenchCounts = new Map<string, number>();
  for (const it of items) frenchCounts.set(it.french, (frenchCounts.get(it.french) ?? 0) + 1);
  const usable = items.filter((it) => frenchCounts.get(it.french) === 1);

  const questions: NewQuestion[] = [];

  spread(usable, QUESTIONS_PER_MODULE).forEach((item, index) => {
    const rand = mulberry32(hash(item.id));
    const reverse = index % 3 === 2; // ~1 question sur 3 dans le sens français → arabe

    const pool = (items.length >= 8 ? items : levelPool).filter(
      (o) => o.french !== item.french && o.transliteration !== item.transliteration
    );

    const seen = new Set<string>();
    const distractors: string[] = [];
    for (const candidate of shuffle(pool, rand)) {
      const value = reverse ? candidate.transliteration : candidate.french;
      if (seen.has(value)) continue;
      seen.add(value);
      distractors.push(value);
      if (distractors.length === 3) break;
    }
    if (distractors.length < 3) return; // pas assez de matière pour 4 choix

    const correct = reverse ? item.transliteration : item.french;
    const label = item.arabic
      ? `« ${item.arabic} » (${item.transliteration})`
      : `« ${item.transliteration} »`;

    questions.push({
      module_id: moduleId,
      question_text: reverse
        ? `Comment dit-on « ${item.french} » ?`
        : `Que veut dire ${label} ?`,
      type: 'mcq',
      options: { choices: shuffle([correct, ...distractors], rand) },
      correct_answer: correct,
      difficulty: level,
    });
  });

  return questions;
}

async function main() {
  const { data: vocab, error } = await supabase
    .from('vocab_items')
    .select('id, arabic, transliteration, french, lessons(module_id, modules(level))')
    .returns<VocabRow[]>();

  if (error) throw new Error(`Lecture du vocabulaire : ${error.message}`);

  const byModule = new Map<string, { level: string; items: VocabRow[] }>();
  const byLevel = new Map<string, VocabRow[]>();

  for (const row of vocab) {
    const moduleId = row.lessons?.module_id;
    const level = row.lessons?.modules?.level;
    if (!moduleId || !level) continue;
    if (!byModule.has(moduleId)) byModule.set(moduleId, { level, items: [] });
    byModule.get(moduleId)!.items.push(row);
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(row);
  }

  // On ne supprime que ce que ce script produit : les questions de compréhension
  // écrites à la main (module-14) ont un autre `type` et survivent.
  const { error: delError } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('type', 'mcq');
  if (delError) throw new Error(`Nettoyage : ${delError.message}`);

  const rows: NewQuestion[] = [];

  for (const [moduleId, { level, items }] of [...byModule].sort()) {
    const questions = buildModuleQuestions(
      moduleId,
      level,
      items,
      byLevel.get(level) ?? []
    );
    rows.push(...questions);
    console.log(`  ${moduleId.padEnd(18)} ${String(questions.length).padStart(2)} questions`);
  }

  for (const q of PLACEMENT_QUESTIONS) {
    const rand = mulberry32(hash(q.question_text));
    rows.push({
      module_id: null, // marqueur du test de positionnement
      question_text: q.question_text,
      type: 'mcq',
      options: { choices: shuffle([...q.choices], rand) },
      correct_answer: q.choices[0],
      difficulty: q.difficulty,
    });
  }

  const { error: insertError } = await supabase.from('quiz_questions').insert(rows);
  if (insertError) throw new Error(`Insertion : ${insertError.message}`);

  console.log(
    `\n${rows.length} questions générées ` +
      `(${rows.length - PLACEMENT_QUESTIONS.length} de modules + ${PLACEMENT_QUESTIONS.length} de positionnement)`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
