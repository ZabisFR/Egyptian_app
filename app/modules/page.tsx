import Link from 'next/link';
import type { Metadata } from 'next';
import ModuleCard from '@/components/ModuleCard';
import { getUser } from '@/lib/auth';
import { LEVEL_TONE } from '@/lib/level-tone';
import { getAllProgress } from '@/lib/progress';
import { getModules } from '@/lib/content';
import type { Level, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tous les modules',
  description:
    "Le parcours complet, de l'alphabet au débat : 30 modules classés par niveau, du A1 au B2, plus les fiches de référence.",
};

type ModuleRow = Module & { lessonCount: number };

/** Ce que chaque palier apporte, affiché en tête de groupe. */
const LEVEL_INTRO: Record<Level, string> = {
  A1: "Lire l'alphabet, écrire en Arabizi, tenir les échanges du quotidien.",
  A2: 'Le passé, le futur, le marchandage et le récit.',
  B1: 'Suivre une conversation réelle et changer de registre.',
  B2: 'Nuancer, argumenter, comprendre sans sous-titres.',
  REF: 'À consulter à tout moment, pas à terminer.',
};

export default async function ModulesPage() {
  // Utilisateur et contenu en parallèle ; la progression dépend de l'utilisateur, elle
  // attend donc la première promesse, mais le contenu vient du cache (quelques ms).
  let modules: ModuleRow[];
  let user: Awaited<ReturnType<typeof getUser>>;
  let error: Error | null = null;
  try {
    [modules, user] = await Promise.all([getModules(), getUser()]);
  } catch (e) {
    modules = [];
    user = null;
    error = e as Error;
  }

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

  const total = modules.reduce((n, m) => n + m.lessonCount, 0);
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
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <header>
        <p className="cartouche">Le programme</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">
          Choisis ton <span className="pop-hl pop-tone-saffron">module</span>
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {modules.length} modules · {total} leçons
          {user && ` · ${done} terminé${done > 1 ? 's' : ''}`}
        </p>
      </header>

      {/* Le glossaire et l'entraînement ne sont pas des modules : ils ne s'apprennent pas
          jusqu'au bout, ils se consultent. Ils ont donc leurs cartes à part, avant le
          programme. L'entraînement est ici parce que la barre de navigation n'a plus la
          place d'un lien sous 1024 px — c'est son chemin principal sur mobile. */}
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        <li>
          <Link href="/glossaire" className="pop-card pop-card-row pop-tone-sand">
            <span aria-hidden="true" className="pop-num">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
                <path d="M8 8h7M8 12h7" />
              </svg>
            </span>
            <span>
              <span className="display block text-xl">Glossaire</span>
              <span className="mt-0.5 block text-sm font-medium">
                Tout le vocabulaire du site, cherchable en français, en arabe ou en Arabizi.
              </span>
            </span>
          </Link>
        </li>
        <li>
          <Link href="/entrainement" className="pop-card pop-card-row pop-tone-saffron">
            <span aria-hidden="true" className="pop-num">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 17h5M15 17h5" />
                <path d="M12 4v13" />
                <path d="M9 7.5h6" />
              </svg>
            </span>
            <span>
              <span className="display block text-xl">Entraînement</span>
              <span className="mt-0.5 block text-sm font-medium">
                Des phrases à trous pour conjuguer, nier et écrire — rien n’est noté.
              </span>
            </span>
          </Link>
        </li>
      </ul>

      {groups.map((group) => (
        <section key={group.level} className="mt-14">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="display text-3xl">
              Niveau <span className={`pop-hl ${LEVEL_TONE[group.level]}`}>{group.level}</span>
            </h2>
            <p className="text-sm text-[var(--muted)]">{LEVEL_INTRO[group.level]}</p>
          </div>

          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  lessonCount={m.lessonCount}
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
