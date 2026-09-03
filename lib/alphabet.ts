import { ALPHABET_AUDIO } from './alphabet-audio';

/**
 * Les 28 lettres, dans l'ordre de l'alphabet arabe.
 *
 * `nom` reprend EXACTEMENT la clé de `ALPHABET_AUDIO`, elle-même calquée sur la colonne
 * « Nom » des tables du module-01. C'est ce qui permet de partager les fichiers audio sans
 * les redéclarer — et ce qui impose de ne jamais « nettoyer » ces libellés à la légère :
 * « Ha (7) » et « Ha léger » sont deux lettres différentes (ح et هـ).
 *
 * `isole` est la forme isolée, celle qu'on apprend à tracer en premier. Les formes liées
 * (initiale, médiane, finale) viendront plus tard s'il y a lieu.
 */
export type Lettre = {
  nom: string;
  isole: string;
  /** Transcription Arabizi telle qu'enseignée au module-01. */
  arabizi: string;
  audio: string;
  /** Nombre de traits attendus, points diacritiques compris. */
  traits: number;
};

const LETTRES: Omit<Lettre, 'audio'>[] = [
  { nom: 'Alif', isole: 'ا', arabizi: 'a', traits: 1 },
  { nom: 'Ba', isole: 'ب', arabizi: 'b', traits: 2 },
  { nom: 'Ta', isole: 'ت', arabizi: 't', traits: 3 },
  { nom: 'Tha', isole: 'ث', arabizi: 's / th', traits: 4 },
  { nom: 'Gim', isole: 'ج', arabizi: 'g', traits: 2 },
  { nom: 'Ha (7)', isole: 'ح', arabizi: '7', traits: 1 },
  { nom: 'Kha (5)', isole: 'خ', arabizi: 'kh', traits: 2 },
  { nom: 'Dal', isole: 'د', arabizi: 'd', traits: 1 },
  { nom: 'Dhal', isole: 'ذ', arabizi: 'z / dh', traits: 2 },
  { nom: 'Ra', isole: 'ر', arabizi: 'r', traits: 1 },
  { nom: 'Zay', isole: 'ز', arabizi: 'z', traits: 2 },
  { nom: 'Sseen', isole: 'س', arabizi: 's', traits: 1 },
  { nom: 'Sheen', isole: 'ش', arabizi: 'sh', traits: 4 },
  { nom: 'Sad', isole: 'ص', arabizi: 's', traits: 1 },
  { nom: 'Dad', isole: 'ض', arabizi: 'd', traits: 2 },
  { nom: 'Tta (6)', isole: 'ط', arabizi: 't', traits: 2 },
  { nom: 'Dza', isole: 'ظ', arabizi: 'z', traits: 3 },
  { nom: "'Ayn (3)", isole: 'ع', arabizi: '3', traits: 1 },
  { nom: 'Ghayn (Gh)', isole: 'غ', arabizi: 'gh', traits: 2 },
  { nom: 'Fa', isole: 'ف', arabizi: 'f', traits: 2 },
  { nom: 'Qaf (2)', isole: 'ق', arabizi: '2 / q', traits: 3 },
  { nom: 'Kaf', isole: 'ك', arabizi: 'k', traits: 2 },
  { nom: 'Lam', isole: 'ل', arabizi: 'l', traits: 1 },
  { nom: 'Meem', isole: 'م', arabizi: 'm', traits: 1 },
  { nom: 'Noon', isole: 'ن', arabizi: 'n', traits: 2 },
  { nom: 'Ha léger', isole: 'ه', arabizi: 'h', traits: 1 },
  { nom: 'Waw', isole: 'و', arabizi: 'w / o', traits: 1 },
  { nom: 'Ya', isole: 'ي', arabizi: 'y / i', traits: 3 },
];

export const ALPHABET: Lettre[] = LETTRES.map((l) => ({
  ...l,
  audio: ALPHABET_AUDIO[l.nom],
}));
