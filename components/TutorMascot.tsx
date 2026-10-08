import Link from 'next/link';

/**
 * Ostaz, le tuteur IA, en personnage : un chat du Caire à lunettes. Il attend en bas à
 * droite de la page d'accueil avec une bulle, et mène à `/tuteur` au clic.
 *
 * Un chat plutôt qu'un personnage humain : les chats des rues font partie du Caire et le
 * chat est l'animal emblème de l'Égypte ancienne (Bastet). Le précédent dessin, un homme
 * en tarbouche, évoquait davantage la Turquie que l'Égypte d'aujourd'hui.
 *
 * Collant (`sticky`) et non fixe : placé à la fin du <main>, il suit le défilement de
 * l'accueil puis s'arrête au-dessus du pied de page, au lieu de recouvrir ses liens
 * (WCAG 2.4.11 : un élément flottant ne doit pas masquer ce qui a le focus).
 *
 * Le dessin est décoratif (`aria-hidden`) : le nom du lien est le texte de la bulle, lu
 * tel qu'affiché (WCAG 2.5.3), complété d'un « tuteur IA » pour les lecteurs d'écran.
 */
export default function TutorMascot() {
  return (
    <div className="tutor-mascot-dock">
      <Link href="/tuteur" className="tutor-mascot">
        <span className="tutor-mascot-bubble">
          <span lang="ar-EG" dir="rtl" className="tutor-mascot-hello">
            أهلاً!
          </span>
          <span className="block">
            {/* Raccourcie sur téléphone : la bulle entière masquait les boutons de l'accueil. */}
            <span className="hidden sm:inline">Une question sur l’arabe ? </span>
            <strong>Demande à Ostaz</strong>
            <span className="sr-only"> (tuteur IA)</span>
          </span>
        </span>

        <svg
          className="tutor-mascot-face"
          viewBox="0 0 100 112"
          aria-hidden="true"
          focusable="false"
        >
          {/* Oreilles */}
          <path
            d="M19 52 L24 12 L48 34 Z"
            fill="#e2b877"
            stroke="#1f1d45"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M81 52 L76 12 L52 34 Z"
            fill="#e2b877"
            stroke="#1f1d45"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M26 41 L28 22 L40 33 Z" fill="#e8806b" opacity="0.8" />
          <path d="M74 41 L72 22 L60 33 Z" fill="#e8806b" opacity="0.8" />

          {/* Tête */}
          <ellipse cx="50" cy="68" rx="36" ry="32" fill="#e2b877" stroke="#1f1d45" strokeWidth="3.5" />

          {/* Rayures du front, le « M » des chats tigrés */}
          <path
            d="M41 40 L44 49 M50 38 L50 48 M59 40 L56 49"
            stroke="#a8743c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Taches de chat égyptien (mau) */}
          <circle cx="22" cy="70" r="2.4" fill="#a8743c" />
          <circle cx="26" cy="61" r="2" fill="#a8743c" />
          <circle cx="78" cy="70" r="2.4" fill="#a8743c" />
          <circle cx="74" cy="61" r="2" fill="#a8743c" />

          {/* Museau clair */}
          <ellipse cx="50" cy="85" rx="15" ry="10" fill="#fbf4e6" />

          {/* Lunettes de professeur */}
          <circle cx="37" cy="64" r="11" fill="#fbf4e6" fillOpacity="0.35" stroke="#1f1d45" strokeWidth="3" />
          <circle cx="63" cy="64" r="11" fill="#fbf4e6" fillOpacity="0.35" stroke="#1f1d45" strokeWidth="3" />
          <path d="M48 63 Q50 60.5 52 63" fill="none" stroke="#1f1d45" strokeWidth="3" />

          {/* Yeux : un œil de chat ouvert, l'autre en clin d'œil */}
          <ellipse cx="37" cy="64.5" rx="5" ry="5.5" fill="#4fd1c5" />
          <ellipse className="tutor-mascot-eye" cx="37" cy="64.5" rx="1.6" ry="4.4" fill="#1f1d45" />
          <path d="M58 66 Q63 61.5 68 66" fill="none" stroke="#1f1d45" strokeWidth="2.6" strokeLinecap="round" />

          {/* Truffe, bouche et moustaches */}
          <path d="M46 80 L54 80 L50 85 Z" fill="#e8806b" stroke="#1f1d45" strokeWidth="1.5" strokeLinejoin="round" />
          <path
            d="M50 85 Q50 90 45 90 M50 85 Q50 90 55 90"
            fill="none"
            stroke="#1f1d45"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M33 82 L14 79 M33 87 L15 90 M67 82 L86 79 M67 87 L85 90"
            stroke="#1f1d45"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Joues */}
          <circle cx="28" cy="79" r="4.5" fill="#e8806b" opacity="0.45" />
          <circle cx="72" cy="79" r="4.5" fill="#e8806b" opacity="0.45" />
        </svg>
      </Link>
    </div>
  );
}
