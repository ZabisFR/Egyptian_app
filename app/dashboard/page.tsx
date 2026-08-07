import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import ProgressBar from '@/components/ProgressBar';
import { requireProfile } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';
import { createClient } from '@/lib/supabase/server';
import type { Lesson, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [progress, { data: modules }] = await Promise.all([
    getAllProgress(profile.id),
    supabase
      .from('modules')
      .select('id, title, level, order_index')
      .order('order_index')
      .returns<Pick<Module, 'id' | 'title' | 'level' | 'order_index'>[]>(),
  ]);

  const rows = (modules ?? []).map((m) => ({ ...m, progress: progress.get(m.id) }));
  const completed = rows.filter((r) => r.progress?.status === 'completed').length;
  const lessonsRead = rows.reduce((n, r) => n + (r.progress?.lessonsRead ?? 0), 0);
  const lessonsTotal = rows.reduce((n, r) => n + (r.progress?.lessonsTotal ?? 0), 0);

  // « Reprendre où j'en étais » : le premier module entamé mais pas terminé, sinon le
  // premier module jamais commencé. Le module de référence est exclu — il se consulte,
  // il ne se termine pas.
  const resumable = rows.filter((r) => r.level !== 'REF');
  const current =
    resumable.find((r) => r.progress?.status === 'in_progress') ??
    resumable.find((r) => r.progress?.status === 'not_started');

  const nextLesson = current ? await findNextLesson(current.id) : null;

  async function findNextLesson(moduleId: string) {
    const { data } = await supabase
      .from('lessons')
      .select('id, title, order_index')
      .eq('module_id', moduleId)
      .order('order_index')
      .returns<Pick<Lesson, 'id' | 'title' | 'order_index'>[]>();

    const { data: done } = await supabase
      .from('lesson_completions')
      .select('lesson_order_index')
      .eq('user_id', profile.id)
      .eq('module_id', moduleId)
      .returns<{ lesson_order_index: number }[]>();

    const read = new Set((done ?? []).map((d) => d.lesson_order_index));
    return (data ?? []).find((l) => !read.has(l.order_index)) ?? null;
  }

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-bold">Bonjour {profile.display_name}</h1>
        <LevelBadge level={profile.current_level} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          ['Niveau', profile.current_level],
          ['XP', profile.xp_points],
          ['Modules terminés', `${completed}/${rows.length}`],
          ['Leçons lues', `${lessonsRead}/${lessonsTotal}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <dt className="text-xs uppercase tracking-wide text-neutral-400">{label}</dt>
            <dd className="mt-1 text-xl font-semibold sm:text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <ProgressBar
          value={lessonsRead}
          max={lessonsTotal}
          label={`Progression globale — ${lessonsRead} leçons sur ${lessonsTotal}`}
        />
      </div>

      {current && nextLesson && (
        <section className="mt-10 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Reprendre où vous en étiez
          </p>
          <h2 className="mt-2 font-semibold">{current.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{nextLesson.title}</p>
          <Link
            href={`/modules/${current.id}/${nextLesson.id}`}
            className="mt-4 block rounded-lg bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-neutral-700 sm:inline-block sm:text-left dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Continuer
          </Link>
        </section>
      )}

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Tous les modules
      </h2>
      <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/modules/${r.id}`}
              className="flex items-center gap-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
              <span className="shrink-0 text-xs text-neutral-400">
                {r.progress?.lessonsRead ?? 0}/{r.progress?.lessonsTotal ?? 0}
              </span>
              {r.progress?.status === 'completed' && (
                <span className="shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
