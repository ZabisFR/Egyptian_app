import generated from '@/data/exercises.generated.json';

/**
 * Les exercices d'entraînement : modèle de données et tirage d'une série.
 *
 * Le corpus n'est pas écrit à la main et ne vit pas en base : il est *dérivé* du contenu
 * des modules par `scripts/generate-drills.ts`, qui écrit `data/exercises.generated.json`.
 * Deux conséquences voulues :
 *
 * - une forme fausse ici est une forme fausse dans la leçon — on ne peut pas diverger ;
 * - l'entraînement ne touche ni `quiz_questions` ni `user_progress`. On s'entraîne autant
 *   qu'on veut sans influer sur la validation des modules, qui reste le fait du quiz.
 */

export type DrillSetId =
  | 'present'
  | 'futur'
  | 'passe'
  | 'negation'
  | 'imperatif'
  | 'modalites'
  | 'transformation'
  | 'vocabulaire'
  | 'lecture'
  | 'premiere-lettre'
  | 'derniere-lettre'
  | 'formes'
  | 'phrases';

export type Exercise = {
  id: string;
  set: DrillSetId;
  /** La consigne, au-dessus de la phrase : « Aller — présent ». */
  instruction: string;
  /** La phrase à compléter. Contient toujours le trou, noté `___`. */
  sentence: string;
  answer: string;
  /** Variantes jugées équivalentes à la réponse principale. */
  accepted: string[];
  /** Les quatre propositions du bouton « je sèche ». La bonne en fait partie. */
  choices: string[];
  /** Ce qu'on donne d'emblée : le sens français, le pronom visé… */
  hint: string | null;
  /** La règle rappelée une fois la réponse donnée. */
  note: string | null;
  level: string | null;
  /** Module ou thème d'origine, pour filtrer une série. */
  theme: string | null;
  themeLabel: string | null;
  /**
   * Deux exercices de même famille ne tombent jamais dans la même série : le même verbe au
   * même pronom sous deux habillages, la même phrase avec deux trous, le même mot…
   */
  family: string;
  /**
   * La traduction de chaque proposition, réponse comprise : « Beneroo7 » → « nous allons ».
   * Affichée une fois la réponse donnée. Une proposition sans traduction connue n'y figure pas.
   */
  glosses: Record<string, string>;
};

export type DrillSet = {
  id: DrillSetId;
  title: string;
  tagline: string;
  /** Une phrase d'exemple, affichée sur la carte du hub. */
  sample: string;
};

/**
 * Le catalogue, dans l'ordre d'apprentissage : les trois temps, puis ce qui les
 * transforme, puis le lexique. Un jeu absent du corpus généré est simplement masqué du
 * hub — le catalogue décrit l'intention, les données décident de ce qui est jouable.
 */
export const DRILL_SETS: DrillSet[] = [
  {
    id: 'present',
    title: 'Présent',
    tagline: 'Le préfixe B-, sur les huit pronoms',
    sample: 'Ana ___ (aller)',
  },
  {
    id: 'futur',
    title: 'Futur',
    tagline: 'Le préfixe 7a-, qui chasse le B-',
    sample: 'Bokra, ana ___ (aller)',
  },
  {
    id: 'passe',
    title: 'Passé',
    tagline: 'Les suffixes finaux : -t, -ti, -na…',
    sample: 'Embare7, ana ___ (aller)',
  },
  {
    id: 'negation',
    title: 'Négation',
    tagline: 'Mesh au présent et au futur, ma- … -sh au passé',
    sample: 'Ro7t → ___',
  },
  {
    id: 'imperatif',
    title: 'Impératif',
    tagline: 'Donner un ordre, sans pronom ni préfixe',
    sample: '« Vas-y ! » → ___',
  },
  {
    id: 'modalites',
    title: 'Lazem, momken, 3ayez',
    tagline: 'Devoir, pouvoir, vouloir : le verbe qui suit perd son B-',
    sample: 'Ana lazem ___ (manger)',
  },
  {
    id: 'transformation',
    title: 'Changer de temps',
    tagline: 'Passer une forme d’un temps à l’autre, dans les deux sens',
    sample: 'Baroo7 → (futur) ___',
  },
  {
    id: 'vocabulaire',
    title: 'Vocabulaire',
    tagline: 'Écrire le mot égyptien, sans choix multiple',
    sample: '« pomme » → ___',
  },
  {
    id: 'lecture',
    title: 'Lire l’arabe',
    tagline: 'Le mot s’affiche en arabe, on écrit sa prononciation',
    sample: 'تفاح → ___',
  },
  {
    id: 'premiere-lettre',
    title: 'Première lettre',
    tagline: 'Reconnaître une lettre soudée en tête de mot',
    sample: 'بيت → ___',
  },
  {
    id: 'derniere-lettre',
    title: 'Dernière lettre',
    tagline: 'Reconnaître une lettre sous sa forme finale',
    sample: 'كتاب → ___',
  },
  {
    id: 'formes',
    title: 'Formes liées',
    tagline: 'Reconnaître une lettre attachée, sans son nom en face',
    sample: 'ـهـ → ___',
  },
  {
    id: 'phrases',
    title: 'Phrases à trous',
    tagline: 'Des phrases entières tirées des leçons',
    sample: 'Law 3ayez, ___.',
  },
];

