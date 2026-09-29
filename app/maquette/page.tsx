import Link from 'next/link';
import type { Metadata } from 'next';
import { Reem_Kufi } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import type { Level, Module } from '@/lib/types';
import StyleSwitcher from './StyleSwitcher';
import { ArchWindow, Lantern, Ornament, StarMedallion } from './conte-parts';
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
