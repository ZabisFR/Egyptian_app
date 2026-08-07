/**
 * Mélange déterministe : la même graine produit toujours le même ordre.
 *
 * C'est ce qui permet de mélanger les questions côté serveur sans casser l'hydratation —
 * le client recalcule exactement la même liste — et sans appeler `Math.random()` pendant
 * un rendu, ce qui rendrait le composant non idempotent.
 */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Lit une graine depuis un paramètre d'URL. `null` = ordre d'origine. */
export function parseSeed(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}
