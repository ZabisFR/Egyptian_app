import manifest from '@/data/audio-manifest.json';
import review from '@/data/audio-review.json';

/**
 * Prononciation des mots du vocabulaire, dans `public/audio/vocab/`.
 *
 * Deux origines, notées dans `data/audio-manifest.json` :
 * - `voice: "humain"` : enregistré par une locutrice égyptienne. Toujours servi.
 * - une voix Azure (`npm run generate:audio`) : servi **seulement s'il a été validé à
 *   l'oreille** dans `data/audio-review.json`. Mesuré à l'écoute : environ un mot sur quatre
 *   sortait faux (consonne finale avalée, voyelle changée, ق lu à l'arabe standard). Un son
 *   faux est pire que pas de son dans une appli de prononciation : un mot non validé reste
 *   donc muet.
 *
 * La validation porte sur le texte envoyé à la voix : si un mot est régénéré avec un autre
 * texte (correction de prononciation), son ancien ✓ ne vaut plus et il redevient muet.
 *
 * La clé est l'écriture arabe du mot, et non l'identifiant de la ligne `vocab_items` :
 * `npm run import` régénère les UUID à chaque réimport, une clé par identifiant perdrait
 * tous les sons. Deux leçons qui enseignent le même mot partagent donc le même fichier.
 */
type Entry = { file: string; text: string; voice: string };
type Verdict = { verdict: 'ok' | 'ko'; text: string };

const entries = (manifest as { entries: Record<string, Entry> }).entries;
const verdicts = review as Record<string, Verdict>;

/** Forme canonique d'un mot pour la recherche dans le manifeste. Le script de génération
 *  et l'outil de tri utilisent la même règle : les côtés ne peuvent pas diverger. */
export function audioKey(arabic: string): string {
  return arabic.trim().normalize('NFC');
}

/** URL du son d'un mot, ou `null` s'il n'en a pas de fiable (gabarit de grammaire, son
 *  refusé ou pas encore écouté, mot ajouté après la dernière génération). */
export function vocabAudioSrc(arabic: string | null | undefined): string | null {
  if (!arabic) return null;
  const key = audioKey(arabic);
  const entry = entries[key];
  if (!entry) return null;
  const v = verdicts[key];
  const trusted = entry.voice === 'humain' || (v?.verdict === 'ok' && v.text === entry.text);
  return trusted ? `/audio/vocab/${entry.file}` : null;
}
