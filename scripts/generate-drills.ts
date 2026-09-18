/**
 * Construit le corpus d'exercices d'entraînement à partir de `data/`, et l'écrit dans
 * `data/exercises.generated.json`.
 *
 * Pourquoi un fichier généré plutôt qu'une table Supabase : l'entraînement ne produit
 * aucune donnée utilisateur (ni score enregistré, ni XP), donc rien n'a besoin d'être en
 * base. Un fichier statique évite une migration à appliquer à la main, se relit dans une
 * revue de code — une forme fausse se voit dans le diff — et supprime un aller-retour
 * réseau par exercice affiché.
 *
 * Entièrement déterministe : deux exécutions sur les mêmes données produisent un fichier
 * identique, au caractère près. Un `git diff` vide après exécution signifie donc « rien
 * n'a changé dans le contenu », pas « le script n'a pas tourné ».
 *
 *   npm run generate:drills
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = 'data';
const OUT = join(DATA_DIR, 'exercises.generated.json');
const MANUAL = join(DATA_DIR, 'exercises-manual.json');

// ---------------------------------------------------------------------------
// Aléa déterministe — mêmes helpers que `scripts/generate-quiz.ts`.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Clé de comparaison des propositions : deux graphies du même mot ne font qu'un choix. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------------------
// Modèle
// ---------------------------------------------------------------------------

type Exercise = {
  id: string;
  set: string;
  instruction: string;
  sentence: string;
  answer: string;
  accepted: string[];
  choices: string[];
  hint: string | null;
  note: string | null;
  level: string | null;
  theme: string | null;
  themeLabel: string | null;
};

type Draft = Omit<Exercise, 'id' | 'choices'> & { distractors: string[] };

/**
 * Finalise un brouillon : identifiant stable et quatre propositions.
 *
 * L'identifiant dérive du contenu et non d'un compteur — réordonner les générateurs ou
 * ajouter un module ne renumérote pas tout le corpus.
 */
function finish(draft: Draft): Exercise | null {
  const seen = new Set([key(draft.answer)]);
  const picked: string[] = [];

  for (const candidate of draft.distractors) {
    const k = key(candidate);
    if (seen.has(k)) continue;
    seen.add(k);
    picked.push(candidate);
    if (picked.length === 3) break;
  }

  // Moins de trois leurres crédibles : l'aide « je sèche » se réduirait à désigner la
  // bonne réponse. On écarte l'exercice plutôt que de proposer un choix truqué.
  if (picked.length < 3) return null;

  const id = `${draft.set}-${hash(`${draft.set}|${draft.sentence}|${draft.answer}`).toString(36)}`;
  const rand = mulberry32(hash(id));
  const { distractors: _distractors, ...rest } = draft;

  return { id, ...rest, choices: shuffle([draft.answer, ...picked], rand) };
}

// ---------------------------------------------------------------------------
// Lecture des données
// ---------------------------------------------------------------------------

type JsonVocab = { arabic?: string | null; transliteration: string; french: string };
type JsonLesson = { content_markdown: string; vocab_items?: JsonVocab[] };
type JsonModuleFile = {
  module: { id: string; title: string; level: string };
  lessons: JsonLesson[];
};

type Conjugation = {
  pronoun: string;
  present: string;
  future: string;
  past: string;
  past_negative: string;
};

type Verb = {
  verb_fr: string;
  root: string;
  imperative_m: string;
  conjugations: Conjugation[];
};

