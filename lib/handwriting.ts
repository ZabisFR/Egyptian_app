/**
 * Notation d'un tracé de lettre arabe, sans modèle d'apprentissage.
 *
 * L'exercice ne demande pas de RECONNAÎTRE une lettre quelconque, mais de juger si le
 * tracé correspond à la lettre demandée — ce qui est un problème beaucoup plus simple et,
 * pédagogiquement, plus utile : on peut dire ce qui cloche, pas seulement quelle lettre
 * on croit lire.
 *
 * Tout se ramène donc à comparer deux masques binaires : celui du modèle (la lettre
 * rendue avec la police) et celui de l'apprenant. Aucun réseau de neurones, aucun poids à
 * télécharger, aucune requête à un tiers — le calcul tient dans quelques kilo-octets et
 * s'exécute entièrement dans le navigateur.
 */

export type Masque = {
  data: Uint8Array;
  w: number;
  h: number;
};

export type Note = {
  /** 0 à 100. */
  score: number;
  /** Part du tracé qui tombe sur le modèle — bas = ça déborde. */
  precision: number;
  /** Part du modèle qui a été couverte — bas = il manque des morceaux. */
  rappel: number;
  encre: number;
};

export function creerMasque(w: number, h: number): Masque {
  return { data: new Uint8Array(w * h), w, h };
}

export function compterEncre(m: Masque): number {
  let n = 0;
  for (let i = 0; i < m.data.length; i++) if (m.data[i]) n++;
  return n;
}

/** Masque à partir du canal alpha d'un canvas — le cas du tracé à la souris ou au doigt. */
export function masqueDepuisAlpha(img: ImageData, seuil = 40): Masque {
  const m = creerMasque(img.width, img.height);
  for (let i = 0, p = 3; i < m.data.length; i++, p += 4) {
    m.data[i] = img.data[p] > seuil ? 1 : 0;
  }
  return m;
}

/**
 * Seuil d'Otsu : sépare l'image en deux classes en maximisant la variance inter-classe.
 * Choisi plutôt qu'un seuil fixe parce qu'une photo de cahier n'a jamais deux fois la même
 * exposition — un seuil en dur marcherait sur une photo et échouerait sur la suivante.
 */
function otsu(histogramme: Int32Array, total: number): number {
  let somme = 0;
  for (let i = 0; i < 256; i++) somme += i * histogramme[i];

  let sommeFond = 0;
  let poidsFond = 0;
  let varianceMax = -1;
  let seuil = 127;

  for (let t = 0; t < 256; t++) {
    poidsFond += histogramme[t];
    if (poidsFond === 0) continue;
    const poidsObjet = total - poidsFond;
    if (poidsObjet === 0) break;

    sommeFond += t * histogramme[t];
    const moyenneFond = sommeFond / poidsFond;
    const moyenneObjet = (somme - sommeFond) / poidsObjet;
    const variance = poidsFond * poidsObjet * (moyenneFond - moyenneObjet) ** 2;

    if (variance > varianceMax) {
      varianceMax = variance;
      seuil = t;
    }
  }
  return seuil;
}

/**
 * Masque à partir d'une photo : niveaux de gris, seuil d'Otsu, puis détection de polarité.
 *
 * La polarité n'est pas devinable a priori : on écrit d'habitude en noir sur blanc, mais
 * une photo d'ardoise ou un mode sombre inversent tout. On regarde donc quelle classe est
 * minoritaire — l'encre couvre toujours moins de surface que le support.
 */
export function masqueDepuisPhoto(img: ImageData): Masque {
  const n = img.width * img.height;
  const gris = new Uint8Array(n);
  const histogramme = new Int32Array(256);

  for (let i = 0, p = 0; i < n; i++, p += 4) {
    // Luminance perceptuelle : un rouge et un bleu de même valeur ne pèsent pas pareil.
    const g = (img.data[p] * 77 + img.data[p + 1] * 150 + img.data[p + 2] * 29) >> 8;
    gris[i] = g;
    histogramme[g]++;
  }

  const seuil = otsu(histogramme, n);

  let sombres = 0;
  for (let i = 0; i < n; i++) if (gris[i] <= seuil) sombres++;
  const encreEstSombre = sombres <= n - sombres;

  const m = creerMasque(img.width, img.height);
  for (let i = 0; i < n; i++) {
    const sombre = gris[i] <= seuil;
    m.data[i] = sombre === encreEstSombre ? 1 : 0;
  }
  return m;
}

