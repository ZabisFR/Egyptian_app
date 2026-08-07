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
        <h1 className="text-2xl font-bold">Erreur de connexion Supabase</h1>
        <pre className="mt-4 overflow-x-auto rounded bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          {error.message}
        </pre>
      </main>
    );
  }

  const total = modules.reduce((n, m) => n + (m.lessons[0]?.count ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-bold">Modules</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {modules.length} modules · {total} leçons
      </p>

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
