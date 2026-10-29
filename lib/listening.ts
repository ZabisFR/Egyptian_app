import { seededShuffle } from '@/lib/shuffle';
import { audioKey, vocabAudioSrc } from '@/lib/vocab-audio';
import { glossesOf, makeGlosser } from '@/lib/glosses';
import type { QuizQuestionView } from '@/components/QuizEngine';

/**
 * Exercice d'écoute : le mot est joué sans être affiché, l'élève choisit son sens parmi
 * quatre. Utilisé par l'entraînement (`/entrainement/ecoute`), la leçon du jour et le bloc
 * de fin de leçon.
 *
 * N'interroge que des mots au son de confiance (validé à l'oreille ou enregistré par une
 * voix égyptienne, voir `lib/vocab-audio.ts`) : faire reconnaître un son faux apprendrait
 * la mauvaise prononciation.
 */

type Word = { id: string; arabic: string | null; transliteration: string; french: string };

export const LISTEN_PROMPT = 'Écoutez : que veut dire ce mot ?';

/** FNV-1a : une graine stable à partir d'un texte (utilisateur + date, identifiant…). */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Les mots qu'on peut faire écouter, un par son. Deux leçons qui enseignent le même mot
 * le partagent : sans ce dédoublonnage, la même question pourrait tomber deux fois.
 */
export function listenable<T extends Word>(words: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const w of words) {
    if (!w.arabic || !vocabAudioSrc(w.arabic)) continue;
    const key = audioKey(w.arabic);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

/**
 * Une question d'écoute, ou `null` faute de trois leurres valables.
 *
 * `candidates` est déjà dans l'ordre de préférence des leurres (mélangé par l'appelant :
 * d'abord la même leçon, puis le reste, par exemple). Un leurre ne peut pas être une autre
 * traduction du même son (`allWords` les connaît toutes) : « Moi / Je » et « Je / Moi »
 * pour أنا seraient deux bonnes réponses.
 */
export function listeningQuestion(
  item: Word,
  candidates: Word[],
  allWords: Word[],
  seed: number
): QuizQuestionView | null {
  const src = item.arabic ? vocabAudioSrc(item.arabic) : null;
  if (!src || !item.arabic) return null;

  const key = audioKey(item.arabic);
  const sameSound = new Set(
    allWords.filter((w) => w.arabic && audioKey(w.arabic) === key).map((w) => w.french)
  );
  sameSound.add(item.french);

  const distractors: string[] = [];
  for (const c of candidates) {
    if (!c.arabic || audioKey(c.arabic) === key) continue;
    if (sameSound.has(c.french) || distractors.includes(c.french)) continue;
    distractors.push(c.french);
    if (distractors.length === 3) break;
  }
  if (distractors.length < 3) return null;

  const choices = seededShuffle([item.french, ...distractors], seed);
  return {
    id: `ecoute-${item.id}`,
    question_text: LISTEN_PROMPT,
    choices,
    correct_answer: item.french,
    difficulty: null,
    // Après la réponse, chaque proposition montre son mot égyptien : l'élève relie le son
    // entendu à ceux qu'il a failli confondre.
    glosses: glossesOf(choices, makeGlosser(allWords)),
    audio: src,
    reveal: `${item.arabic} — ${item.transliteration}`,
  };
}

/**
 * Une série d'écoute : `size` mots tirés de `items`, leurres pris d'abord dans `items`
 * (même thème, même leçon), puis dans `fallback` s'il n'y en a pas assez.
 */
export function listeningSeries(
  items: Word[],
  fallback: Word[],
  allWords: Word[],
  seed: number,
  size: number
): QuizQuestionView[] {
  const questions: QuizQuestionView[] = [];
  for (const item of seededShuffle(listenable(items), seed)) {
    const s = hashSeed(`${seed}:${item.id}`);
    const candidates = [...seededShuffle(items, s), ...seededShuffle(fallback, s + 1)];
    const q = listeningQuestion(item, candidates, allWords, s);
    if (q) questions.push(q);
    if (questions.length === size) break;
  }
  return questions;
}
