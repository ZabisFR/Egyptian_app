import Link from 'next/link';
import type { Metadata } from 'next';
import ThemeToggle from '@/components/ThemeToggle';
import StyleSwitcher from '../StyleSwitcher';
import { DEMO_STATE, LEVELS, LEVEL_NAME, demoProgress, loadMockData, type DemoState } from '../data';
import type { Module } from '@/lib/types';
import './papyrus.css';

/**
 * Maquette « Papyrus enchanté » : l'univers actuel du site (papyrus, dunes, or, lapis,
 * Garamond) rendu magique — soleil rayonnant, poussière d'or, cartouches, lotus.
 * Réutilise les jetons de couleur de globals.css, déjà mesurés dans les deux thèmes.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Papyrus enchanté',
  robots: { index: false, follow: false },
};

/** Positions de la poussière d'or : [gauche %, délai, durée, taille]. Fixes, pour un rendu stable. */
const DUST = [
  [6, 0, 9, 4], [14, 3, 11, 3], [22, 6, 10, 5], [31, 1, 12, 3], [39, 4, 9, 4], [47, 7, 13, 3],
  [55, 2, 10, 5], [63, 5, 11, 3], [71, 0, 12, 4], [79, 3, 9, 3], [87, 6, 10, 5], [94, 1, 12, 3],
];

