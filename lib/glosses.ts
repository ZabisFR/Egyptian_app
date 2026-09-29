/**
 * Traduction des propositions d'un QCM, affichée une fois la réponse donnée.
 *
 * Les questions de quiz ne stockent pas de traduction : elle est recalculée au rendu à
 * partir du vocabulaire du cours. Rien à régénérer en base, et une correction dans
 * `vocab_items` se répercute d'elle-même.
 *
 * Une proposition peut être dans trois écritures, et chacune appelle l'autre moitié :
 * - en arabe (« بنطلون ») → sa prononciation et son sens ;
 * - en Arabizi (« gazar ») → son sens ;
 * - en français (« chien ») → le mot égyptien.
 */

type Word = { arabic: string | null; transliteration: string; french: string };

const ARABIC = /[؀-ۿ]/;

export type Glosser = (choice: string) => string | null;

export function makeGlosser(vocab: Word[]): Glosser {
  const byArabic = new Map<string, Word>();
  const byTranslit = new Map<string, Word>();
  const byFrench = new Map<string, Word>();

  // Premier arrivé, premier servi : les doublons du vocabulaire portent le même sens.
  for (const w of vocab) {
    if (w.arabic && !byArabic.has(w.arabic)) byArabic.set(w.arabic, w);
    if (!byTranslit.has(w.transliteration)) byTranslit.set(w.transliteration, w);
    if (!byFrench.has(w.french)) byFrench.set(w.french, w);
  }

  return (choice) => {
    if (ARABIC.test(choice)) {
      const w = byArabic.get(choice);
      return w ? `${w.transliteration} — ${w.french}` : null;
    }

    const t = byTranslit.get(choice);
    if (t) return t.french;

    const f = byFrench.get(choice);
    if (f) return f.arabic ? `${f.transliteration} · ${f.arabic}` : f.transliteration;

    return null;
  };
}

/** Les traductions connues d'une liste de propositions. */
export function glossesOf(choices: string[], glosser: Glosser): Record<string, string> {
  const out: Record<string, string> = {};
  for (const choice of choices) {
    const gloss = glosser(choice);
    if (gloss) out[choice] = gloss;
  }
  return out;
}
