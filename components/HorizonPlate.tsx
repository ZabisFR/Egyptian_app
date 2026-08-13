/**
 * La planche gravée.
 *
 * Idée directrice du site : une planche de la *Description de l'Égypte* — le format
 * français, encadré d'un double filet et légendé en petites capitales — mais peinte aux
 * pigments égyptiens au lieu d'être gravée en noir et blanc. C'est le croisement des deux
 * cultures rendu littéral, plutôt que deux décors juxtaposés.
 *
 * Aucune image : tout est en SVG, donc net à toutes les résolutions, thémable par
 * variables CSS, et sans une seule requête réseau supplémentaire.
 */
export default function HorizonPlate() {
  return (
    <figure className="hz-plate">
      <div className="hz-frame">
        <svg
          viewBox="0 0 800 240"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Le soleil descend sur les dunes et les pyramides de Gizeh ; une caravane passe sur la crête."
          className="block h-44 w-full sm:h-56"
        >
          <defs>
            {/*
              Un seul dégradé pour tout le site : cette planche n'apparaît qu'une fois par
              page, donc l'identifiant ne peut pas entrer en collision — contrairement aux
              icônes du chemin de dunes, répétées 19 fois, qui n'ont volontairement pas
              de <defs>.
            */}
            <linearGradient id="hz-sky-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hz-sky-top)" />
              <stop offset="100%" stopColor="var(--hz-sky-bottom)" />
            </linearGradient>
          </defs>

          <rect width="800" height="240" fill="url(#hz-sky-gradient)" />

          {/* Halo puis disque : le halo seul donne un soleil mou, le disque seul un soleil
              découpé au ciseau. Les deux ensemble donnent la chaleur de fin de journée. */}
          <circle cx="596" cy="96" r="62" className="hz-glow" />
          <circle cx="596" cy="96" r="30" className="hz-sun" />

          {/* Oiseaux : trois traits qui traversent la planche en une demi-minute. C'est le
              seul élément qui parcourt l'image — assez pour qu'elle soit vivante, assez
              lent pour ne jamais tirer l'œil pendant la lecture du titre. */}
          <g className="hz-birds">
            <path d="M120 62 l9 -7 l9 7" className="hz-bird" />
            <path d="M168 46 l7 -6 l7 6" className="hz-bird" />
            <path d="M148 84 l6 -5 l6 5" className="hz-bird" />
          </g>

          {/* Pyramides de Gizeh : Khéops, Khéphren, Mykérinos — deux grandes et une petite,
              décalées, jamais alignées comme sur un logo d'agence de voyage. */}
          <g className="hz-mono">
            <path d="M232 158 L286 78 L340 158 Z" />
            <path d="M330 158 L372 96 L414 158 Z" />
            <path d="M408 158 L434 120 L460 158 Z" />
          </g>

          <path
            className="hz-far"
            d="M0 150 C 90 128 150 158 240 152 C 340 145 420 168 520 150 C 620 132 700 160 800 146 L800 240 L0 240 Z"
          />
          <path
            className="hz-mid"
            d="M0 182 C 110 160 190 196 300 186 C 410 176 500 200 610 184 C 700 171 750 192 800 184 L800 240 L0 240 Z"
          />
          <path
            className="hz-near"
            d="M-40 216 C 80 194 180 226 300 218 C 430 209 520 232 640 216 C 740 203 800 220 840 214 L840 260 L-40 260 Z"
          />

          {/* Caravane : deux silhouettes minuscules sur la crête. Elles donnent l'échelle —
              sans elles, la dune pourrait aussi bien faire trois mètres de haut. */}
          <g className="hz-mono hz-caravan">
            <path d="M96 220 l5 -7 l3 4 l4 -6 l4 9 Z" />
            <path d="M118 218 l4 -6 l3 3 l3 -5 l4 8 Z" />
          </g>
        </svg>
      </div>

      <figcaption className="eyebrow mt-3 text-center">
        Rive ouest du Caire — le désert commence où la ville s&apos;arrête
      </figcaption>
    </figure>
  );
}