export default async function PapyrusPage() {
  const { moduleCount, lessonCount, vocabCount, sample } = await loadMockData();

  return (
    <div className="papyrus maquette">
      <StyleSwitcher current="/maquette/papyrus" />

      <div className="pa-dust" aria-hidden="true">
        {DUST.map(([left, delay, dur, size], i) => (
          <span
            key={i}
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDelay: `-${delay}s`,
                animationDuration: `${dur}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <header className="pa-header">
        <div className="pa-wrap pa-header-row">
          <Link href="/maquette/papyrus" className="pa-brand">
            <span className="pa-cartouche pa-brand-mark" aria-hidden="true">
              ع
            </span>
            <span className="pa-brand-name">Arabe égyptien</span>
          </Link>
          <nav aria-label="Navigation principale (maquette)">
            <ul className="pa-nav">
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
          <div className="pa-header-actions">
            <ThemeToggle />
            <Link href="/auth/login" className="pa-btn pa-btn-ghost pa-btn-sm">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main className="pa-wrap">
        {/* ---------------------------------------------------------- Ouverture */}
        <section className="pa-hero" aria-labelledby="titre">
          <p className="pa-eyebrow">
            <Sparkle /> Dialecte cairote <Sparkle />
          </p>
          <h1 id="titre" className="pa-title">
            Parler l’arabe du Caire,
            <br />
            <span className="pa-title-gold">pas celui des manuels.</span>
          </h1>
          <p className="pa-lead">
            {moduleCount} modules, {lessonCount} leçons et {vocabCount} mots, de l’alphabet
            jusqu’au débat. Le soleil se lève sur la première leçon.
          </p>
          <div className="pa-actions">
            <Link href="/modules" className="pa-btn pa-btn-gold">
              Commencer le voyage
            </Link>
            <Link href="/placement-test" className="pa-btn pa-btn-ghost">
              Tester mon niveau
            </Link>
          </div>

          <EnchantedHorizon />
        </section>

        {/* ------------------------------------------------------- Chiffres clés */}
        <ul className="pa-stats" aria-label="Le parcours en chiffres">
          <li className="pa-stat">
            <span className="pa-stat-value">{moduleCount}</span>
            <span className="pa-stat-label">modules</span>
          </li>
          <li className="pa-stat">
            <span className="pa-stat-value">{lessonCount}</span>
            <span className="pa-stat-label">leçons</span>
          </li>
          <li className="pa-stat">
            <span className="pa-stat-value">{vocabCount}</span>
            <span className="pa-stat-label">mots</span>
          </li>
        </ul>

        <Frieze />

        {/* ------------------------------------------------------------ Modules */}
        <section aria-labelledby="modules">
          <p className="pa-eyebrow">Le programme</p>
          <h2 id="modules" className="pa-h2">
            Les rouleaux du savoir
          </h2>
          <p className="pa-muted pa-section-lead">
            États « terminé » et « en cours » fictifs, pour montrer les trois cas.
          </p>
          <ul className="pa-cards">
            {sample.map((m, i) => (
              <li key={m.id}>
                <ScrollCard module={m} lessons={m.lessons[0]?.count ?? 0} state={DEMO_STATE[i]} />
              </li>
            ))}
          </ul>
        </section>

        <Frieze />

        {/* ------------------------------------------------------------- Chemin */}
        <section aria-labelledby="chemin">
          <p className="pa-eyebrow">Le chemin</p>
          <h2 id="chemin" className="pa-h2">
            Quatre lotus jusqu’à la conversation
          </h2>
          <ol className="pa-path">
            {LEVELS.map((step) => (
              <li key={step.level} className="pa-path-step">
                <span className="pa-lotus">
                  <Lotus />
                  <span className="pa-lotus-level">{step.level}</span>
                </span>
                <h3 className="pa-h3">{step.title}</h3>
                <p className="pa-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------ Reprise */}
        <section className="pa-cta" aria-labelledby="yalla">
          <span className="pa-cta-sun" aria-hidden="true" />
          <h2 id="yalla" className="pa-h2">
            Yalla, on commence ?
          </h2>
          <p className="pa-muted pa-cta-text">
            Tout le contenu est ouvert sans compte. Créez-en un seulement quand vous voudrez
            garder votre progression.
          </p>
          <div className="pa-actions pa-actions-center">
            <Link href="/modules/module-01" className="pa-btn pa-btn-gold">
              Ouvrir la première leçon
            </Link>
            <Link href="/entrainement" className="pa-btn pa-btn-ghost">
              S’entraîner
            </Link>
          </div>
        </section>
      </main>

      <footer className="pa-wrap pa-footer">
        <p className="pa-muted">Maquette « Papyrus enchanté » — page non indexée.</p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ScrollCard({ module, lessons, state }: { module: Module; lessons: number; state: DemoState }) {
  const { read, pct } = demoProgress(state, lessons);

  return (
    <Link href={`/modules/${module.id}`} className="pa-card" data-level={module.level}>
      <span className="pa-cartouche pa-card-num">{module.number}</span>
      <span className="pa-card-body">
        <span className="pa-card-level">
          {module.level} · {LEVEL_NAME[module.level]}
        </span>
        <span className="pa-card-title">{module.title}</span>
        {module.subtitle && <span className="pa-muted pa-card-sub">{module.subtitle}</span>}
        <span className="pa-card-foot">
          {state === 'new' && <span className="pa-muted">{lessons} leçons</span>}
          {state !== 'new' && (
            <>
              <span
                className="pa-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={lessons}
                aria-valuenow={read}
                aria-label={`${read} leçons lues sur ${lessons}`}
              >
                <span style={{ width: `${pct}%` }} />
              </span>
              <span className="pa-muted">
                {read}/{lessons}
              </span>
            </>
          )}
          {state === 'done' && (
            <span className="pa-done">
              <Lotus /> Terminé
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="pa-sparkle">
      <path d="M8 0c.6 4 2 5.4 8 8-6 2.6-7.4 4-8 8-.6-4-2-5.4-8-8 6-2.6 7.4-4 8-8Z" />
    </svg>
  );
}

function Lotus() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true" className="pa-lotus-svg">
      <path d="M24 2c5 6 6 14 0 26-6-12-5-20 0-26Z" />
      <path d="M24 28C20 18 13 12 4 12c2 10 10 16 20 16Z" />
      <path d="M24 28c4-10 11-16 20-16-2 10-10 16-20 16Z" />
    </svg>
  );
}

/** Une frise de petits losanges et de points, comme la bande peinte en haut des stèles. */
function Frieze() {
  return (
    <div className="pa-frieze" aria-hidden="true">
      <span />
    </div>
  );
}

/** L'horizon enchanté : soleil aux rayons tournants, pyramides, dunes, Nil et étincelles. */
function EnchantedHorizon() {
  return (
    <svg viewBox="0 0 800 300" className="pa-horizon" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="pa-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="pa-sky-top" />
          <stop offset="1" className="pa-sky-bottom" />
        </linearGradient>
        <radialGradient id="pa-halo">
          <stop offset="0" className="pa-halo-in" />
          <stop offset="1" className="pa-halo-out" />
        </radialGradient>
      </defs>

      <rect width="800" height="300" fill="url(#pa-sky)" />
      <circle cx="400" cy="170" r="170" fill="url(#pa-halo)" />
      <g className="pa-rays">
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x="398" y="20" width="4" height="60" rx="2" transform={`rotate(${i * 22.5} 400 170)`} />
        ))}
      </g>
      <circle cx="400" cy="170" r="62" className="pa-sun" />

      <path d="M250 250 330 150 410 250Z" className="pa-pyr" />
      <path d="M330 150 410 250H350Z" className="pa-pyr-shade" />
      <path d="M430 250 490 175 550 250Z" className="pa-pyr" />
      <path d="M490 175 550 250H505Z" className="pa-pyr-shade" />

      <path d="M0 240C120 210 220 250 360 236s260-40 440-6V300H0Z" className="pa-dune-far" />
      <path d="M0 262c150-30 260 14 420 0s260-32 380-10V300H0Z" className="pa-dune-near" />
      <path d="M0 286c200-14 420 12 800-6" className="pa-nile" />

      <g className="pa-stars">
        <path d="M120 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
        <path d="M680 60l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5Z" />
        <path d="M600 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        <path d="M200 140l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
      </g>
    </svg>
  );
}