/**
 * Retire les taches : composantes connexes trop petites pour être un morceau de lettre.
 *
 * Indispensable sur une photo — grain du papier, ombre d'une ligne, poussière. Le seuil
 * est relatif et non absolu, car un point diacritique est minuscule mais essentiel : ب
 * sans son point devient ت. On ne supprime donc que ce qui est nettement plus petit que
 * ce qu'un point représenterait.
 */
export function retirerTaches(m: Masque, partMin = 0.004): Masque {
  const total = compterEncre(m);
  if (total === 0) return m;

  const etiquettes = new Int32Array(m.data.length).fill(-1);
  const tailles: number[] = [];
  const pile: number[] = [];

  for (let depart = 0; depart < m.data.length; depart++) {
    if (!m.data[depart] || etiquettes[depart] !== -1) continue;
    const id = tailles.length;
    let taille = 0;
    pile.push(depart);
    etiquettes[depart] = id;

    while (pile.length) {
      const i = pile.pop()!;
      taille++;
      const x = i % m.w;
      const y = (i / m.w) | 0;
      // Voisinage 8-connexe : en 4-connexe, un trait fin en diagonale se fragmente.
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
          const j = ny * m.w + nx;
          if (m.data[j] && etiquettes[j] === -1) {
            etiquettes[j] = id;
            pile.push(j);
          }
        }
      }
    }
    tailles.push(taille);
  }

  const seuil = Math.max(2, total * partMin);
  const out = creerMasque(m.w, m.h);
  for (let i = 0; i < m.data.length; i++) {
    if (m.data[i] && tailles[etiquettes[i]] >= seuil) out.data[i] = 1;
  }
  return out;
}

export type Boite = { x0: number; y0: number; x1: number; y1: number };

