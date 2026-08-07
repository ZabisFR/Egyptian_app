import ModuleCard from '@/components/ModuleCard';
import { getUser } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';
import { createClient } from '@/lib/supabase/server';
import type { Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

type ModuleRow = Module & { lessons: { count: number }[] };

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
        <pre className="mt-4 overflow-x-auto rounded bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] p-4 text-sm text-[var(--carmine)]">
          {error.message}
        </pre>
      </main>
    );
  }

  const total = modules.reduce((n, m) => n + (m.lessons[0]?.count ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="display text-4xl">Modules</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {modules.length} modules · {total} leçons
      </p>
      <div className="egypt-rule mt-6">
        <span className="text-xs">◆</span>
      </div>

      <ul className="mt-8 space-y-3">
        {modules.map((m) => (
          <li key={m.id}>
            <ModuleCard
              module={m}
              lessonCount={m.lessons[0]?.count ?? 0}
              status={progress.get(m.id)?.status ?? 'not_started'}
              lessonsRead={progress.get(m.id)?.lessonsRead ?? 0}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
