import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import StyleSwitcher from '../StyleSwitcher';
import { DEMO_STATE, LEVELS, LEVEL_NAME, demoProgress, loadMockData, type DemoState } from '../data';
import type { Module } from '@/lib/types';
import PopMarquee from './PopMarquee';
import './pop.css';

/**
 * Mise en page « Pop du Caire » : affiches, tuk-tuks et épices. Formes très rondes, grosse
 * typo, autocollants de travers. Styles isolés sous `.popcaire` (`.pop` est déjà pris
 * par globals.css).
 *
 * Deux variantes partagent cette mise en page et ne diffèrent que par la palette :
 * - `pop` : couleurs vives d'origine (rose, jaune, turquoise) ;
 * - `orient` : palette du Conte oriental (indigo, or, turquoise, grenade), voir
 *   pop-orient/pop-orient.css.
 */

const ROUTES = { pop: '/maquette/pop', orient: '/maquette/pop-orient' } as const;

// Grotesque à forte personnalité, pensée pour les grands titres d'affiche.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-bricolage',
});

const STICKERS = [
  { letter: 'ع', digit: '3', tone: 'pink' },
  { letter: 'ح', digit: '7', tone: 'yellow' },
  { letter: 'خ', digit: '5', tone: 'teal' },
  { letter: 'ق', digit: '2', tone: 'orange' },
] as const;

