import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL et une clé Supabase sont requis dans .env.local');
}

if (!process.env.SUPABASE_SECRET_KEY) {
  console.warn(
    '! SUPABASE_SECRET_KEY absente : import avec la clé publishable.\n' +
      "  Ne marche que si 002_lock_content_writes.sql n'a pas encore été appliqué.\n"
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DATA_DIR = path.join(process.cwd(), 'data');

type JsonVocab = { arabic?: string | null; transliteration: string; french: string };

type JsonLesson = {
  day: number | null;
  order_index: number;
  section: string | null;
  title: string;
  content_markdown: string;
  vocab_items?: JsonVocab[];
  quiz_questions?: { question: string; question_fr: string; answer: string }[];
};

type JsonModuleFile = {
  module: {
    id: string;
    number: number;
    title: string;
    subtitle: string | null;
    level: string;
    description: string | null;
    order_index: number;
  };
  lessons: JsonLesson[];
};

type ConjugationsFile = {
  id: string;
  title: string;
  description: string;
  rules_matrix: { tense: string; structure: string; example: string; negation: string }[];
  rules_note: string;
  verbs_compact: {
    verb_fr: string;
    root: string;
    present_ana: string;
    future_ana: string;
    past_ana: string;
    imperative_m: string;
  }[];
  compact_note: string;
  verbs_full: {
    verb_fr: string;
    root: string;
    imperative_m: string;
    conjugations: {
      pronoun: string;
      present: string;
      future: string;
      past: string;
      past_negative: string;
    }[];
  }[];
  missing_full_paradigms: string[];
};

type ImportPayload = {
  module: JsonModuleFile['module'];
  lessons: JsonLesson[];
};

const cell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');

const table = (headers: string[], rows: string[][]) =>
  [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');

// conjugations-core n'est pas une séquence de jours : on le range comme un module de
// référence (order_index 99) pour qu'il vive dans les mêmes tables que le reste.
function buildConjugationsPayload(data: ConjugationsFile): ImportPayload {
  const lessons: JsonLesson[] = [];

  lessons.push({
    day: null,
    order_index: 0,
    section: 'Règles transversales',
    title: 'Les 4 règles temporelles',
    content_markdown: [
      '## Les 4 règles temporelles',
      '',
      table(
        ['Temps', 'Structure', 'Exemple', 'Négation'],
        data.rules_matrix.map((r) => [r.tense, r.structure, r.example, r.negation])
      ),
      '',
      `> ${data.rules_note}`,
    ].join('\n'),
    vocab_items: [],
  });

  const missing = data.missing_full_paradigms.length
    ? `\n\n> Paradigme complet non disponible pour : ${data.missing_full_paradigms.join(', ')}.`
    : '';

  lessons.push({
    day: null,
    order_index: 1,
    section: 'Règles transversales',
    title: `Tableau récapitulatif — ${data.verbs_compact.length} verbes`,
    content_markdown: [
      '## Tableau récapitulatif',
      '',
      table(
        ['Verbe', 'Racine', 'Présent (Ana)', 'Futur (Ana)', 'Passé (Ana)', 'Impératif (m.)'],
        data.verbs_compact.map((v) => [
          v.verb_fr,
          v.root,
          v.present_ana,
          v.future_ana,
          v.past_ana,
          v.imperative_m,
        ])
      ),
      '',
      `> ${data.compact_note}${missing}`,
    ].join('\n'),
    vocab_items: [],
  });

  data.verbs_full.forEach((verb, i) => {
    lessons.push({
      day: null,
      order_index: 2 + i,
      section: 'Paradigmes complets',
      title: `${verb.verb_fr} (${verb.root})`,
      content_markdown: [
        `## ${verb.verb_fr} — racine ${verb.root}`,
        '',
        `Impératif (m.) : **${verb.imperative_m}**`,
        '',
        table(
          ['Pronom', 'Présent', 'Futur', 'Passé', 'Passé négatif'],
          verb.conjugations.map((c) => [
            c.pronoun,
            c.present,
            c.future,
            c.past,
            c.past_negative,
          ])
        ),
      ].join('\n'),
      vocab_items: [],
    });
  });

  return {
    module: {
      id: data.id,
      number: 99,
      title: data.title,
      subtitle: 'Référence grammaticale',
      level: 'REF',
      description: data.description,
      order_index: 99,
    },
    lessons,
  };
}

async function importPayload({ module, lessons }: ImportPayload) {
  const fail = (step: string, error: { message: string } | null) => {
    if (error) throw new Error(`${module.id} — ${step} : ${error.message}`);
  };

  // Les JSON portent parfois des clés hors schéma (ex. generation_note sur module-05).
  const moduleRow = {
    id: module.id,
    number: module.number,
    title: module.title,
    subtitle: module.subtitle ?? null,
    level: module.level,
    description: module.description ?? null,
    order_index: module.order_index,
  };
  fail('upsert module', (await supabase.from('modules').upsert(moduleRow)).error);

  // Réimport idempotent : on repart d'une ardoise propre. La suppression des leçons
  // cascade sur vocab_items.
  fail('purge quiz', (await supabase.from('quiz_questions').delete().eq('module_id', module.id)).error);
  fail('purge leçons', (await supabase.from('lessons').delete().eq('module_id', module.id)).error);

  const { data: inserted, error: lessonsError } = await supabase
    .from('lessons')
    .insert(
      lessons.map((l) => ({
        module_id: module.id,
        day: l.day,
        section: l.section,
        title: l.title,
        content_markdown: l.content_markdown,
        order_index: l.order_index,
      }))
    )
    .select('id, order_index');
  fail('insert leçons', lessonsError);

  const lessonIdByOrder = new Map(inserted!.map((l) => [l.order_index, l.id]));

  const vocabRows = lessons.flatMap((l) =>
    (l.vocab_items ?? []).map((v) => ({
      lesson_id: lessonIdByOrder.get(l.order_index)!,
      arabic: v.arabic ?? null,
      transliteration: v.transliteration,
      french: v.french,
    }))
  );
  if (vocabRows.length) {
    fail('insert vocab', (await supabase.from('vocab_items').insert(vocabRows)).error);
  }

  const quizRows = lessons.flatMap((l) =>
    (l.quiz_questions ?? []).map((q) => ({
      module_id: module.id,
      question_text: q.question,
      type: 'comprehension',
      options: { question_fr: q.question_fr },
      correct_answer: q.answer,
    }))
  );
  if (quizRows.length) {
    fail('insert quiz', (await supabase.from('quiz_questions').insert(quizRows)).error);
  }

  console.log(
    `✓ ${module.id.padEnd(18)} ${lessons.length} leçons, ${vocabRows.length} vocab, ${quizRows.length} quiz`
  );
  return { lessons: lessons.length, vocab: vocabRows.length, quiz: quizRows.length };
}

async function main() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json')).sort();
  const total = { modules: 0, lessons: 0, vocab: 0, quiz: 0 };

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf-8'));
    const payload: ImportPayload = file.startsWith('module-')
      ? (raw as JsonModuleFile)
      : buildConjugationsPayload(raw as ConjugationsFile);

    const counts = await importPayload(payload);
    total.modules += 1;
    total.lessons += counts.lessons;
    total.vocab += counts.vocab;
    total.quiz += counts.quiz;
  }

  console.log(
    `\n${total.modules} modules · ${total.lessons} leçons · ${total.vocab} items de vocabulaire · ${total.quiz} questions`
  );
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
