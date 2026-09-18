import { ALPHABET_AUDIO } from './alphabet-audio';

/**
 * Les 28 lettres, dans l'ordre de l'alphabet arabe.
 *
 * `nom` reprend EXACTEMENT la clé de `ALPHABET_AUDIO`, elle-même calquée sur la colonne
 * « Nom » des tables du module-01. C'est ce qui permet de partager les fichiers audio sans
 * les redéclarer — et ce qui impose de ne jamais « nettoyer » ces libellés à la légère :
 * « Ha (7) » et « Ha léger » sont deux lettres différentes (ح et هـ).
 *
 * `isole` est la forme isolée, celle qu'on apprend à tracer en premier. Les trois formes
 * liées en sont DÉRIVÉES, jamais saisies à la main : les recopier une à une pour
 * vingt-huit lettres, c'est vingt-huit occasions de coller la mauvaise.
 */
export type Lettre = {
  nom: string;
  isole: string;
  /** Transcription Arabizi telle qu'enseignée au module-01. */
  arabizi: string;
  audio: string;
  /** Nombre de traits attendus, points diacritiques compris. */
  traits: number;
  /**
   * Se lie à la lettre SUIVANTE. Faux pour six lettres (ا د ذ ر ز و), qui s'accrochent à
   * la précédente mais jamais à la suivante — c'est ce qui crée les blancs à l'intérieur
   * des mots arabes, et la première chose qui déroute quand on apprend à lire.
   */
  attachante: boolean;
  /** Forme en début de mot. */
  initiale: string;
  /** Forme au milieu d'un mot. */
  mediane: string;
  /** Forme en fin de mot. */
  finale: string;
};

/**
 * Les six lettres qui ne se lient pas à la suivante.
 *
 * Conséquence directe : en début de mot elles gardent leur forme isolée, et au milieu
 * comme à la fin elles prennent la même forme — attachée à droite seulement. Deux des
 * quatre cases du tableau sont donc des doublons, et c'est une information, pas un bug.
 */
const NON_ATTACHANTES = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']);

/**
 * Kashida (U+0640), le trait d'étirement.
 *
 * C'est elle qui matérialise l'attache : une lettre suivie d'une kashida prend sa forme
 * initiale, encadrée sa forme médiane, précédée sa forme finale. On laisse donc la police
 * faire son travail de façonnage au lieu de coder en dur les formes de présentation
 * (U+FE70–U+FEFF), que toutes les polices arabes ne couvrent pas.
 */
const KASHIDA = 'ـ';

/** Ce qui est réellement saisi ; tout le reste de `Lettre` en est dérivé. */
type Saisie = Pick<Lettre, 'nom' | 'isole' | 'arabizi' | 'traits'>;

const LETTRES: Saisie[] = [
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

export const ALPHABET: Lettre[] = LETTRES.map((l) => {
  const attachante = !NON_ATTACHANTES.has(l.isole);

  return {
    ...l,
    audio: ALPHABET_AUDIO[l.nom],
    attachante,
    initiale: attachante ? `${l.isole}${KASHIDA}` : l.isole,
    mediane: attachante ? `${KASHIDA}${l.isole}${KASHIDA}` : `${KASHIDA}${l.isole}`,
    finale: `${KASHIDA}${l.isole}`,
  };
});
