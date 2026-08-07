/**
 * Icônes du chemin : une dune par leçon, une pyramide par quiz.
 *
 * Les couleurs viennent de classes CSS posées sur le nœud parent plutôt que de dégradés
 * SVG : un `<linearGradient id="…">` dupliqué sur 19 nœuds produirait 19 identifiants
 * identiques dans le document, ce qui est invalide et rend le rendu imprévisible.
 */

export function DuneIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
      <circle className="dune-sky" cx="32" cy="32" r="30" />
      <circle className="dune-sun" cx="43" cy="21" r="5.5" />
      {/* Dune lointaine, puis dune de premier plan : c'est le décalage entre les deux
          crêtes qui donne la profondeur, plus que le dégradé. */}
      <path
        className="dune-far"
        d="M3 41 C 13 30 22 35 31 39 C 40 43 50 34 61 41 L 61 56 L 3 56 Z"
      />
      <path
        className="dune-near"
        d="M2 49 C 12 41 21 47 32 49 C 43 51 52 45 62 49 L 62 58 L 2 58 Z"
      />
    </svg>
  );
}

export function PyramidIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
      <circle className="pyr-sky" cx="32" cy="32" r="30" />
      <circle className="pyr-sun" cx="46" cy="19" r="5" />
      {/* Face à l'ombre puis face éclairée : deux triangles au lieu d'un seul, pour que
          la pyramide se lise en volume à 40 px de côté. */}
      <path className="pyr-shadow" d="M32 14 L53 47 L32 47 Z" />
      <path className="pyr-light" d="M32 14 L32 47 L11 47 Z" />
      <path className="pyr-ground" d="M4 47 L60 47 L60 55 L4 55 Z" />
    </svg>
  );
}
