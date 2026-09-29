import Link from 'next/link';
import type { Metadata } from 'next';
import { Reem_Kufi } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import type { Level, Module } from '@/lib/types';
import StyleSwitcher from './StyleSwitcher';
import './conte.css';

/**
 * Maquette de la refonte « Conte oriental » — accueil + cartes de module.
 *
 * Page d'essai, pas une page du site : exclue de l'indexation, absente du sitemap et de
 * la navigation. Tous ses styles vivent dans `conte.css`, sous la classe `.conte` : rien
 * ne déborde sur le reste de l'app tant que la direction n'est pas validée.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Conte oriental',
  robots: { index: false, follow: false },
};

// Coufique arrondi, pour l'arabe décoratif (médaillons, lettres des sons). Le texte arabe
// courant des leçons garde sa police : celle-ci est une enseigne, pas un corps de texte.
const kufi = Reem_Kufi({ subsets: ['arabic'], weight: ['500'], variable: '--font-kufi' });

type ModuleRow = Module & { lessons: { count: number }[] };

const LEVEL_NAME: Record<Level, string> = {
  A1: 'Débutant',
  A2: 'Élémentaire',
  B1: 'Intermédiaire',
  B2: 'Avancé',
  REF: 'Référence',
};

/** États de progression FICTIFS, pour montrer les trois cas sur la maquette. */
const DEMO_STATE = ['done', 'progress', 'new', 'new', 'new', 'new'] as const;

const LEVELS = [
  { level: 'A1', title: 'Les fondations', text: 'Lire l’alphabet, saluer, compter, commander un café.' },
  { level: 'A2', title: 'La vie courante', text: 'Raconter sa journée, marchander au souk.' },
  { level: 'B1', title: 'L’aisance', text: 'Suivre une conversation entre amis, saisir l’humour.' },
  { level: 'B2', title: 'Le débat', text: 'Nuancer, argumenter, suivre une série sans sous-titres.' },
];

