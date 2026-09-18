import Link from 'next/link';
import type { Metadata } from 'next';
import ModuleCard from '@/components/ModuleCard';
import { getUser } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';
import { createClient } from '@/lib/supabase/server';
import type { Level, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tous les modules',
  description:
    "Le parcours complet, de l'alphabet au débat : 30 modules classés par niveau, du A1 au B2, plus les fiches de référence.",
};

type ModuleRow = Module & { lessons: { count: number }[] };

/** Ce que chaque palier apporte, affiché en tête de groupe. */
const LEVEL_INTRO: Record<Level, string> = {
  A1: "Lire l'alphabet, écrire en Arabizi, tenir les échanges du quotidien.",
  A2: 'Le passé, le futur, le marchandage et le récit.',
  B1: 'Suivre une conversation réelle et changer de registre.',
  B2: 'Nuancer, argumenter, comprendre sans sous-titres.',
  REF: 'À consulter à tout moment, pas à terminer.',
};

export default async function ModulesPage() {
  const supabase = await createClient();
  const [{ data: modules, error }, user] = await Promise.all([
    supabase
      .from('modules')
      .select('*, lessons(count)')
      .order('order_index')
      .returns<ModuleRow[]>(),
    getUser(),
  ]);

  const progress = await getAllProgress(user?.id ?? null);

  if (error) {
    // Le détail technique part dans les journaux Vercel, pas à l'écran : un message
    // d'erreur Supabase brut ne dit rien d'utile à un apprenant et expose au passage
    // des noms de colonnes et des indices sur les politiques RLS.
    console.error('Chargement des modules impossible :', error.message);
    return (
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
        <h1 className="display text-2xl">Les modules sont momentanément indisponibles</h1>
        <p className="mt-4 text-[var(--muted)]">
          La liste des leçons n’a pas pu être chargée. Cela vient presque toujours d’une
          coupure passagère : réessayez dans quelques instants.
        </p>
        <Link href="/modules" className="btn-sand mt-6 inline-flex">
          Réessayer
        </Link>
      </main>
    );
  }

  const total = modules.reduce((n, m) => n + (m.lessons[0]?.count ?? 0), 0);
  const done = modules.filter((m) => progress.get(m.id)?.status === 'completed').length;

  // Un groupe par niveau, dans l'ordre où chaque niveau apparaît pour la première fois.
  //
  // Découper sur les ruptures de niveau ne marche pas : le programme alterne — module-09
  // est un B2 encadré de B1, module-10 et 11 repassent en B1 — ce qui affichait deux fois
  // « Niveau B1 » et deux fois « Niveau B2 ». On cherche donc le groupe existant.
  // L'ordre d'apparition (et non l'ordre alphabétique du niveau) est ce qui garde « REF »
  // en fin de liste plutôt qu'entre B1 et B2.
  const groups: { level: Level; modules: ModuleRow[] }[] = [];
  for (const m of modules) {
    const group = groups.find((g) => g.level === m.level);
    if (group) group.modules.push(m);
    else groups.push({ level: m.level, modules: [m] });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header>
        <p className="eyebrow">Le programme</p>
        <h1 className="display mt-2 text-4xl">Modules</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {modules.length} modules · {total} leçons
          {user && ` · ${done} terminé${done > 1 ? 's' : ''}`}
        </p>
      </header>

      <div className="egypt-rule mt-6">
        <span className="text-xs">◆</span>
      </div>

      {/* Le glossaire n'est pas un module : il ne s'apprend pas, il se consulte. Il a donc
          sa carte à part, avant la liste, plutôt qu'une ligne perdue au milieu du
          programme. */}
      <Link href="/glossaire" className="card-sand card-link mt-8 flex items-center gap-4 p-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] bg-[color-mix(in_srgb,var(--lapis)_14%,transparent)] text-[var(--lapis-text)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
            <path d="M8 8h7M8 12h7" />
          </svg>
        </span>
        <span>
          <span className="display block text-lg">Glossaire</span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            Tout le vocabulaire du site en une page, cherchable en français, en arabe ou en
            Arabizi.
          </span>
        </span>
      </Link>

      {/* L'entraînement non plus n'est pas un module : il ne se termine pas et ne compte
          dans aucune progression. Il est ici parce que la barre de navigation n'a plus la
          place d'un lien sous 640 px — c'est le seul chemin vers lui sur mobile. */}
      <Link
        href="/entrainement"
        className="card-sand card-link mt-3 flex items-center gap-4 p-4"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-[var(--gold-text)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 17h5M15 17h5" />
            <path d="M12 4v13" />
            <path d="M9 7.5h6" />
          </svg>
        </span>
        <span>
          <span className="display block text-lg">Entraînement</span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            Des phrases à trous pour conjuguer, nier et écrire — on tape la réponse, rien
            n’est noté.
          </span>
        </span>
      </Link>

      {groups.map((group) => (
        <section key={group.level} className="mt-10">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="display text-xl">Niveau {group.level}</h2>
            <p className="text-sm text-[var(--muted)]">{LEVEL_INTRO[group.level]}</p>
          </div>

          <ul className="mt-4 space-y-3">
            {group.modules.map((m, i) => (
              <li
                key={m.id}
                className="rise"
                // Décalage plafonné à six rangs : au-delà, l'attente devient perceptible
                // en bas de liste alors que l'effet, lui, ne se voit plus.
                style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
              >
                <ModuleCard
                  module={m}
                  lessonCount={m.lessons[0]?.count ?? 0}
                  status={progress.get(m.id)?.status ?? 'not_started'}
                  lessonsRead={progress.get(m.id)?.lessonsRead ?? 0}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
