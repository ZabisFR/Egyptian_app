import Link from 'next/link';
import type { Metadata } from 'next';
import { Fredoka } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import StyleSwitcher from '../StyleSwitcher';
import { DEMO_STATE, LEVELS, LEVEL_NAME, demoProgress, loadMockData, type DemoState } from '../data';
import type { Module } from '@/lib/types';
import './aventure.css';

/**
 * Maquette « Jeu d'aventure » : le parcours comme une carte au trésor à travers l'Égypte.
 * Boutons en relief, étapes rondes sur un chemin en zigzag, repère « Tu es ici ».
 * Styles isolés sous `.aventure` (voir aventure.css).
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Jeu d’aventure',
  robots: { index: false, follow: false },
};

// Arrondie et franche : la police des jeux éducatifs, lisible dès les petites tailles.
const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-fredoka' });

const REGIONS = ['Les rives du Nil', 'Le grand souk', 'Le café d’El-Fishawy', 'La place Tahrir'];

export default async function AventurePage() {
  const { moduleCount, lessonCount, vocabCount, sample } = await loadMockData();

  return (
    <div className={`aventure maquette ${fredoka.variable}`}>
      <StyleSwitcher current="/maquette/aventure" />

      <header className="av-header">
        <div className="av-wrap av-header-row">
          <Link href="/maquette/aventure" className="av-brand">
            <span className="av-brand-mark" aria-hidden="true">
              ع
            </span>
            <span className="av-brand-name">3arabi</span>
          </Link>

          <nav aria-label="Navigation principale (maquette)">
            <ul className="av-nav">
              <li>
                <Link href="/modules">Parcours</Link>
              </li>
              <li>
                <Link href="/entrainement">Entraînement</Link>
              </li>
              <li>
                <Link href="/glossaire">Glossaire</Link>
              </li>
            </ul>
          </nav>

          <div className="av-header-actions">
            <span className="av-streak" title="Série de jours (exemple)">
              <Flame />
              <span>
                3<span className="av-sr"> jours de suite (exemple)</span>
              </span>
            </span>
            <ThemeToggle />
            <Link href="/auth/login" className="av-btn av-btn-light av-btn-sm">
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main className="av-wrap">
        {/* ---------------------------------------------------------- Ouverture */}
        <section className="av-hero" aria-labelledby="titre">
          <div>
            <p className="av-kicker">Quête principale · Dialecte cairote</p>
            <h1 id="titre" className="av-title">
              Ton voyage au Caire commence ici.
            </h1>
            <p className="av-lead">
              {moduleCount} étapes, {lessonCount} leçons et {vocabCount} mots à collecter.
              Chaque leçon lue fait avancer ton pion sur la carte — jusqu’à la conversation.
            </p>
            <div className="av-actions">
              <Link href="/modules" className="av-btn av-btn-go">
                C’est parti !
              </Link>
              <Link href="/placement-test" className="av-btn av-btn-light">
                Où j’en suis ?
              </Link>
            </div>

            <div className="av-xp" aria-label="Progression d’exemple">
              <div className="av-xp-row">
                <span className="av-xp-level">Niv. 3</span>
                <span className="av-muted">240 / 400 XP · exemple</span>
              </div>
              <span className="av-bar">
                <span style={{ width: '60%' }} />
              </span>
            </div>
          </div>

          <TreasureMap />
        </section>

        {/* ------------------------------------------------------- Chiffres clés */}
        <ul className="av-badges" aria-label="Le parcours en chiffres">
          <Badge value={moduleCount} label="étapes" tone="blue" />
          <Badge value={lessonCount} label="leçons" tone="green" />
          <Badge value={vocabCount} label="mots à collecter" tone="orange" />
        </ul>

        {/* ------------------------------------------------------------ Parcours */}
        <section className="av-section" aria-labelledby="carte">
          <h2 id="carte" className="av-h2">
            La carte du parcours
          </h2>
          <p className="av-muted av-section-lead">
            États « terminé » et « en cours » fictifs, pour montrer les trois cas.
          </p>

          <ol className="av-trail">
            {sample.map((m, i) => (
              <Step key={m.id} module={m} lessons={m.lessons[0]?.count ?? 0} state={DEMO_STATE[i]} index={i} />
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------- Régions */}
        <section className="av-section" aria-labelledby="regions">
          <h2 id="regions" className="av-h2">
            Quatre régions à explorer
          </h2>
          <ul className="av-regions">
            {LEVELS.map((step, i) => (
              <li key={step.level} className="av-region" data-tone={i}>
                <span className="av-region-top">
                  <span className="av-region-level">{step.level}</span>
                  <span>{REGIONS[i]}</span>
                </span>
                <span className="av-region-body">
                  <strong>{step.title}</strong>
                  <span className="av-muted">{step.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------------ Reprise */}
        <section className="av-cta" aria-labelledby="yalla">
          <Chest />
          <div>
            <h2 id="yalla" className="av-h2">
              Yalla, le premier trésor t’attend
            </h2>
            <p className="av-muted">
              Tout est ouvert sans compte. Crée-en un quand tu voudras garder ta progression.
            </p>
          </div>
          <div className="av-actions">
            <Link href="/modules/module-01" className="av-btn av-btn-go">
              Première leçon
            </Link>
            <Link href="/entrainement" className="av-btn av-btn-light">
              S’entraîner
            </Link>
          </div>
        </section>
      </main>

      <footer className="av-footer av-wrap">
        <p className="av-muted">Maquette « Jeu d’aventure » — page non indexée.</p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Step({
  module,
  lessons,
  state,
  index,
}: {
  module: Module;
  lessons: number;
  state: DemoState;
  index: number;
}) {
  const { read } = demoProgress(state, lessons);
  // Le zigzag : quatre positions qui se répètent, comme le serpentin des jeux éducatifs.
  const offset = [0, 1, 0, -1][index % 4];
  const status = state === 'done' ? 'terminée' : state === 'progress' ? 'en cours' : 'à découvrir';

  return (
    <li className="av-step" data-state={state} style={{ '--offset': offset } as React.CSSProperties}>
      {state === 'progress' && (
        <span className="av-here" aria-hidden="true">
          Tu es ici
        </span>
      )}
      <Link
        href={`/modules/${module.id}`}
        className="av-node"
        aria-label={`Étape ${module.number} : ${module.title}, ${status}`}
      >
        {state === 'done' ? <Check /> : <span className="av-node-num">{module.number}</span>}
      </Link>
      <span className="av-step-card">
        <span className="av-step-level">
          {module.level} · {LEVEL_NAME[module.level]}
        </span>
        <span className="av-step-title">{module.title}</span>
        <span className="av-muted av-step-meta">
          {state === 'new' ? `${lessons} leçons` : `${read}/${lessons} leçons`}
        </span>
      </span>
    </li>
  );
}

function Badge({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <li className="av-badge" data-tone={tone}>
      <svg viewBox="0 0 64 72" aria-hidden="true" className="av-badge-shield">
        <path d="M32 2 60 12v24c0 18-12 28-28 34C16 64 4 54 4 36V12Z" />
      </svg>
      <span className="av-badge-value">{value}</span>
      <span className="av-badge-label">{label}</span>
    </li>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="av-flame">
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9Z" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="av-check">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Chest() {
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className="av-chest">
      <path d="M8 34h80v38a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" className="av-chest-wood" />
      <path d="M8 34c0-16 12-26 40-26s40 10 40 26Z" className="av-chest-lid" />
      <path d="M8 34h80v8H8z" className="av-chest-band" />
      <rect x="40" y="36" width="16" height="18" rx="3" className="av-chest-lock" />
      <circle cx="48" cy="45" r="3" className="av-chest-hole" />
      <g className="av-sparkles">
        <path d="M20 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        <path d="M78 2l1.5 4 4 1.5-4 1.5L78 13l-1.5-4-4-1.5 4-1.5Z" />
      </g>
    </svg>
  );
}

/** La carte : le Nil, les pyramides, des palmiers et la route pointillée vers le Caire. */
function TreasureMap() {
  return (
    <svg viewBox="0 0 360 320" className="av-map" role="img" aria-label="Carte au trésor : une route pointillée longe le Nil jusqu’au Caire">
      <rect x="6" y="6" width="348" height="308" rx="28" className="av-map-paper" />
      <rect x="18" y="18" width="324" height="284" rx="20" className="av-map-inner" />
      <path d="M250 18c-20 40 30 70 0 110s-60 40-40 90 10 70 0 84" className="av-map-nile" />
      <g className="av-map-pyramids">
        <path d="M60 240l34-54 34 54Z" />
        <path d="M104 240l24-38 24 38Z" />
      </g>
      <g className="av-map-palms">
        <path d="M190 100v26M190 100c-8-4-14-2-18 2M190 100c8-4 14-2 18 2M190 100c-4-8-10-10-16-8M190 100c4-8 10-10 16-8" />
        <path d="M290 250v24M290 250c-8-4-14-2-18 2M290 250c8-4 14-2 18 2M290 250c-4-8-10-10-16-8M290 250c4-8 10-10 16-8" />
      </g>
      <path d="M70 280C110 270 130 220 170 210s80 20 90-30-40-80 20-120" className="av-map-route" />
      <g className="av-map-pins">
        <circle cx="70" cy="280" r="9" data-tone="0" />
        <circle cx="170" cy="210" r="9" data-tone="1" />
        <circle cx="258" cy="176" r="9" data-tone="2" />
      </g>
      <g className="av-map-flag">
        <path d="M282 60V20" />
        <path d="M282 22h26l-8 8 8 8h-26Z" />
      </g>
      <g className="av-map-compass" transform="translate(300 262)">
        <circle r="22" />
        <path d="M0-18 5 0 0 18-5 0Z" />
        <text y="-26" textAnchor="middle">N</text>
      </g>
      <text x="58" y="162" className="av-map-label">
        Gizeh
      </text>
      <text x="262" y="96" className="av-map-label">
        Le Caire
      </text>
    </svg>
  );
}