export default async function MaquettePage() {
  const supabase = await createClient();
  const [{ data: modules }, { count: lessonCount }, { count: vocabCount }] = await Promise.all([
    supabase
      .from('modules')
      .select('*, lessons(count)')
      .order('order_index')
      .returns<ModuleRow[]>(),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('vocab_items').select('*', { count: 'exact', head: true }),
  ]);

  const all = modules ?? [];
  const sample = all.filter((m) => m.level !== 'REF').slice(0, 6);

  return (
    <div className={`conte maquette ${kufi.variable}`}>
      <StyleSwitcher current="/maquette" />
      <div className="conte-sky" aria-hidden="true" />

      {/* ------------------------------------------------------------- En-tête */}
      <header className="conte-header">
        <div className="conte-wrap conte-header-row">
          <Link href="/maquette" className="conte-brand">
            <StarMedallion size={40}>
              <span className="conte-kufi">ع</span>
            </StarMedallion>
            <span className="conte-brand-name">Arabe égyptien</span>
          </Link>

          <nav aria-label="Navigation principale (maquette)">
            <ul className="conte-nav">
              <li>
                <Link href="/modules">Modules</Link>
              </li>
              <li>
                <Link href="/entrainement">S’entraîner</Link>
              </li>
              <li>
                <Link href="/glossaire">Glossaire</Link>
              </li>
            </ul>
          </nav>

          <div className="conte-header-actions">
            <ThemeToggle />
            <Link href="/auth/login" className="conte-btn conte-btn-ghost conte-btn-sm">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main id="maquette" className="conte-wrap">
        {/* ---------------------------------------------------------- Ouverture */}
        <section className="conte-hero" aria-labelledby="titre">
          <div className="conte-hero-text">
            <p className="conte-eyebrow">
              <span aria-hidden="true">✦</span> Dialecte cairote <span aria-hidden="true">✦</span>
            </p>
            <h1 id="titre" className="conte-title">
              Parler l’arabe <span className="conte-title-accent">du Caire</span>, pas celui
              des manuels.
            </h1>
            <p className="conte-lead">
              {all.length} modules, {lessonCount} leçons et {vocabCount} mots, de l’alphabet
              jusqu’au débat. Poussez la première porte : le reste du chemin s’éclaire au fil
              des leçons.
            </p>
            <div className="conte-actions">
              <Link href="/modules" className="conte-btn conte-btn-gold">
                Commencer l’aventure
              </Link>
              <Link href="/placement-test" className="conte-btn conte-btn-ghost">
                Tester mon niveau
              </Link>
            </div>
          </div>

          <div className="conte-hero-art">
            <ArchWindow />
          </div>
        </section>

        {/* ------------------------------------------------------- Chiffres clés */}
        <ul className="conte-stats" aria-label="Le parcours en chiffres">
          <Stat value={all.length} label="modules" icon={<path d="M5 21V11a7 7 0 0 1 14 0v10M5 21h14M9 21v-6a3 3 0 0 1 6 0v6" />} />
          <Stat value={lessonCount ?? 0} label="leçons" icon={<path d="M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4" />} />
          <Stat value={vocabCount ?? 0} label="mots" icon={<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />} />
        </ul>

        <Ornament />

        {/* ------------------------------------------------------------ Modules */}
        <section className="conte-section" aria-labelledby="portes">
          <header className="conte-section-head">
            <p className="conte-eyebrow">Le programme</p>
            <h2 id="portes" className="conte-h2">
              Chaque module est une porte
            </h2>
            <p className="conte-section-lead">
              Les états « terminé » et « en cours » ci-dessous sont fictifs, pour montrer les
              trois cas sur la maquette.
            </p>
          </header>

          <ul className="conte-cards">
            {sample.map((m, i) => (
              <li key={m.id}>
                <ArchCard module={m} lessons={m.lessons[0]?.count ?? 0} state={DEMO_STATE[i]} />
              </li>
            ))}
          </ul>
        </section>

        <Ornament />

        {/* ------------------------------------------------------------- Chemin */}
        <section className="conte-section" aria-labelledby="chemin">
          <header className="conte-section-head">
            <p className="conte-eyebrow">Le chemin</p>
            <h2 id="chemin" className="conte-h2">
              D’un alphabet inconnu à une conversation
            </h2>
          </header>

          <ol className="conte-path">
            {LEVELS.map((step, i) => (
              <li key={step.level} className="conte-path-step" style={{ '--i': i } as React.CSSProperties}>
                <StarMedallion size={64} tone={i}>
                  <span className="conte-path-level">{step.level}</span>
                </StarMedallion>
                <div>
                  <h3 className="conte-h3">{step.title}</h3>
                  <p className="conte-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------ Reprise */}
        <section className="conte-cta" aria-labelledby="yalla">
          <Lantern className="conte-cta-lantern" />
          <h2 id="yalla" className="conte-h2">
            Yalla, on commence ?
          </h2>
          <p className="conte-muted conte-cta-text">
            Tout le contenu est ouvert sans compte. Créez-en un seulement quand vous voudrez
            garder votre progression.
          </p>
          <div className="conte-actions conte-actions-center">
            <Link href="/modules/module-01" className="conte-btn conte-btn-gold">
              Ouvrir la première leçon
            </Link>
            <Link href="/entrainement" className="conte-btn conte-btn-ghost">
              S’entraîner
            </Link>
          </div>
        </section>
      </main>

      <footer className="conte-footer">
        <div className="conte-wrap">
          <Ornament />
          <p className="conte-muted">Maquette « Conte oriental » — page non indexée.</p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pièces
// ---------------------------------------------------------------------------

/** L'étoile à huit branches (khatam) : deux carrés croisés. Le contenu se pose au centre. */
function StarMedallion({
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

function Stat({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <li className="conte-stat">
      <span className="conte-stat-glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24">{icon}</svg>
      </span>
      <span className="conte-stat-value">{value}</span>
      <span className="conte-stat-label">{label}</span>
    </li>
  );
}

function ArchCard({
  module,
  lessons,
  state,
}: {
  module: Module;
  lessons: number;
  state: 'done' | 'progress' | 'new';
}) {
  const read = state === 'done' ? lessons : state === 'progress' ? Math.ceil(lessons / 3) : 0;
  const pct = lessons ? Math.round((read / lessons) * 100) : 0;

  return (
    <Link href={`/modules/${module.id}`} className="conte-card" data-level={module.level}>
      <span className="conte-card-top">
        <StarMedallion size={56} tone={['A1', 'A2', 'B1', 'B2'].indexOf(module.level)}>
          <span className="conte-card-number">{module.number}</span>
        </StarMedallion>
      </span>

      <span className="conte-card-level">
        {module.level} · {LEVEL_NAME[module.level]}
      </span>
      <span className="conte-card-title">{module.title}</span>
      {module.subtitle && <span className="conte-card-sub">{module.subtitle}</span>}

      <span className="conte-card-foot">
        {state === 'new' && <span className="conte-muted">{lessons} leçons</span>}
        {state !== 'new' && (
          <>
            <span
              className="conte-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={lessons}
              aria-valuenow={read}
              aria-label={`${read} leçons lues sur ${lessons}`}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="conte-muted conte-tabular">
              {read}/{lessons}
            </span>
          </>
        )}
        {state === 'done' && (
          <span className="conte-chip conte-chip-done">
            <span aria-hidden="true">✦ </span>Terminé
          </span>
        )}
        {state === 'progress' && <span className="conte-chip">En cours</span>}
      </span>
    </Link>
  );
}

function Ornament() {
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

function Lantern({
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
function ArchWindow() {
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
