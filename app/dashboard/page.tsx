import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import ScoreDial from '@/components/ScoreDial';
import StreakBadge from '@/components/StreakBadge';
import { requireProfile } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';
import { getDailyLesson } from '@/lib/daily';
import { totalCount } from '@/lib/exercises';
import { getStreak } from '@/lib/streak';
import { createClient } from '@/lib/supabase/server';
import type { Lesson, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [progress, daily, streak, { data: modules }] = await Promise.all([
    getAllProgress(profile.id),
    getDailyLesson(profile.id),
    getStreak(profile.id),
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

  const globalPct = lessonsTotal === 0 ? 0 : Math.round((lessonsRead / lessonsTotal) * 100);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="display text-3xl">Bonjour {profile.display_name}</h1>
        <LevelBadge level={profile.current_level} />
      </div>

      {/* Le cadran d'abord : c'est la réponse à « où j'en suis ? », la seule question que
          l'on se pose en ouvrant un tableau de bord d'apprentissage. */}
      <section className="card-sand rise mt-7 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <ScoreDial value={globalPct} caption={`${lessonsRead} leçons lues sur ${lessonsTotal}`} />

          {/* `min-w-40` : sans plancher, ce bloc se comprimait à 70 px à côté du cadran
              plutôt que de passer à la ligne — `flex-wrap` ne déclenche le retour à la
              ligne que si un élément ne peut PLUS rétrécir, et par défaut il rétrécit
              toujours un peu plus, quitte à rendre « 0/30 » illisible (mesuré). */}
          <dl className="grid min-w-40 flex-1 grid-cols-2 gap-4 text-center sm:max-w-sm sm:grid-cols-4">
            {[
              ['Série', `${streak.current} j`],
              ['XP', profile.xp_points],
              ['Modules', `${completed}/${rows.length}`],
              ['Niveau', profile.current_level],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="display text-2xl leading-none tabular">{value}</dd>
                <dt className="eyebrow mt-1.5">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section
          className="card-sand rise flex flex-col p-5"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow">Leçon du jour</p>
            <StreakBadge streak={streak} size="sm" />
          </div>
          <h2 className="display mt-2 text-lg">
            {daily.alreadyDone
              ? `Faite aujourd'hui — ${daily.lastScore} %`
              : daily.questions.length > 0
                ? `${daily.questions.length} mots à réviser`
                : 'Rien à réviser pour l’instant'}
          </h2>
          <p className="mt-1 flex-1 text-sm text-[var(--muted)]">
            {daily.questions.length > 0 || daily.alreadyDone
              ? `Tirés de vos ${daily.lessonsRead} leçons lues.`
              : 'Marquez des leçons comme lues pour alimenter la révision.'}
          </p>
          {!daily.alreadyDone && daily.questions.length > 0 && (
            <Link href="/daily" className="btn-sand mt-4 w-full">
              Commencer
            </Link>
          )}
        </section>

        {current && nextLesson && (
          <section
            className="card-sand rise flex flex-col p-5"
            style={{ '--i': 2 } as React.CSSProperties}
          >
            <p className="eyebrow">Reprendre où vous en étiez</p>
            <h2 className="display mt-2 text-lg">{current.title}</h2>
            <p className="mt-1 flex-1 text-sm text-[var(--muted)]">{nextLesson.title}</p>
            <Link
              href={`/modules/${current.id}/${nextLesson.id}`}
              className="btn-sand mt-4 w-full"
            >
              Continuer
            </Link>
          </section>
        )}

        {/* L'entraînement est la seule carte du tableau de bord qui n'affiche aucun
            chiffre personnel : il n'en produit pas. C'est précisément ce qu'on veut dire —
            on peut s'y tromper sans que cela compte nulle part. */}
        <section
          className="card-sand rise flex flex-col p-5"
          style={{ '--i': 3 } as React.CSSProperties}
        >
          <p className="eyebrow">Entraînement</p>
          <h2 className="display mt-2 text-lg">{totalCount()} exercices à trous</h2>
          <p className="mt-1 flex-1 text-sm text-[var(--muted)]">
            Conjuguer, nier, transformer, écrire. On tape la réponse — rien n’est
            enregistré.
          </p>
          <Link href="/entrainement" className="btn-outline mt-4 w-full">
            S’exercer
          </Link>
        </section>
      </div>

      <h2 className="eyebrow mt-12">Tous les modules</h2>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => {
          const read = r.progress?.lessonsRead ?? 0;
          const total = r.progress?.lessonsTotal ?? 0;
          const pct = total === 0 ? 0 : Math.round((read / total) * 100);
          return (
            <li key={r.id}>
              <Link
                href={`/modules/${r.id}`}
                className="flex items-center gap-3 rounded-[var(--r-sm)] px-2 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--gold)_9%,transparent)]"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                <span
                  aria-hidden="true"
                  className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--surface-sunken)] sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-[var(--gold)]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="shrink-0 text-xs text-[var(--muted)] tabular">
                  {read}/{total}
                </span>
                <span className="w-4 shrink-0 text-[var(--malachite-text)]">
                  {r.progress?.status === 'completed' ? '✓' : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