export default async function PopMockup({ variant }: { variant: keyof typeof ROUTES }) {
  const { moduleCount, lessonCount, vocabCount, sample } = await loadMockData();
  const route = ROUTES[variant];

  return (
    <div className={`popcaire maquette ${variant === 'orient' ? 'poporient' : ''} ${bricolage.variable}`}>
      <StyleSwitcher current={route} />

      <header className="pp-header">
        <div className="pp-wrap pp-header-row">
          <Link href={route} className="pp-brand">
            <span className="pp-brand-mark" aria-hidden="true">
              ع
            </span>
            <span className="pp-brand-name">3arabi</span>
          </Link>
          <nav aria-label="Navigation principale (maquette)">
            <ul className="pp-nav">
              <li>
                <Link href="/modules">Modules</Link>
              </li>
              <li>
                <Link href="/entrainement">Entraînement</Link>
              </li>
              <li>
                <Link href="/glossaire">Glossaire</Link>
              </li>
            </ul>
          </nav>
          <div className="pp-header-actions">
            <ThemeToggle />
            <Link href="/auth/login" className="pp-btn pp-btn-ink pp-btn-sm">
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------- Ouverture */}
        <section className="pp-wrap pp-hero" aria-labelledby="titre">
          <div>
            <p className="pp-tag">Dialecte cairote · 100 % street</p>
            <h1 id="titre" className="pp-title">
              Parle <span className="pp-hl pp-hl-pink">comme</span> au{' '}
              <span className="pp-hl pp-hl-yellow">Caire</span>, pas comme les{' '}
              <span className="pp-hl pp-hl-teal">manuels</span>.
            </h1>
            <p className="pp-lead">
              {moduleCount} modules, {lessonCount} leçons, {vocabCount} mots. L’arabe qu’on
              entend dans les rues, les cafés et les séries — écrit comme les Égyptiens
              l’écrivent vraiment.
            </p>
            <div className="pp-actions">
              <Link href="/modules" className="pp-btn pp-btn-pink">
                Yalla, on y va
              </Link>
              <Link href="/placement-test" className="pp-btn pp-btn-outline">
                Mon niveau ?
              </Link>
            </div>
          </div>

          <div className="pp-stickers" aria-label="Les quatre chiffres de l’Arabizi : 3, 7, 5 et 2">
            {STICKERS.map((s, i) => (
              <span key={s.digit} className="pp-sticker" data-tone={s.tone} style={{ '--i': i } as React.CSSProperties}>
                <span className="pp-sticker-letter" lang="ar">
                  {s.letter}
                </span>
                <span className="pp-sticker-digit">= {s.digit}</span>
              </span>
            ))}
            <span className="pp-sticker pp-sticker-word" aria-hidden="true">
              Yalla!
            </span>
          </div>
        </section>

        {/* ------------------------------------------------------------ Bandeau */}
        <PopMarquee />

        <div className="pp-wrap">
          {/* ----------------------------------------------------- Chiffres clés */}
          <ul className="pp-blobs" aria-label="Le parcours en chiffres">
            <li className="pp-blob" data-tone="yellow">
              <strong>{moduleCount}</strong> modules
            </li>
            <li className="pp-blob" data-tone="teal">
              <strong>{lessonCount}</strong> leçons
            </li>
            <li className="pp-blob" data-tone="pink">
              <strong>{vocabCount}</strong> mots
            </li>
          </ul>

          {/* ---------------------------------------------------------- Modules */}
          <section className="pp-section" aria-labelledby="modules">
            <h2 id="modules" className="pp-h2">
              Choisis ton <span className="pp-hl pp-hl-orange">module</span>
            </h2>
            <p className="pp-muted pp-section-lead">
              États « terminé » et « en cours » fictifs, pour montrer les trois cas.
            </p>
            <ul className="pp-cards">
              {sample.map((m, i) => (
                <li key={m.id}>
                  <PopCard module={m} lessons={m.lessons[0]?.count ?? 0} state={DEMO_STATE[i]} index={i} />
                </li>
              ))}
            </ul>
          </section>

          {/* ----------------------------------------------------------- Chemin */}
          <section className="pp-section" aria-labelledby="chemin">
            <h2 id="chemin" className="pp-h2">
              De <span className="pp-hl pp-hl-yellow">zéro</span> au débat
            </h2>
            <ol className="pp-levels">
              {LEVELS.map((step, i) => (
                <li key={step.level} className="pp-level" data-tone={i}>
                  <span className="pp-level-tag">{step.level}</span>
                  <span>
                    <strong>{step.title}</strong>
                    <span className="pp-muted"> — {step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* ---------------------------------------------------------- Reprise */}
          <section className="pp-cta" aria-labelledby="yalla">
            <h2 id="yalla" className="pp-cta-title">
              Yalla&nbsp;! Première leçon en 5 minutes.
            </h2>
            <p>Sans compte. Tu en crées un quand tu veux garder ta progression.</p>
            <div className="pp-actions pp-actions-center">
              <Link href="/modules/module-01" className="pp-btn pp-btn-ink">
                Commencer
              </Link>
              <Link href="/entrainement" className="pp-btn pp-btn-cream">
                S’entraîner
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="pp-wrap pp-footer">
        <p className="pp-muted">
          Maquette « {variant === 'orient' ? 'Pop du Caire, couleurs orientales' : 'Pop du Caire'} » — page non indexée.
        </p>
      </footer>
    </div>
  );
}

const CARD_TONES = ['yellow', 'teal', 'pink', 'orange', 'blue', 'lime'];

function PopCard({
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
  const { read, pct } = demoProgress(state, lessons);

  return (
    <Link href={`/modules/${module.id}`} className="pp-card" data-tone={CARD_TONES[index % CARD_TONES.length]}>
      <span className="pp-card-head">
        <span className="pp-card-num">{module.number}</span>
        <span className="pp-card-level">
          {module.level} · {LEVEL_NAME[module.level]}
        </span>
      </span>
      <span className="pp-card-title">{module.title}</span>
      {module.subtitle && <span className="pp-card-sub">{module.subtitle}</span>}
      <span className="pp-card-foot">
        {state === 'new' ? (
          <span>{lessons} leçons →</span>
        ) : (
          <>
            <span
              className="pp-card-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={lessons}
              aria-valuenow={read}
              aria-label={`${read} leçons lues sur ${lessons}`}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
            <span>{state === 'done' ? 'Terminé ✓' : `${read}/${lessons}`}</span>
          </>
        )}
      </span>
    </Link>
  );
}
