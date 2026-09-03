'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ALPHABET, type Lettre } from '@/lib/alphabet';
import {
  boiteEnglobante,
  commenter,
  comparer,
  facteurProportions,
  masqueDepuisAlpha,
  masqueDepuisPhoto,
  recadrerVers,
  retirerTaches,
  type Boite,
  type Masque,
  type Note,
} from '@/lib/handwriting';

/**
 * Résolutions de travail, en pixels, indépendantes de l'écran.
 *
 * Le tracé est mémorisé en coordonnées normalisées (0 à 1) puis rejoué à ces tailles
 * fixes : sans cela, un téléphone à écran dense et un ordinateur ne donneraient pas la
 * même note pour le même geste, ce qui rendrait le pourcentage incomparable d'une séance
 * à l'autre.
 */
const NOTATION = 320;
const IDENTIFICATION = 160;
const EPAISSEUR = 16 / NOTATION;
const TOLERANCE = 12;

type Point = { x: number; y: number };
type Trait = Point[];

/** Rend une lettre dans un masque, à la taille voulue. */
function masqueLettre(lettre: string, taille: number, police: string): Masque {
  const canvas = document.createElement('canvas');
  canvas.width = taille;
  canvas.height = taille;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, taille, taille);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(taille * 0.6)}px ${police}`;
  ctx.fillText(lettre, taille / 2, taille / 2);
  return masqueDepuisAlpha(ctx.getImageData(0, 0, taille, taille), 60);
}

/** Rejoue les traits dans un masque à la résolution de notation. */
function masqueTrace(traits: Trait[], taille: number): Masque {
  const canvas = document.createElement('canvas');
  canvas.width = taille;
  canvas.height = taille;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = EPAISSEUR * taille;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const trait of traits) {
    if (trait.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(trait[0].x * taille, trait[0].y * taille);
    // Un point isolé ne dessine rien avec `stroke()` : on trace un segment nul, que
    // `lineCap: round` transforme en disque.
    if (trait.length === 1) ctx.lineTo(trait[0].x * taille, trait[0].y * taille);
    else for (const p of trait.slice(1)) ctx.lineTo(p.x * taille, p.y * taille);
    ctx.stroke();
  }
  return masqueDepuisAlpha(ctx.getImageData(0, 0, taille, taille), 60);
}

export default function LetterTracer({ police }: { police: string }) {
  const [lettre, setLettre] = useState<Lettre>(ALPHABET[0]);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [confusion, setConfusion] = useState<Lettre | null>(null);
  const [guide, setGuide] = useState(true);
  const [policePrete, setPolicePrete] = useState(false);
  const [photoErreur, setPhotoErreur] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const traitEnCours = useRef<Trait | null>(null);
  const modeles = useRef<Map<string, Masque>>(new Map());

  // La police doit être chargée avant qu'on rende le modèle : sinon le canvas dessine
  // avec la police de repli et le modèle mesuré n'est pas celui qu'on affiche.
  useEffect(() => {
    let vivant = true;
    document.fonts
      .load(`600 100px ${police}`, ALPHABET.map((l) => l.isole).join(''))
      .then(() => document.fonts.ready)
      .then(() => {
        if (vivant) setPolicePrete(true);
      })
      .catch(() => {
        if (vivant) setPolicePrete(true);
      });
    return () => {
      vivant = false;
    };
  }, [police]);

  /** Redessine le canvas visible : modèle en filigrane, puis les traits. */
  const peindre = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cote = canvas.clientWidth;
    if (canvas.width !== cote * dpr) {
      canvas.width = cote * dpr;
      canvas.height = cote * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cote, cote);

    if (guide && policePrete) {
      ctx.save();
      const styles = getComputedStyle(canvas);
      ctx.fillStyle = styles.getPropertyValue('--trace-guide').trim() || '#d8c9ae';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(cote * 0.6)}px ${police}`;
      ctx.fillText(lettre.isole, cote / 2, cote / 2);
      ctx.restore();
    }

    ctx.strokeStyle =
      getComputedStyle(canvas).getPropertyValue('--trace-encre').trim() || '#1f4e79';
    ctx.lineWidth = EPAISSEUR * cote;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const trait of traits) {
      if (!trait.length) continue;
      ctx.beginPath();
      ctx.moveTo(trait[0].x * cote, trait[0].y * cote);
      if (trait.length === 1) ctx.lineTo(trait[0].x * cote, trait[0].y * cote);
      else for (const p of trait.slice(1)) ctx.lineTo(p.x * cote, p.y * cote);
      ctx.stroke();
    }
  }, [traits, guide, lettre, police, policePrete]);

  useEffect(() => {
    peindre();
  }, [peindre]);

  useEffect(() => {
    const onResize = () => peindre();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [peindre]);

  function positionNormalisee(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  /*
    Le trait en cours est copié AVANT d'entrer dans la fonction de mise à jour d'état.
    Y lire `traitEnCours.current` semblait plus court, mais l'updater s'exécute plus tard :
    quand le geste se termine dans le même lot, la ref est déjà remise à `null` et le
    composant plantait sur « n'est pas itérable ». Copier fige aussi le tableau, sinon
    l'état contiendrait la référence qu'on mute juste après — et React ne verrait aucun
    changement.
  */
  function commencerTrait(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId) === false) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointeur synthétique ou déjà relâché : la capture n'est qu'un confort.
      }
    }
    const debut = [positionNormalisee(e)];
    traitEnCours.current = debut;
    setTraits((t) => [...t, [...debut]]);
    setNote(null);
    setConfusion(null);
  }

  function continuerTrait(e: React.PointerEvent<HTMLCanvasElement>) {
    const trait = traitEnCours.current;
    if (!trait) return;
    trait.push(positionNormalisee(e));
    const copie = [...trait];
    setTraits((t) => (t.length ? [...t.slice(0, -1), copie] : [copie]));
  }

  function finirTrait() {
    traitEnCours.current = null;
  }

  function effacer() {
    setTraits([]);
    setNote(null);
    setConfusion(null);
    setPhotoErreur(null);
  }

  /** Modèle mémorisé : on ne re-rend pas 28 glyphes à chaque correction. */
  function modele(l: string, taille: number): Masque {
    const cle = `${l}@${taille}`;
    const cache = modeles.current.get(cle);
    if (cache) return cache;
    const m = masqueLettre(l, taille, police);
    modeles.current.set(cle, m);
    return m;
  }

  /**
   * À quelle lettre ce tracé ressemble-t-il le plus ?
   *
   * C'est la partie « reconnaissance » : on compare la forme aux 28 modèles, normalisée
   * dans la même boîte. Utile surtout quand c'est raté — savoir qu'on a écrit un ح à la
   * place d'un ج vaut mieux qu'un pourcentage bas sans explication.
   */
  function identifier(trace: Masque): Lettre | null {
    const boite = boiteEnglobante(trace);
    if (!boite) return null;

    let meilleure: { l: Lettre; score: number } | null = null;
    for (const candidate of ALPHABET) {
      const ref = modele(candidate.isole, IDENTIFICATION);
      const boiteRef = boiteEnglobante(ref);
      if (!boiteRef) continue;
      const traceAjustee = recadrerVers(trace, ref, boiteRef);
      const { score } = comparer(traceAjustee, ref, Math.round(TOLERANCE / 2));
      if (!meilleure || score > meilleure.score) meilleure = { l: candidate, score };
    }
    return meilleure?.l ?? null;
  }

  function corriger() {
    if (!traits.length) return;
    const trace = masqueTrace(traits, NOTATION);
    const resultat = comparer(trace, modele(lettre.isole, NOTATION), TOLERANCE);
    setNote(resultat);

    const traceIdentification = masqueTrace(traits, IDENTIFICATION);
    const devinee = identifier(traceIdentification);
    setConfusion(devinee && devinee.nom !== lettre.nom ? devinee : null);
  }

  /**
   * Mode photo. Le tracé n'est plus dans le canvas : on binarise l'image, on retire les
   * taches, puis on recale l'encre sur la boîte du modèle avant de comparer — une photo
   * n'a ni la position ni l'échelle du modèle.
   */
  async function analyserPhoto(fichier: File) {
    setAnalyse(true);
    setPhotoErreur(null);
    setNote(null);
    setConfusion(null);
    try {
      const bitmap = await createImageBitmap(fichier);
      // Réduction avant traitement : une photo de téléphone fait plusieurs mégapixels,
      // et l'étiquetage des composantes connexes y prendrait des secondes pour rien.
      const cote = 480;
      const echelle = Math.min(cote / bitmap.width, cote / bitmap.height, 1);
      const w = Math.max(1, Math.round(bitmap.width * echelle));
      const h = Math.max(1, Math.round(bitmap.height * echelle));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();

      const brut = masqueDepuisPhoto(ctx.getImageData(0, 0, w, h));
      const propre = retirerTaches(brut);
      const boite = boiteEnglobante(propre);
      if (!boite) {
        setPhotoErreur("Aucune écriture n'a été trouvée sur la photo.");
        return;
      }

      // Une encre qui couvre presque toute l'image, c'est une photo trop sombre ou un
      // cadrage raté, pas une lettre : mieux vaut le dire que noter n'importe quoi.
      const couverture =
        ((boite.x1 - boite.x0 + 1) * (boite.y1 - boite.y0 + 1)) / (w * h);
      if (couverture > 0.92) {
        setPhotoErreur(
          'La photo est trop sombre ou trop serrée pour distinguer la lettre du fond.'
        );
        return;
      }

      const ref = modele(lettre.isole, NOTATION);
      const boiteRef: Boite = boiteEnglobante(ref)!;
      const ajustee = recadrerVers(propre, ref, boiteRef);

      // La pénalité de proportions ne s'applique qu'ici : en mode tracé, l'apprenant
      // dessine dans le repère du modèle, les proportions sont donc déjà jugées par la
      // superposition. Après recadrage, elles ne le sont plus.
      const brute = comparer(ajustee, ref, TOLERANCE);
      const facteur = facteurProportions(propre, ref);
      setNote({ ...brute, score: Math.round(brute.score * facteur) });

      const refPetite = modele(lettre.isole, IDENTIFICATION);
      const devinee = identifier(recadrerVers(propre, refPetite, boiteEnglobante(refPetite)!));
      setConfusion(devinee && devinee.nom !== lettre.nom ? devinee : null);
    } catch {
      setPhotoErreur("L'image n'a pas pu être lue. Essayez une autre photo.");
    } finally {
      setAnalyse(false);
    }
  }

  function ecouter() {
    new Audio(lettre.audio).play().catch(() => {});
  }

  return (
    <div className="mt-8">
      {/* ------------------------------------------------------------ Choix de la lettre */}
      <div>
        <p className="eyebrow">Lettre à tracer</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {ALPHABET.map((l) => (
            <li key={l.nom}>
              <button
                type="button"
                onClick={() => {
                  setLettre(l);
                  effacer();
                }}
                aria-pressed={l.nom === lettre.nom}
                aria-label={`${l.nom}, ${l.isole}`}
                className={`tracer-puce arabic ${l.nom === lettre.nom ? 'tracer-puce-active' : ''}`}
              >
                {l.isole}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_16rem]">
        {/* -------------------------------------------------------------------- Ardoise */}
        <div>
          <canvas
            ref={canvasRef}
            onPointerDown={commencerTrait}
            onPointerMove={continuerTrait}
            onPointerUp={finirTrait}
            onPointerCancel={finirTrait}
            onPointerLeave={finirTrait}
            aria-label={`Zone de tracé pour la lettre ${lettre.nom}`}
            className="tracer-ardoise"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={corriger} disabled={!traits.length} className="btn-sand disabled:opacity-40">
              Corriger mon tracé
            </button>
            <button type="button" onClick={effacer} className="btn-outline">
              Effacer
            </button>
            <button
              type="button"
              onClick={() => setGuide((g) => !g)}
              aria-pressed={!guide}
              className="btn-ghost"
            >
              {guide ? 'Masquer le modèle' : 'Afficher le modèle'}
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- Panneau */}
        <aside>
          <div className="card-sand p-4">
            <p className="eyebrow">La lettre</p>
            <p className="arabic mt-1 text-5xl leading-none">{lettre.isole}</p>
            <p className="display mt-2 text-lg">{lettre.nom}</p>
            <p className="text-sm text-[var(--muted)]">
              Arabizi : {lettre.arabizi} · {lettre.traits} trait
              {lettre.traits > 1 ? 's' : ''}
            </p>
            <button type="button" onClick={ecouter} className="btn-outline mt-3 w-full">
              ▶ Écouter
            </button>
          </div>

          {note && (
            <div className="card-sand pop mt-4 p-4">
              <p className="eyebrow">Résultat</p>
              <p className="display mt-1 text-4xl leading-none tabular">{note.score} %</p>
              <p className="mt-2 text-sm leading-relaxed">
                {commenter(note, lettre.traits, traits.length)}
              </p>
              {confusion && (
                <p className="mt-2 text-sm text-[var(--carmine-text)]">
                  Ce tracé ressemble davantage à{' '}
                  <span className="arabic">{confusion.isole}</span> ({confusion.nom}).
                </p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                <div>
                  <dt>Sur le modèle</dt>
                  <dd className="tabular text-[var(--ink)]">{note.precision} %</dd>
                </div>
                <div>
                  <dt>Modèle couvert</dt>
                  <dd className="tabular text-[var(--ink)]">{note.rappel} %</dd>
                </div>
              </dl>
            </div>
          )}

          {/* ----------------------------------------------------------------- Par photo */}
          <div className="card-sand mt-4 p-4">
            <p className="eyebrow">Ou sur papier</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Écrivez la lettre en grand, à l&apos;encre foncée sur papier clair, puis
              photographiez-la seule et bien à plat.
            </p>
            <label className="btn-outline mt-3 w-full cursor-pointer">
              {analyse ? 'Analyse…' : 'Analyser une photo'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) analyserPhoto(f);
                  e.target.value = '';
                }}
              />
            </label>
            {photoErreur && (
              <p role="alert" className="mt-2 text-sm text-[var(--carmine-text)]">
                {photoErreur}
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--muted)]">
              La photo est analysée dans votre navigateur et n&apos;est envoyée nulle part.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
