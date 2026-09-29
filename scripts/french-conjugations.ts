/**
 * Conjugaison française des 19 verbes de `conjugations-core.json`, pour traduire chaque
 * forme égyptienne du corpus d'entraînement : « Btekhodi » → « tu prends ».
 *
 * Écrite à la main plutôt que dérivée par règle : sur 22 verbes, 15 sont irréguliers
 * (aller, faire, boire, prendre, voir, dire, savoir, venir…). Une règle ferait des fautes,
 * une table se relit.
 *
 * Le passé égyptien (Ro7t, Akalt…) est un accompli : il se traduit par le passé composé.
 */

type FrenchVerb = {
  /** je, tu, il, nous, vous, ils */
  present: [string, string, string, string, string, string];
  /** Radical du futur : « ir » → j'irai, tu iras… */
  future: string;
  participle: string;
  aux: 'avoir' | 'être';
  /** Impératif, 2e personne du singulier. */
  imperative: string;
};

const VERBS: Record<string, FrenchVerb> = {
  aller: { present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], future: 'ir', participle: 'allé', aux: 'être', imperative: 'va' },
  faire: { present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], future: 'fer', participle: 'fait', aux: 'avoir', imperative: 'fais' },
  travailler: { present: ['travaille', 'travailles', 'travaille', 'travaillons', 'travaillez', 'travaillent'], future: 'travailler', participle: 'travaillé', aux: 'avoir', imperative: 'travaille' },
  manger: { present: ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'], future: 'manger', participle: 'mangé', aux: 'avoir', imperative: 'mange' },
  boire: { present: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], future: 'boir', participle: 'bu', aux: 'avoir', imperative: 'bois' },
  prendre: { present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], future: 'prendr', participle: 'pris', aux: 'avoir', imperative: 'prends' },
  voir: { present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], future: 'verr', participle: 'vu', aux: 'avoir', imperative: 'vois' },
  dormir: { present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], future: 'dormir', participle: 'dormi', aux: 'avoir', imperative: 'dors' },
  dire: { present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], future: 'dir', participle: 'dit', aux: 'avoir', imperative: 'dis' },
  aimer: { present: ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment'], future: 'aimer', participle: 'aimé', aux: 'avoir', imperative: 'aime' },
  comprendre: { present: ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'], future: 'comprendr', participle: 'compris', aux: 'avoir', imperative: 'comprends' },
  savoir: { present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], future: 'saur', participle: 'su', aux: 'avoir', imperative: 'sache' },
  connaître: { present: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'], future: 'connaîtr', participle: 'connu', aux: 'avoir', imperative: 'connais' },
  écrire: { present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], future: 'écrir', participle: 'écrit', aux: 'avoir', imperative: 'écris' },
  ouvrir: { present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'], future: 'ouvrir', participle: 'ouvert', aux: 'avoir', imperative: 'ouvre' },
  entrer: { present: ['entre', 'entres', 'entre', 'entrons', 'entrez', 'entrent'], future: 'entrer', participle: 'entré', aux: 'être', imperative: 'entre' },
  sortir: { present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'], future: 'sortir', participle: 'sorti', aux: 'être', imperative: 'sors' },
  rentrer: { present: ['rentre', 'rentres', 'rentre', 'rentrons', 'rentrez', 'rentrent'], future: 'rentrer', participle: 'rentré', aux: 'être', imperative: 'rentre' },
  revenir: { present: ['reviens', 'reviens', 'revient', 'revenons', 'revenez', 'reviennent'], future: 'reviendr', participle: 'revenu', aux: 'être', imperative: 'reviens' },
  jouer: { present: ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent'], future: 'jouer', participle: 'joué', aux: 'avoir', imperative: 'joue' },
  acheter: { present: ['achète', 'achètes', 'achète', 'achetons', 'achetez', 'achètent'], future: 'achèter', participle: 'acheté', aux: 'avoir', imperative: 'achète' },
  venir: { present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], future: 'viendr', participle: 'venu', aux: 'être', imperative: 'viens' },
  // Les trois modalités du cours, pour traduire « Ana lazem aroo7 » → « je dois aller ».
  devoir: { present: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], future: 'devr', participle: 'dû', aux: 'avoir', imperative: 'dois' },
  pouvoir: { present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], future: 'pourr', participle: 'pu', aux: 'avoir', imperative: 'peux' },
  vouloir: { present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], future: 'voudr', participle: 'voulu', aux: 'avoir', imperative: 'veux' },
};

