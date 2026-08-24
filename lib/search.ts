/**
 * Recherche de vocabulaire — normalisation et score.
 *
 * Le corpus est trilingue par nature : un même mot s'écrit en arabe (مساء), en Arabizi
 * (masa2) et en français (soir). L'apprenant tape ce dont il se souvient, souvent mal :
 * sans accent, sans les chiffres de l'Arabizi, sans les voyelles courtes arabes. Chaque
 * écriture a donc sa propre normalisation.
 */

export type VocabHit = {
  /** id de l'item, sert d'ancre dans la page de la leçon */
  i: string;
  /** arabe */
  a: string | null;
  /** translittération (Arabizi) */
  t: string;
  /** français */
  f: string;
  /** id du module */
  m: string;
  /** titre du module — sert d'étiquette de thème dans le glossaire */
  mt: string;
  /** id de la leçon */
  l: string;
  /** titre de la leçon */
  lt: string;
  /** jour, quand la leçon en a un */
  d: number | null;
};

/**
 * Français : minuscules et sans accents. « égyptien » et « egyptien » doivent trouver la
 * même chose — personne ne tape les accents dans un champ de recherche.
 */
export function foldLatin(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Arabizi sans ses chiffres : « 3ayn » devient « ayn », « el-7amdo » devient « el-amdo ».
 * Un débutant qui a entendu le mot sans savoir l'écrire tapera la version sans chiffres ;
 * c'est une correspondance secondaire, donc moins bien notée que la forme exacte.
 */
export function foldArabizi(input: string): string {
  return foldLatin(input).replace(/[0-9]/g, '');
}

/**
 * Arabe : sans voyelles courtes ni signes, et avec les variantes de lettres ramenées à une
 * forme unique. Un clavier arabe standard ne produit ni les harakat ni la hamza portée :
 * qui tape « اسود » ne doit pas manquer « إسود ».
 */
export function foldArabic(input: string): string {
  return input
    .replace(/[ً-ْٰـ]/g, '') // harakat, sukun, alef supérieur, tatweel
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ → ا
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/ة/g, 'ه') // ة → ه
    .trim();
}

/** Contient-il des caractères arabes ? Détermine la normalisation à appliquer. */
export function isArabic(input: string): boolean {
  return /[؀-ۿ]/.test(input);
}

/**
 * Note d'un item pour une requête donnée. Plus le score est haut, plus le résultat remonte.
 * `0` signifie « ne correspond pas » et l'item est écarté.
 *
 * L'échelle privilégie l'égalité stricte, puis le début de mot, puis l'inclusion : taper
 * « sab » doit proposer « sabt » (samedi) avant « el-sabt elli fat », et jamais l'inverse.
 */
export function scoreHit(hit: VocabHit, query: string): number {
  if (!query) return 0;

  if (isArabic(query)) {
    if (!hit.a) return 0;
    const champ = foldArabic(hit.a);
    const q = foldArabic(query);
    if (champ === q) return 100;
    if (champ.startsWith(q)) return 80;
    if (champ.includes(q)) return 60;
    return 0;
  }

  const q = foldLatin(query);
  const qSansChiffres = foldArabizi(query);
  let best = 0;

  // La translittération passe avant le français : dans une appli de langue, taper
  // « bokra » cherche presque toujours le mot arabe, pas une traduction qui le contient.
  for (const [champ, base] of [
    [foldLatin(hit.t), 100],
    [foldLatin(hit.f), 90],
  ] as const) {
    if (champ === q) best = Math.max(best, base);
    else if (champ.startsWith(q)) best = Math.max(best, base - 20);
    else if (champ.includes(q)) best = Math.max(best, base - 40);
  }

  // Correspondance secondaire, sans les chiffres de l'Arabizi.
  if (best === 0 && qSansChiffres) {
    const champ = foldArabizi(hit.t);
    if (champ === qSansChiffres) best = 55;
    else if (champ.startsWith(qSansChiffres)) best = 45;
    else if (champ.includes(qSansChiffres)) best = 35;
  }

  return best;
}

/** Les `limit` meilleurs résultats, du plus pertinent au moins pertinent. */
export function searchVocab(index: VocabHit[], query: string, limit = 8): VocabHit[] {
  const q = query.trim();
  if (q.length < 1) return [];

  const scored: { hit: VocabHit; score: number }[] = [];
  for (const hit of index) {
    const score = scoreHit(hit, q);
    if (score > 0) scored.push({ hit, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // À score égal, le mot le plus court d'abord : c'est le plus proche de la requête.
    return a.hit.t.length - b.hit.t.length;
  });

  return scored.slice(0, limit).map((s) => s.hit);
}
