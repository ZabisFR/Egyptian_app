/**
 * Prononciation de chaque lettre de l'alphabet (module-01, Jours 1 à 8).
 *
 * La clé est le texte EXACT de la colonne « Nom » des tables markdown de ces leçons
 * (voir data/module-01.json) — pas dérivable automatiquement, car plusieurs lettres
 * partagent une racine de nom une fois la parenthèse Arabizi retirée : « Ha (7) » et
 * « Ha léger » ne sont pas la même lettre (ح vs هـ), donc pas le même fichier audio.
 *
 * `LessonViewer` ne consulte cette table que pour `module_id === 'module-01'`, pour ne
 * jamais risquer de matcher par coïncidence une cellule d'un tableau de conjugaison
 * ailleurs dans le contenu.
 */
export const ALPHABET_AUDIO: Record<string, string> = {
  Alif: '/audio/alphabet/alif.mp3',
  Ba: '/audio/alphabet/ba.mp3',
  Ta: '/audio/alphabet/ta.mp3',
  Tha: '/audio/alphabet/tha.mp3',
  Gim: '/audio/alphabet/gim.mp3',
  'Ha (7)': '/audio/alphabet/7a.mp3',
  'Kha (5)': '/audio/alphabet/kha.mp3',
  Dal: '/audio/alphabet/dal.mp3',
  Dhal: '/audio/alphabet/dhal.mp3',
  Ra: '/audio/alphabet/ra.mp3',
  Zay: '/audio/alphabet/zay.mp3',
  Sseen: '/audio/alphabet/sseen.mp3',
  Sheen: '/audio/alphabet/sheen.mp3',
  Sad: '/audio/alphabet/sad.mp3',
  Dad: '/audio/alphabet/dad.mp3',
  'Tta (6)': '/audio/alphabet/ta-fort.mp3',
  Dza: '/audio/alphabet/dza.mp3',
  "'Ayn (3)": '/audio/alphabet/ayn.mp3',
  'Ghayn (Gh)': '/audio/alphabet/ghayn.mp3',
  Fa: '/audio/alphabet/fa.mp3',
  'Qaf (2)': '/audio/alphabet/qaf.mp3',
  Kaf: '/audio/alphabet/kaf.mp3',
  Lam: '/audio/alphabet/lam.mp3',
  Meem: '/audio/alphabet/meem.mp3',
  Noon: '/audio/alphabet/noon.mp3',
  'Ha léger': '/audio/alphabet/ha-leger.mp3',
  Waw: '/audio/alphabet/waw.mp3',
  Ya: '/audio/alphabet/ya.mp3',
};
