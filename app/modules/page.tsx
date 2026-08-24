import ModuleCard from '@/components/ModuleCard';
import { getUser } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';
import { createClient } from '@/lib/supabase/server';
import type { Level, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
    return (
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <h1 className="display text-2xl">Erreur de connexion Supabase</h1>
        <pre className="mt-4 overflow-x-auto rounded bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] p-4 text-sm text-[var(--carmine-text)]">
          {error.message}
        </pre>
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