export function boiteEnglobante(m: Masque): Boite | null {
  let x0 = m.w;
  let y0 = m.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      if (!m.data[y * m.w + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/**
 * Recadre l'encre sur sa boîte englobante et la redimensionne pour occuper la même boîte
 * que la référence, en conservant les proportions.
 *
 * Sert au mode photo : la lettre y est à une position, une taille et une distance
 * quelconques. Sans recadrage, on comparerait surtout des cadrages, pas des formes. Les
 * proportions, elles, sont conservées : un ع écrasé n'est pas un ع réussi.
 */
export function recadrerVers(m: Masque, cible: Masque, boiteCible: Boite): Masque {
  const boite = boiteEnglobante(m);
  const out = creerMasque(cible.w, cible.h);
  if (!boite) return out;

  const lSrc = boite.x1 - boite.x0 + 1;
  const hSrc = boite.y1 - boite.y0 + 1;
  const lDst = boiteCible.x1 - boiteCible.x0 + 1;
  const hDst = boiteCible.y1 - boiteCible.y0 + 1;

  const echelle = Math.min(lDst / lSrc, hDst / hSrc);
  const decalageX = boiteCible.x0 + (lDst - lSrc * echelle) / 2;
  const decalageY = boiteCible.y0 + (hDst - hSrc * echelle) / 2;

  // Parcours de la destination et non de la source : parcourir la source laisse des trous
  // dès que l'échelle agrandit.
  for (let y = 0; y < out.h; y++) {
    const sy = Math.round((y - decalageY) / echelle) + boite.y0;
    if (sy < boite.y0 || sy > boite.y1) continue;
    for (let x = 0; x < out.w; x++) {
      const sx = Math.round((x - decalageX) / echelle) + boite.x0;
      if (sx < boite.x0 || sx > boite.x1) continue;
      if (m.data[sy * m.w + sx]) out.data[y * out.w + x] = 1;
    }
  }
  return out;
}

/**
 * Dilatation carrée de rayon `r`, en deux passes 1D et sommes préfixes : O(n) au lieu du
 * O(n·r²) d'une convolution naïve. À 512×512 et r = 16, la différence est celle entre
 * imperceptible et une seconde de blocage.
 */
export function dilater(m: Masque, r: number): Masque {
  if (r <= 0) return m;
  const temp = creerMasque(m.w, m.h);
  const out = creerMasque(m.w, m.h);
  const prefixe = new Int32Array(Math.max(m.w, m.h) + 1);

  for (let y = 0; y < m.h; y++) {
    const base = y * m.w;
    prefixe[0] = 0;
    for (let x = 0; x < m.w; x++) prefixe[x + 1] = prefixe[x] + m.data[base + x];
    for (let x = 0; x < m.w; x++) {
      const a = Math.max(0, x - r);
      const b = Math.min(m.w, x + r + 1);
      temp.data[base + x] = prefixe[b] - prefixe[a] > 0 ? 1 : 0;
    }
  }

  for (let x = 0; x < m.w; x++) {
    prefixe[0] = 0;
    for (let y = 0; y < m.h; y++) prefixe[y + 1] = prefixe[y] + temp.data[y * m.w + x];
    for (let y = 0; y < m.h; y++) {
      const a = Math.max(0, y - r);
      const b = Math.min(m.h, y + r + 1);
      out.data[y * m.w + x] = prefixe[b] - prefixe[a] > 0 ? 1 : 0;
    }
  }
  return out;
}

/**
 * Compare le tracé au modèle.
 *
 * Deux mesures complémentaires, parce qu'une seule se triche :
 * — le RAPPEL seul se maximise en noircissant toute la zone ;
 * — la PRÉCISION seule se maximise en ne traçant qu'un point bien placé.
 * Leur moyenne harmonique (F1) n'est haute que si le tracé couvre le modèle ET s'y tient.
 *
 * La tolérance est une dilatation : elle autorise un écart de quelques pixels, sans quoi
 * aucun tracé humain ne dépasserait 30 %.
 */
export function comparer(trace: Masque, modele: Masque, tolerance: number): Note {
  const encre = compterEncre(trace);
  const encreModele = compterEncre(modele);
  if (encre === 0 || encreModele === 0) {
    return { score: 0, precision: 0, rappel: 0, encre };
  }

  const modeleLarge = dilater(modele, tolerance);
  const traceLarge = dilater(trace, tolerance);

  let dansModele = 0;
  for (let i = 0; i < trace.data.length; i++) {
    if (trace.data[i] && modeleLarge.data[i]) dansModele++;
  }
  let couvert = 0;
  for (let i = 0; i < modele.data.length; i++) {
    if (modele.data[i] && traceLarge.data[i]) couvert++;
  }

  const precision = dansModele / encre;
  const rappel = couvert / encreModele;
  const f1 = precision + rappel === 0 ? 0 : (2 * precision * rappel) / (precision + rappel);

  return {
    score: Math.round(f1 * 100),
    precision: Math.round(precision * 100),
    rappel: Math.round(rappel * 100),
    encre,
  };
}

/**
 * Facteur de 0 à 1 comparant les proportions de deux formes.
 *
 * Nécessaire au mode photo uniquement. Le recadrage y ramène l'encre dans la boîte du
 * modèle : deux lettres pourtant très différentes finissent superposables. Mesuré, la
 * photo d'un ع notée contre le modèle d'un alif obtenait 65 % — l'alif est si étroit que
 * n'importe quelle forme centrée tombe dessus.
 *
 * Or les proportions font partie de la lettre : un alif est haut et fin, un ع presque
 * carré. On tolère un écart jusqu'à 1,6 fois — l'écriture à la main respire — et on
 * pénalise proportionnellement au-delà.
 */
export function facteurProportions(a: Masque, b: Masque): number {
  const ba = boiteEnglobante(a);
  const bb = boiteEnglobante(b);
  if (!ba || !bb) return 0;

  const ratio = (x: Boite) => (x.x1 - x.x0 + 1) / (x.y1 - x.y0 + 1);
  const ra = ratio(ba);
  const rb = ratio(bb);
  const proche = Math.min(ra, rb) / Math.max(ra, rb);

  const TOLERE = 0.62; // 1 / 1,6
  return proche >= TOLERE ? 1 : proche / TOLERE;
}

/** Commentaire en français clair, dérivé des deux mesures. */
export function commenter(note: Note, traits: number, traitsFaits: number): string {
  if (note.encre === 0) return "Rien n'a été tracé.";
  if (note.score >= 85) return 'Très proche du modèle. La forme et les proportions y sont.';
  if (note.rappel < 55 && note.precision >= 70)
    return 'Le tracé est bien placé mais incomplet : il manque une partie de la lettre.';
  if (note.precision < 55 && note.rappel >= 70)
    return 'La lettre est couverte, mais le trait déborde largement du modèle.';
  if (note.score >= 65)
    return traitsFaits < traits
      ? `La forme générale est là. Attention : cette lettre demande ${traits} trait${traits > 1 ? 's' : ''}, points compris.`
      : 'La forme générale est là, mais le tracé s’écarte encore par endroits.';
  return 'La forme ne correspond pas encore au modèle. Reprenez lentement, en suivant le tracé gris.';
}
