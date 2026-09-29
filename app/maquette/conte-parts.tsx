/**
 * Pièces graphiques de la direction « Conte oriental », partagées entre la maquette
 * d'origine (/maquette) et le mix (/maquette/mix). Styles dans conte.css.
 */

/** L'étoile à huit branches (khatam) : deux carrés croisés. Le contenu se pose au centre. */
export function StarMedallion({
  size,
  tone = 0,
  children,
}: {
  size: number;
  tone?: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="conte-medallion"
      data-tone={tone % 4}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="18" y="18" width="64" height="64" rx="8" />
        <rect x="18" y="18" width="64" height="64" rx="8" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="30" className="conte-medallion-core" />
      </svg>
      <span className="conte-medallion-content">{children}</span>
    </span>
  );
}

export function Ornament() {
  return (
    <div className="conte-ornament" aria-hidden="true">
      <span />
      <svg viewBox="0 0 100 100">
        <rect x="22" y="22" width="56" height="56" rx="6" />
        <rect x="22" y="22" width="56" height="56" rx="6" transform="rotate(45 50 50)" />
      </svg>
      <span />
    </div>
  );
}

export function Lantern({
  className,
  style,
  ...box
}: {
  className?: string;
  style?: React.CSSProperties;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  return (
    <svg viewBox="0 0 60 120" className={className} style={style} aria-hidden="true" {...box}>
      <line x1="30" y1="0" x2="30" y2="22" className="conte-lantern-chain" />
      <circle cx="30" cy="72" r="34" className="conte-lantern-glow" />
      <path d="M22 22h16l4 10H18z" className="conte-lantern-metal" />
      <path d="M18 32h24l8 30-8 30H18l-8-30z" className="conte-lantern-glass" />
      <path d="M18 32l12 30-12 30M42 32 30 62l12 30M10 62h40" className="conte-lantern-lines" />
      <path d="M18 92h24l-4 10H22z" className="conte-lantern-metal" />
      <circle cx="30" cy="108" r="3" className="conte-lantern-metal" />
    </svg>
  );
}

/**
 * La fenêtre en arche : le Caire la nuit, croissant, étoiles, minarets et deux lanternes.
 * Entièrement en SVG, couleurs par variables CSS : elle suit le thème sans image à charger.
 */
export function ArchWindow() {
  const stars = [
    [70, 70, 1.6, 0], [120, 48, 1.2, 1], [210, 64, 1.8, 2], [250, 104, 1.1, 3],
    [96, 128, 1.3, 4], [182, 118, 1.5, 5], [236, 160, 1.2, 1], [60, 176, 1, 3],
    [150, 90, 1, 2], [276, 70, 1.3, 4],
  ];

  return (
    <svg viewBox="0 0 320 420" className="conte-window" role="img" aria-label="Le Caire la nuit, vu à travers une fenêtre en arche">
      <defs>
        <clipPath id="arch">
          <path d="M20 420V170a140 140 0 0 1 280 0v250Z" />
        </clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="conte-sky-top" />
          <stop offset="1" className="conte-sky-bottom" />
        </linearGradient>
        <mask id="crescent">
          <circle cx="226" cy="120" r="26" fill="#fff" />
          <circle cx="238" cy="112" r="23" fill="#000" />
        </mask>
      </defs>

      <g clipPath="url(#arch)">
        <rect width="320" height="420" fill="url(#sky)" />
        {stars.map(([x, y, r, d], i) => (
          <circle key={i} cx={x} cy={y} r={r} className="conte-star" style={{ '--d': d } as React.CSSProperties} />
        ))}
        <rect x="190" y="84" width="72" height="72" mask="url(#crescent)" className="conte-moon" />

        {/* Silhouette : coupoles et minarets. */}
        <path
          className="conte-skyline-far"
          d="M20 350h30v-30h10v-40l5-12 5 12v40h10v30h40a36 36 0 0 1 72 0h20v-60l6-14 6 14v60h22a22 22 0 0 1 44 0h20v70H20Z"
        />
        <path
          className="conte-skyline-near"
          d="M20 380h40a28 28 0 0 1 56 0h24v-70l7-16 7 16v70h36a44 44 0 0 1 88 0h42v40H20Z"
        />
        <g className="conte-windows-lit">
          <rect x="82" y="366" width="6" height="9" rx="3" />
          <rect x="222" y="358" width="6" height="9" rx="3" />
          <rect x="240" y="370" width="6" height="9" rx="3" />
        </g>
      </g>

      {/* Cadre de l'arche : double filet doré. */}
      <path d="M20 420V170a140 140 0 0 1 280 0v250" className="conte-frame" />
      <path d="M34 420V172a126 126 0 0 1 252 0v248" className="conte-frame-inner" />

      {/* Accrochées sous l'intrados de l'arche, de part et d'autre. */}
      <Lantern className="conte-sway" x={62} y={96} width={36} height={72} style={{ '--d': 0 } as React.CSSProperties} />
      <Lantern className="conte-sway" x={222} y={96} width={36} height={72} style={{ '--d': 1 } as React.CSSProperties} />
    </svg>
  );
}
