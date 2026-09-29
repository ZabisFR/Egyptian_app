import Link from 'next/link';
import type { Metadata } from 'next';
import { Reem_Kufi } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import StyleSwitcher from '../StyleSwitcher';
import { ArchWindow, Lantern, Ornament, StarMedallion } from '../conte-parts';
import { DEMO_STATE, LEVELS, LEVEL_NAME, demoProgress, loadMockData, type DemoState } from '../data';
import SoundStickers from './SoundStickers';
import WordMarquee from './WordMarquee';
import type { Module } from '@/lib/types';
import '../conte.css';
import './mix.css';

/**
 * Maquette « Mix » : le Conte oriental en base (palette, arches, étoiles, lanternes),
 * enrichi du meilleur des trois autres pistes —
 * - Aventure : chemin des modules en zigzag, « Tu es ici », boutons en relief, série et
 *   jauge de progression, niveaux présentés comme des régions ;
 * - Pop : les quatre sons de l'Arabizi en autocollants jouables, bandeau de mots ;
 * - Papyrus : poussière d'or, éclat qui traverse le bouton doré.
 *
 * Réutilise conte.css (sous `.conte`) et n'ajoute que ses propres pièces dans mix.css.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Mix (Conte oriental)',
  robots: { index: false, follow: false },
};

const kufi = Reem_Kufi({ subsets: ['arabic'], weight: ['500'], variable: '--font-kufi' });

/** Chaque niveau devient une région du Caire, comme dans la maquette Aventure. */
const REGIONS = ['Les rives du Nil', 'Le grand souk', 'Le café d’El-Fishawy', 'La place Tahrir'];

/** Poussière d'or : [gauche %, délai s, durée s, taille px]. Fixe, pour un rendu stable. */
const DUST = [
  [8, 0, 10, 3], [18, 4, 12, 4], [29, 2, 9, 3], [41, 6, 11, 5], [53, 1, 13, 3],
  [64, 5, 10, 4], [75, 3, 12, 3], [86, 7, 9, 5], [94, 2, 11, 3],
];