const AUX = {
  avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
  être: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
};

const FUTURE_ENDINGS = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];

/** Les huit pronoms égyptiens : personne française (0 à 5), sujet, genre et nombre. */
const PERSONS: Record<string, { person: number; subject: string; fem: boolean; plural: boolean }> = {
  Ana: { person: 0, subject: 'je', fem: false, plural: false },
  Enta: { person: 1, subject: 'tu', fem: false, plural: false },
  Enti: { person: 1, subject: 'tu', fem: true, plural: false },
  Howa: { person: 2, subject: 'il', fem: false, plural: false },
  Heyya: { person: 2, subject: 'elle', fem: true, plural: false },
  É7na: { person: 3, subject: 'nous', fem: false, plural: true },
  Ento: { person: 4, subject: 'vous', fem: false, plural: true },
  Homma: { person: 5, subject: 'ils', fem: false, plural: true },
};

export type Tense = 'present' | 'future' | 'past';

/** « je » s'élide devant une voyelle ou un h muet ; « ne » aussi. */
const elides = (word: string) => /^[aeéèêiîoôuh]/i.test(word);

function subjectBefore(subject: string, word: string): string {
  return subject === 'je' && elides(word) ? `j’${word}` : `${subject} ${word}`;
}

/** Les infinitifs français d'une entrée : « Faire / Travailler » → faire, travailler. */
export function infinitives(verbFr: string): string[] {
  if (verbFr === 'Aimer / Bien aimer') return ['aimer'];
  return verbFr.split('/').map((v) => v.trim().toLowerCase()).filter((v) => v in VERBS);
}

/** Le verbe conjugué seul, sans sujet : « vais », « irai », « suis allé ». */
function inflect(inf: string, token: string, tense: Tense): string | null {
  const verb = VERBS[inf];
  const p = PERSONS[token];
  if (!verb || !p) return null;

  if (tense === 'present') return verb.present[p.person];
  if (tense === 'future') return verb.future + FUTURE_ENDINGS[p.person];

  // Passé composé : avec « être », le participe s'accorde avec le sujet.
  let participle = verb.participle;
  if (verb.aux === 'être') participle += (p.fem ? 'e' : '') + (p.plural ? 's' : '');
  return `${AUX[verb.aux][p.person]} ${participle}`;
}

/** « je vais », « tu iras », « elle est allée »… ou, en négatif, « je ne vais pas ». */
export function conjugate(inf: string, token: string, tense: Tense, negative = false): string | null {
  const form = inflect(inf, token, tense);
  const subject = PERSONS[token]?.subject;
  if (!form || !subject) return null;

  if (!negative) return subjectBefore(subject, form);

  // La négation encadre le premier mot (l'auxiliaire au passé composé).
  const [head, ...rest] = form.split(' ');
  const ne = elides(head) ? 'n’' : 'ne ';
  return [`${subject} ${ne}${head} pas`, ...rest].join(' ');
}

/** Toutes les traductions d'une forme, pour une entrée à deux sens : « je fais / je travaille ». */
export function translate(verbFr: string, token: string, tense: Tense, negative = false): string | null {
  const out = infinitives(verbFr)
    .map((inf) => conjugate(inf, token, tense, negative))
    .filter((s): s is string => !!s);
  return out.length ? out.join(' / ') : null;
}

/** « je dois aller », « elle veut sortir » : modalité conjuguée + infinitif. */
export function translateModal(modal: 'devoir' | 'pouvoir' | 'vouloir', verbFr: string, token: string): string | null {
  const head = conjugate(modal, token, 'present');
  if (!head) return null;
  return infinitives(verbFr)
    .map((inf) => `${head} ${inf}`)
    .join(' / ');
}

/** « va ! » */
export function translateImperative(verbFr: string): string | null {
  const out = infinitives(verbFr).map((inf) => `${VERBS[inf].imperative} !`);
  return out.length ? out.join(' / ') : null;
}

/** Précision de genre pour « tu », que le français ne marque pas : « tu prends (à une femme) ». */
export function genderNote(token: string): string {
  if (token === 'Enta') return ' (à un homme)';
  if (token === 'Enti') return ' (à une femme)';
  return '';
}