const moduleFiles: JsonModuleFile[] = readdirSync(DATA_DIR)
  .filter((f) => f.startsWith('module-') && f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8')));

const conjugations: { verbs_full: Verb[] } = JSON.parse(
  readFileSync(join(DATA_DIR, 'conjugations-core.json'), 'utf8')
);

// ---------------------------------------------------------------------------
// Conjugaison — la matière la plus sûre du corpus : des paradigmes complets, saisis en
// tableau, où chaque case est déjà une réponse attendue.
// ---------------------------------------------------------------------------

const TENSES = [
  {
    set: 'present',
    field: 'present' as const,
    label: 'présent',
    note: 'Présent : pronom + **B-** + verbe. Le B- marque l’action en cours.',
  },
  {
    set: 'futur',
    field: 'future' as const,
    label: 'futur',
    note: 'Futur : pronom + **7a-**, *sans* le B- du présent.',
  },
  {
    set: 'passe',
    field: 'past' as const,
    label: 'passé',
    note: 'Passé : la racine porte un **suffixe final** (-t, -ti, -na, -tu…), sans préfixe.',
  },
];

/** « Ana (Je) » → le pronom d'un côté, sa glose française de l'autre. */
function splitPronoun(raw: string): { token: string; french: string } {
  const m = raw.match(/^(.+?)\s*\((.+)\)\s*$/);
  const token = (m ? m[1] : raw).trim();
  const french = (m ? m[2] : '').trim().toLowerCase();

  return {
    token,
    french: french.replace('tu-m', 'tu (masculin)').replace('tu-f', 'tu (féminin)'),
  };
}

function conjugationDrafts(): Draft[] {
  const drafts: Draft[] = [];

  for (const verb of conjugations.verbs_full) {
    for (const tense of TENSES) {
      for (const row of verb.conjugations) {
        const { token, french } = splitPronoun(row.pronoun);

        // Leurres : d'abord les autres pronoms du même verbe au même temps — c'est là que
        // se joue la difficulté réelle (Bteroo7 / Beneroo7 / Biyeroo7) — puis le même
        // pronom aux autres temps, qui piège la confusion B-/7a-.
        const sameTense = verb.conjugations
          .filter((c) => c.pronoun !== row.pronoun)
          .map((c) => c[tense.field]);
        const otherTenses = TENSES.filter((t) => t.set !== tense.set).map((t) => row[t.field]);

        const rand = mulberry32(hash(`${verb.verb_fr}|${tense.set}|${row.pronoun}`));

        drafts.push({
          set: tense.set,
          instruction: `${verb.verb_fr} — ${tense.label}`,
          sentence: `${token} ___`,
          answer: row[tense.field],
          // On accepte que le pronom soit retapé avec la forme : c'est la phrase entière.
          accepted: [`${token} ${row[tense.field]}`],
          distractors: [...shuffle(sameTense, rand), ...otherTenses],
          hint: french,
          note: `${tense.note} Racine ${verb.root}.`,
          level: 'REF',
          theme: null,
          themeLabel: null,
        });
      }
    }
  }

  return drafts;
}

function negationDrafts(): Draft[] {
  const drafts: Draft[] = [];

  for (const verb of conjugations.verbs_full) {
    for (const row of verb.conjugations) {
      const { token, french } = splitPronoun(row.pronoun);
      const rand = mulberry32(hash(`neg|${verb.verb_fr}|${row.pronoun}`));

      drafts.push({
        set: 'negation',
        instruction: 'Mets cette forme au négatif',
        sentence: `${row.past} → ___`,
        answer: row.past_negative,
        accepted: [`${token} ${row.past_negative}`],
        // Les négations des autres pronoms : le piège est le suffixe, pas le -sh.
        distractors: shuffle(
          verb.conjugations
            .filter((c) => c.pronoun !== row.pronoun)
            .map((c) => c.past_negative),
          rand
        ),
        hint: `${french} — passé`,
        note: 'Négation du passé : **ma-** devant le verbe, **-sh** après. Les deux, toujours.',
        level: 'REF',
        theme: null,
        themeLabel: null,
      });
    }
  }

  return drafts;
}

function imperativeDrafts(): Draft[] {
  const all = conjugations.verbs_full;

  return all.map((verb) => {
    const rand = mulberry32(hash(`imp|${verb.verb_fr}`));

    return {
      set: 'imperatif',
      instruction: 'Donne l’ordre, à un homme',
      sentence: `« ${verb.verb_fr} » → ___`,
      answer: verb.imperative_m,
      accepted: [verb.imperative_m.replace(/\s*!\s*$/, '')],
      distractors: shuffle(
        all.filter((v) => v.verb_fr !== verb.verb_fr).map((v) => v.imperative_m),
        rand
      ),
      hint: null,
      note: `L’impératif part du présent « enta » et perd son préfixe. Racine ${verb.root}.`,
      level: 'REF',
      theme: null,
      themeLabel: null,
    };
  });
}

/** Deux transformations : celle qui fait le futur, celle qui ramène au présent. */
const SHIFTS = [
  {
    from: 'present' as const,
    to: 'future' as const,
    instruction: 'Passe cette forme au futur',
    note: 'On remplace **B-** par **7a-** : même verbe, même pronom, autre temps.',
  },
  {
    from: 'past' as const,
    to: 'present' as const,
    instruction: 'Passe cette forme au présent',
    note: 'Le passé se lit sur les suffixes ; le présent, sur le préfixe **B-**.',
  },
];

function transformationDrafts(): Draft[] {
  const drafts: Draft[] = [];

  for (const verb of conjugations.verbs_full) {
    for (const shift of SHIFTS) {
      for (const row of verb.conjugations) {
        const { token, french } = splitPronoun(row.pronoun);
        const rand = mulberry32(hash(`shift|${verb.verb_fr}|${shift.to}|${row.pronoun}`));

        drafts.push({
          set: 'transformation',
          instruction: shift.instruction,
          sentence: `${row[shift.from]} → ___`,
          answer: row[shift.to],
          accepted: [`${token} ${row[shift.to]}`],
          distractors: [
            // Même temps cible, mauvais pronom : l'erreur qu'on veut faire sentir.
            ...shuffle(
              verb.conjugations.filter((c) => c.pronoun !== row.pronoun).map((c) => c[shift.to]),
              rand
            ),
            row[shift.from],
          ],
          hint: `${french} — ${verb.verb_fr.toLowerCase()}`,
          note: shift.note,
          level: 'REF',
          theme: null,
          themeLabel: null,
        });
      }
    }
  }

  return drafts;
}

// ---------------------------------------------------------------------------
// Vocabulaire — français → égyptien, en tapant. L'inverse (reconnaître) est déjà couvert
// par les QCM de module ; ce qui manquait, c'est produire la forme.
// ---------------------------------------------------------------------------

function vocabDrafts(): Draft[] {
  type Entry = JsonVocab & { moduleId: string; moduleTitle: string; level: string };
  const entries: Entry[] = [];

  for (const file of moduleFiles) {
    for (const lesson of file.lessons) {
      for (const v of lesson.vocab_items ?? []) {
        entries.push({
          ...v,
          moduleId: file.module.id,
          moduleTitle: file.module.title,
          level: file.module.level,
        });
      }
    }
  }

  // Un même sens porté par deux mots rendrait la réponse indécidable : on écarte les deux
  // plutôt que d'en couronner un arbitrairement.
  const byFrench = new Map<string, number>();
  for (const e of entries) {
    const k = e.french.trim().toLowerCase();
    byFrench.set(k, (byFrench.get(k) ?? 0) + 1);
  }

  const usable = entries.filter((e) => byFrench.get(e.french.trim().toLowerCase()) === 1);

  return usable.map((entry) => {
    const rand = mulberry32(hash(`vocab|${entry.moduleId}|${entry.french}`));
    const sameTheme = usable.filter(
      (o) => o.moduleId === entry.moduleId && o.french !== entry.french
    );
    const others = usable.filter((o) => o.moduleId !== entry.moduleId);

    return {
      set: 'vocabulaire',
      instruction: 'Écris le mot en égyptien',
      sentence: `« ${entry.french} » → ___`,
      answer: entry.transliteration,
      accepted: [],
      // Leurres du même thème d'abord : « pomme » se confond avec « banane », pas avec
      // « pharmacie ». Le reste du lexique ne sert que de secours pour les petits modules.
      distractors: [
        ...shuffle(sameTheme, rand).map((o) => o.transliteration),
        ...shuffle(others, rand).slice(0, 8).map((o) => o.transliteration),
      ],
      hint: null,
      note: entry.arabic ? `En écriture arabe : ${entry.arabic}` : null,
      level: entry.level,
      theme: entry.moduleId,
      themeLabel: entry.moduleTitle,
    };
  });
}

// ---------------------------------------------------------------------------
// Phrases à trous — extraites des tableaux de leçon.
//
// Un seul gabarit est reconnu : une cellule « arabe — romanisation » suivie d'une cellule
// de traduction. C'est le seul dont le sens des colonnes ne dépende pas d'un en-tête, et
// les en-têtes varient trop (61 formes distinctes dans `data/`) pour qu'on s'y fie. Mieux
// vaut un jeu plus petit et juste qu'un jeu large où une ligne sur cinq est un contresens.
// ---------------------------------------------------------------------------

const ARABIC = /[؀-ۿ]/;

/** Ce qui disqualifie une ligne : parenthèse d'explication, glose « = … », gabarit à trou. */
const NOISY = /[()[\]=*/…]/;

function phraseDrafts(): Draft[] {
  type Phrase = {
    words: string[];
    french: string;
    arabic: string;
    moduleId: string;
    moduleTitle: string;
    level: string;
  };

  const phrases: Phrase[] = [];

  for (const file of moduleFiles) {
    for (const lesson of file.lessons) {
      for (const line of lesson.content_markdown.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('|') || !t.endsWith('|')) continue;

        const cells = t
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        if (cells.length !== 2) continue;

        const [left, french] = cells;
        if (!ARABIC.test(left) || ARABIC.test(french)) continue;

        const parts = left.split(/\s+[—–]\s+/);
        if (parts.length !== 2) continue;

        const [arabic, roman] = parts;
        if (NOISY.test(roman) || NOISY.test(french)) continue;

        const words = roman.split(/\s+/).filter(Boolean);
        if (words.length < 3) continue;

        phrases.push({
          words,
          french,
          arabic,
          moduleId: file.module.id,
          moduleTitle: file.module.title,
          level: file.module.level,
        });
      }
    }
  }

  /**
   * Quel mot masquer. Pas au hasard : un trou sur « el- » ou « fi » ne fait rien
   * travailler. On vise le mot porteur de grammaire — préfixe de temps, négation
   * encadrante — et à défaut le mot le plus long, qui est presque toujours le verbe.
   */
  function pickWord(words: string[]): number {
    let best = -1;
    let bestScore = -Infinity;

    words.forEach((word, i) => {
      const bare = strip(word);
      if (bare.length < 3) return;

      let score = bare.length / 10;
      if (/^(ba|bt|bn|bi|bey|biy)/i.test(bare)) score += 3; // présent
      if (/^(7a|7at|7an|7ay)/i.test(bare)) score += 3; // futur
      if (/^ma/i.test(bare) && /sh$/i.test(bare)) score += 4; // négation encadrante
      if (/^mesh$/i.test(bare)) score += 2;

      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });

    return best;
  }

  const drafts: Draft[] = [];
  const pool = phrases.flatMap((p) => p.words.map(strip)).filter((w) => w.length >= 3);

  for (const phrase of phrases) {
    const index = pickWord(phrase.words);
    if (index < 0) continue;

    const raw = phrase.words[index];
    const answer = strip(raw);

    // La ponctuation finale reste dans la phrase : c'est le mot qu'on demande, pas le
    // point qui le suit.
    const blanked = [...phrase.words];
    blanked[index] = raw.replace(answer, '___');

    const rand = mulberry32(hash(`phrase|${phrase.arabic}|${answer}`));

    drafts.push({
      set: 'phrases',
      instruction: 'Complète la phrase',
      sentence: blanked.join(' '),
      answer,
      accepted: [],
      // Des mots venus des autres phrases du corpus : plausibles, et dans la même langue.
      distractors: shuffle(pool, rand),
      hint: phrase.french,
      note: `${phrase.arabic} — ${phrase.words.join(' ')}`,
      level: phrase.level,
      theme: phrase.moduleId,
      themeLabel: phrase.moduleTitle,
    });
  }

  return drafts;
}