export default async function MixPage() {
  const { moduleCount, lessonCount, vocabCount, sample } = await loadMockData();

  return (
    <div className={`conte mix maquette ${kufi.variable}`}>
      <StyleSwitcher current="/maquette/mix" />
      <div className="conte-sky" aria-hidden="true" />
      <div className="mx-dust" aria-hidden="true">
        {DUST.map(([left, delay, dur, size], i) => (
          <span
            key={i}
            style={{ left: `${left}%`, width: size, height: size, animationDelay: `-${delay}s`, animationDuration: `${dur}s` }}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------- En-tête */}
      <header className="conte-header">
        <div className="conte-wrap conte-header-row">
          <Link href="/maquette/mix" className="conte-brand">
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
            <span className="mx-streak" title="Série de jours (exemple)">
              <LanternFlame />
              <span>
                3<span className="mx-sr"> jours de suite (exemple)</span>
              </span>
            </span>
            <ThemeToggle />
            <Link href="/auth/login" className="conte-btn conte-btn-ghost conte-btn-sm">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main id="maquette">
        <div className="conte-wrap">
          {/* ------------------------------------------------------ Ouverture */}
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
                {moduleCount} modules, {lessonCount} leçons et {vocabCount} mots. Poussez la
                première porte : chaque leçon lue allume une lanterne sur votre chemin.
              </p>
              <div className="conte-actions">
                <Link href="/modules" className="conte-btn conte-btn-gold mx-btn-3d mx-shine">
                  Commencer l’aventure
                </Link>
                <Link href="/placement-test" className="conte-btn conte-btn-ghost mx-btn-3d-ghost">
                  Tester mon niveau
                </Link>
              </div>

              {/* La jauge de l'Aventure, habillée en carte du Conte. */}
              <div className="mx-journey" aria-label="Progression d’exemple">
                <StarMedallion size={44} tone={0}>
                  <span className="mx-journey-level">3</span>
                </StarMedallion>
                <div className="mx-journey-body">
                  <p className="mx-journey-title">
                    Niveau 3 · <span className="conte-muted">240 / 400 XP (exemple)</span>
                  </p>
                  <span className="mx-bar">
                    <span style={{ width: '60%' }} />
                  </span>
                </div>
              </div>
            </div>

            <div className="conte-hero-art">
              <ArchWindow />
            </div>
          </section>
        </div>

        <WordMarquee />

        <div className="conte-wrap">
          {/* ---------------------------------------------------- Les quatre sons */}
          <section className="conte-section mx-sounds" aria-labelledby="sons">
            <header className="conte-section-head">
              <p className="conte-eyebrow">À écouter</p>
              <h2 id="sons" className="conte-h2">
                Pourquoi des chiffres dans les mots ?
              </h2>
              <p className="conte-section-lead">
                Quatre sons arabes n’ont pas de lettre latine : les Égyptiens écrivent le chiffre
                qui leur ressemble. Touchez un autocollant pour l’entendre.
              </p>
            </header>
            <SoundStickers />
          </section>

          {/* ------------------------------------------------------ Chiffres clés */}
          <ul className="conte-stats mx-stats" aria-label="Le parcours en chiffres">
            <MixStat value={moduleCount} label="modules" icon={<path d="M5 21V11a7 7 0 0 1 14 0v10M5 21h14M9 21v-6a3 3 0 0 1 6 0v6" />} />
            <MixStat value={lessonCount} label="leçons" icon={<path d="M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4" />} />
            <MixStat value={vocabCount} label="mots" icon={<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />} />
          </ul>

          <Ornament />

          {/* ---------------------------------------------------------- Chemin */}
          <section className="conte-section" aria-labelledby="chemin">
            <header className="conte-section-head">
              <p className="conte-eyebrow">Le chemin</p>
              <h2 id="chemin" className="conte-h2">
                Chaque module est une porte
              </h2>
              <p className="conte-section-lead">
                États « terminé » et « en cours » fictifs, pour montrer les trois cas.
              </p>
            </header>

            <ol className="mx-trail">
              {sample.map((m, i) => (
                <TrailStep key={m.id} module={m} lessons={m.lessons[0]?.count ?? 0} state={DEMO_STATE[i]} index={i} />
              ))}
            </ol>
          </section>

          <Ornament />

          {/* --------------------------------------------------------- Régions */}
          <section className="conte-section" aria-labelledby="regions">
            <header className="conte-section-head">
              <p className="conte-eyebrow">Les niveaux</p>
              <h2 id="regions" className="conte-h2">
                Quatre quartiers du Caire à explorer
              </h2>
            </header>
            <ul className="mx-regions">
              {LEVELS.map((step, i) => (
                <li key={step.level} className="mx-region" data-tone={i}>
                  <span className="mx-region-arch">
                    <StarMedallion size={52} tone={i}>
                      <span className="mx-region-level">{step.level}</span>
                    </StarMedallion>
                  </span>
                  <span className="mx-region-name">{REGIONS[i]}</span>
                  <strong className="mx-region-title">{step.title}</strong>
                  <span className="conte-muted mx-region-text">{step.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* --------------------------------------------------------- Reprise */}
          <section className="conte-cta" aria-labelledby="yalla">
            <Lantern className="conte-cta-lantern" />
            <h2 id="yalla" className="conte-h2">
              Yalla, la première lanterne vous attend
            </h2>
            <p className="conte-muted conte-cta-text">
              Tout le contenu est ouvert sans compte. Créez-en un seulement quand vous voudrez
              garder votre progression.
            </p>
            <div className="conte-actions conte-actions-center">
              <Link href="/modules/module-01" className="conte-btn conte-btn-gold mx-btn-3d mx-shine">
                Ouvrir la première leçon
              </Link>
              <Link href="/entrainement" className="conte-btn conte-btn-ghost mx-btn-3d-ghost">
                S’entraîner
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="conte-footer">
        <div className="conte-wrap">
          <Ornament />
          <p className="conte-muted">Maquette « Mix » (base Conte oriental) — page non indexée.</p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------

function MixStat({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <li className="conte-stat">
      <span className="conte-stat-glyph mx-stat-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">{icon}</svg>
      </span>
      <span className="conte-stat-value mx-lining">{value}</span>
      <span className="conte-stat-label">{label}</span>
    </li>
  );
}

/**
 * Une étape du chemin : le médaillon étoilé du Conte devient le gros bouton rond de
 * l'Aventure, et la carte à côté garde le dôme en arche.
 */
function TrailStep({
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
  const offset = [0, 1, 0, -1][index % 4];
  const status = state === 'done' ? 'terminé' : state === 'progress' ? 'en cours' : 'à découvrir';
  const tone = ['A1', 'A2', 'B1', 'B2'].indexOf(module.level);

  return (
    <li className="mx-step" data-state={state} data-level={module.level} style={{ '--offset': offset } as React.CSSProperties}>
      <Link href={`/modules/${module.id}`} className="mx-step-link" aria-label={`Module ${module.number} : ${module.title}, ${status}`}>
        <span className="mx-node">
          {state === 'progress' && (
            <span className="mx-here" aria-hidden="true">
              Vous êtes ici
            </span>
          )}
          <StarMedallion size={84} tone={state === 'done' ? 1 : tone}>
            {state === 'done' ? (
              <svg viewBox="0 0 24 24" className="mx-node-check" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            ) : (
              <span className="mx-node-num">{module.number}</span>
            )}
          </StarMedallion>
        </span>

        <span className="mx-step-card" aria-hidden="true">
          <span className="mx-step-level">
            {module.level} · {LEVEL_NAME[module.level]}
          </span>
          <span className="mx-step-title">{module.title}</span>
          <span className="mx-step-foot">
            {state === 'new' ? (
              <span className="conte-muted">{lessons} leçons</span>
            ) : (
              <>
                <span className="conte-progress">
                  <span style={{ width: `${pct}%` }} />
                </span>
                <span className="conte-muted conte-tabular">
                  {read}/{lessons}
                </span>
              </>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** La flamme de la série, dessinée comme une petite lanterne. */
function LanternFlame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mx-flame">
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9Z" />
    </svg>
  );
}
