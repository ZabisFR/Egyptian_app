/**
 * Génère les questions de quiz à partir du vocabulaire déjà importé, et insère le test de
 * positionnement.
 *
 * Rejouable : supprime d'abord les questions de type 'mcq' (celles que ce script produit)
 * et laisse intactes les questions écrites à la main d'un autre type — notamment les
 * questions de compréhension du module-14.
 *
 *   npm run generate:quiz
 *   npm run generate:quiz -- --dry-run   (construit et affiche, n'écrit rien)
 */
import { createClient } from '@supabase/supabase-js';
import { PLACEMENT_QUESTIONS } from './placement-questions';

process.loadEnvFile('.env.local');

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Taille maximale de la banque d'un module. Une tentative n'en pose que `QUIZ_SIZE` (10),
 * tirées au hasard : c'est ce qui fait que « Refaire » pose d'autres questions.
 */
const BANK_SIZE = 48;

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
  /** `item` : le mot interrogé. Deux questions sur le même mot ne tombent pas dans la même tentative. */
  options: { choices: string[]; item?: string };
  correct_answer: string;
  difficulty: string | null;
};

/**
 * Quatre manières d'interroger un même mot. Les deux premières existaient seules, et
 * toutes deux affichaient l'Arabizi : on pouvait valider un module sans jamais lire un
 * mot en écriture arabe. Les deux dernières obligent à la lire, dans les deux sens.
 */
type Kind = 'meaning' | 'say' | 'read' | 'script';
const KINDS: Kind[] = ['meaning', 'say', 'read', 'script'];
const NEEDS_ARABIC = new Set<Kind>(['read', 'script']);

function ask(kind: Kind, item: VocabRow): { text: string; answer: string } {
  const label = item.arabic
    ? `« ${item.arabic} » (${item.transliteration})`
    : `« ${item.transliteration} »`;

  switch (kind) {
    case 'meaning':
      return { text: `Que veut dire ${label} ?`, answer: item.french };
    case 'say':
      return { text: `Comment dit-on « ${item.french} » ?`, answer: item.transliteration };
    case 'read':
      return { text: `Comment se prononce « ${item.arabic} » ?`, answer: item.transliteration };
    case 'script':
      return { text: `Lequel de ces mots veut dire « ${item.french} » ?`, answer: item.arabic! };
  }
}

/** Ce qui sert de proposition pour une sorte de question. */
function choiceOf(kind: Kind, row: VocabRow): string | null {
  if (kind === 'meaning') return row.french;
  if (kind === 'script') return row.arabic;
  return row.transliteration;
}

/** Les mots de quatre lettres ou plus d'une traduction, sans accents ni casse. */
function meaningfulWords(french: string): Set<string> {
  return new Set(
    french
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !['masculin', 'feminin', 'pluriel'].includes(w))
  );
}

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

  // Deux questions par mot, de deux sortes différentes, dans la limite de la banque.
  spread(usable, Math.ceil(BANK_SIZE / 2)).forEach((item, index) => {
    const rand = mulberry32(hash(item.id));
    const wanted = [KINDS[index % 4], KINDS[(index + 2) % 4]];
    // Sans écriture arabe, les sortes qui la demandent retombent sur les deux autres.
    const kinds = item.arabic
      ? wanted
      : [...new Set(wanted.map((k) => (k === 'read' ? 'say' : k === 'script' ? 'meaning' : k)))];

    const words = meaningfulWords(item.french);
    const pool = (items.length >= 8 ? items : levelPool).filter(
      (o) =>
        o.french !== item.french &&
        o.transliteration !== item.transliteration &&
        (!item.arabic || o.arabic !== item.arabic) &&
        // « utiliser » (استخدم) et « utiliser » (استعمل), « je suis d'accord » et « je suis
        // tout à fait d'accord » : un leurre qui partage un mot du sens est souvent un
        // synonyme, c'est-à-dire une deuxième bonne réponse.
        ![...meaningfulWords(o.french)].some((w) => words.has(w))
    );

    for (const kind of kinds) {
      if (NEEDS_ARABIC.has(kind) && !item.arabic) continue;
      const { text, answer } = ask(kind, item);

      const seen = new Set<string>([answer]);
      const distractors: string[] = [];
      for (const candidate of shuffle(pool, rand)) {
        const value = choiceOf(kind, candidate);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        distractors.push(value);
        if (distractors.length === 3) break;
      }
      if (distractors.length < 3) continue; // pas assez de matière pour 4 choix

      questions.push({
        module_id: moduleId,
        question_text: text,
        type: 'mcq',
        options: { choices: shuffle([answer, ...distractors], rand), item: item.id },
        correct_answer: answer,
        difficulty: level,
      });
    }
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

  const rows: NewQuestion[] = [];

  for (const [moduleId, { level, items }] of [...byModule].sort()) {
    const questions = buildModuleQuestions(
      moduleId,
      level,
      items,
      byLevel.get(level) ?? []
    );
    rows.push(...questions);
    const kinds = new Map<string, number>();
    for (const q of questions) {
      const kind = q.question_text.split(' ').slice(0, 3).join(' ');
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }
    console.log(
      `  ${moduleId.padEnd(18)} ${String(questions.length).padStart(2)} questions  ` +
        [...kinds].map(([k, n]) => `${n}× « ${k}… »`).join(', ')
    );
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

  if (DRY_RUN) {
    for (const q of rows.filter((_, i) => i % 97 === 0)) {
      console.log(`
  ${q.question_text}
    ✓ ${q.correct_answer}   [${q.options.choices.join(' | ')}]`);
    }
    console.log(`
--dry-run : ${rows.length} questions construites, rien n'a été écrit.`);
    return;
  }

  // La banque est construite AVANT de toucher à la base : si la construction échoue, les
  // anciennes questions restent en place au lieu de laisser les quiz vides.
  // On ne supprime que ce que ce script produit : les questions de compréhension
  // écrites à la main (module-14) ont un autre `type` et survivent.
  const { error: delError } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('type', 'mcq');
  if (delError) throw new Error(`Nettoyage : ${delError.message}`);

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