const strip = (word: string) => word.replace(/[.,!?;:«»"'’]/g, '');

// ---------------------------------------------------------------------------

function main() {
  const drafts = [
    ...conjugationDrafts(),
    ...negationDrafts(),
    ...imperativeDrafts(),
    ...transformationDrafts(),
    ...vocabDrafts(),
    ...phraseDrafts(),
  ];

  const exercises: Exercise[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const draft of drafts) {
    const exercise = finish(draft);
    if (!exercise) {
      dropped++;
      continue;
    }
    // Deux modules peuvent enseigner la même phrase ; le même exercice deux fois dans une
    // série ressemblerait à un bug.
    if (seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    exercises.push(exercise);
  }

  // Exercices écrits à la main, s'il y en a : ils passent par le même modèle et le même
  // contrôle de qualité, et remplacent un généré de même identifiant.
  if (existsSync(MANUAL)) {
    const manual: Draft[] = JSON.parse(readFileSync(MANUAL, 'utf8')).exercises ?? [];
    for (const draft of manual) {
      const exercise = finish(draft);
      if (!exercise) {
        dropped++;
        continue;
      }
      const at = exercises.findIndex((e) => e.id === exercise.id);
      if (at >= 0) exercises[at] = exercise;
      else exercises.push(exercise);
    }
  }

  const bySet = new Map<string, number>();
  for (const e of exercises) bySet.set(e.set, (bySet.get(e.set) ?? 0) + 1);

  writeFileSync(OUT, `${JSON.stringify({ exercises }, null, 2)}\n`, 'utf8');

  for (const [set, n] of [...bySet].sort()) {
    console.log(`  ${set.padEnd(16)} ${String(n).padStart(4)}`);
  }

  console.log(
    `\n${exercises.length} exercices écrits dans ${OUT}` +
      (dropped ? ` (${dropped} écartés faute de leurres crédibles)` : '')
  );
}

main();