const ALL = generated.exercises as Exercise[];

/** Nombre d'exercices par série. Au-delà, la série devient une corvée plutôt qu'un tour. */
export const SERIES_SIZE = 10;

export function findSet(id: string): DrillSet | undefined {
  return DRILL_SETS.find((s) => s.id === id);
}

function forSet(id: DrillSetId): Exercise[] {
  return ALL.filter((e) => e.set === id);
}

/** Le catalogue enrichi du nombre d'exercices réellement disponibles. */
export function listSets(): (DrillSet & { count: number })[] {
  return DRILL_SETS.map((set) => ({ ...set, count: forSet(set.id).length })).filter(
    (set) => set.count > 0
  );
}

/** Les thèmes proposés en filtre, du plus fourni au moins fourni. */
export function themesOf(id: DrillSetId): { value: string; label: string; count: number }[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const ex of forSet(id)) {
    if (!ex.theme) continue;
    const entry = counts.get(ex.theme) ?? { label: ex.themeLabel ?? ex.theme, count: 0 };
    entry.count++;
    counts.set(ex.theme, entry);
  }

  return [...counts]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tire une série. Le tirage est déterministe : la même graine redonne exactement la même
 * série. C'est ce qui permet de rendre la page côté serveur sans casser l'hydratation, et
 * de partager ou recharger une série sans la voir se réécrire sous les doigts. Le bouton
 * « Nouvelle série » change la graine dans l'URL — il n'y a pas d'autre source d'aléa.
 */
export function drawSeries({
  set,
  seed,
  theme,
  size = SERIES_SIZE,
}: {
  set: DrillSetId;
  seed: number;
  theme?: string | null;
  size?: number;
}): Exercise[] {
  const pool = forSet(set).filter((e) => !theme || e.theme === theme);
  const rand = mulberry32(seed);

  // Fisher-Yates, arrêté dès que la série est pleine. Un exercice dont la famille est déjà
  // tirée est sauté : sans cela, « Ana ___ » et « Bokra, ana ___ » (même verbe, même
  // réponse) pourraient se suivre, et la série donnerait l'impression de se répéter.
  // C'est une préférence, pas une règle : sur un petit thème (« Première lettre » filtré sur
  // un module de dix mots), les écartés complètent la série plutôt que de la laisser à 3.
  const items = [...pool];
  const series: Exercise[] = [];
  const skipped: Exercise[] = [];
  const families = new Set<string>();
  for (let i = 0; i < items.length && series.length < size; i++) {
    const j = i + Math.floor(rand() * (items.length - i));
    [items[i], items[j]] = [items[j], items[i]];
    if (families.has(items[i].family)) {
      skipped.push(items[i]);
      continue;
    }
    families.add(items[i].family);
    series.push(items[i]);
  }

  return [...series, ...skipped].slice(0, Math.min(size, items.length));
}

export function totalCount(): number {
  return ALL.length;
}
