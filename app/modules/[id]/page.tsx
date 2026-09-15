import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LevelBadge from '@/components/LevelBadge';
import LessonPath from '@/components/LessonPath';
import ProgressBar from '@/components/ProgressBar';
import { getUser } from '@/lib/auth';
import { getAllProgress, getReadLessons } from '@/lib/progress';
import { createClient } from '@/lib/supabase/server';
import type { Lesson, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

type LessonLink = Pick<Lesson, 'id' | 'day' | 'title' | 'section' | 'order_index'>;

/*
  Sans ces `generateMetadata`, les 30 modules et les 139 leçons partageaient tous le
  titre d'onglet « Arabe égyptien » : impossible de distinguer cinq leçons ouvertes côte
  à côte, et un moteur de recherche voyait 170 pages au titre identique.
*/
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('modules')
    .select('title, description')
    .eq('id', id)
    .maybeSingle<Pick<Module, 'title' | 'description'>>();

  if (!data) return { title: 'Module introuvable' };
  return { title: data.title, description: data.description ?? undefined };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: mod }, { data: lessons }, { count: quizCount }, readLessons, progress] =
    await Promise.all([
    supabase.from('modules').select('*').eq('id', id).maybeSingle<Module>(),
    supabase
      .from('lessons')
      .select('id, day, title, section, order_index')
      .eq('module_id', id)
      .order('order_index')
      .returns<LessonLink[]>(),
    supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', id)
      .eq('type', 'mcq'),
    getReadLessons(user?.id ?? null, id),
    getAllProgress(user?.id ?? null),
  ]);

  if (!mod) notFound();

  const moduleProgress = progress.get(id);

  // Les leçons arrivent déjà dans l'ordre : on regroupe en conservant l'ordre d'apparition
  // des sections, plutôt que de trier par nom (« SECTION 1 » doit précéder « SECTION 2 »).
  const sections: { name: string | null; lessons: LessonLink[] }[] = [];
  for (const lesson of lessons ?? []) {
    const last = sections.at(-1);
    if (last && last.name === lesson.section) last.lessons.push(lesson);
    else sections.push({ name: lesson.section, lessons: [lesson] });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-8 sm:px-8">
      <Link
        href="/modules"
        // `inline-block` + `py-1` : le lien nu ne faisait que 18 px de haut, sous les
        // 24 px exigés pour une cible cliquable.
        className="inline-block py-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        ← Tous les modules
      </Link>

      <header className="mt-5">
        {mod.order_index < 99 && <p className="eyebrow">Module {mod.number}</p>}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          <h1 className="display text-3xl sm:text-4xl">{mod.title}</h1>
          <LevelBadge level={mod.level} />
        </div>
        {mod.subtitle && <p className="mt-1 text-[var(--muted)]">{mod.subtitle}</p>}
        {mod.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {mod.description}
          </p>
        )}

        {user && moduleProgress && moduleProgress.lessonsTotal > 0 && (
          <div className="mt-6">
            <ProgressBar
              value={moduleProgress.lessonsRead}
              max={moduleProgress.lessonsTotal}
              label={
                moduleProgress.status === 'completed'
                  ? `Module terminé — ${moduleProgress.lessonsTotal} leçons lues et quiz réussi à ${moduleProgress.bestScore} %`
                  : `${moduleProgress.lessonsRead} / ${moduleProgress.lessonsTotal} leçons lues` +
                    (moduleProgress.bestScore !== null
                      ? ` · quiz : ${moduleProgress.bestScore} %${moduleProgress.quizPassed ? ' ✓' : ''}`
                      : ' · quiz non passé')
              }
            />
          </div>
        )}

      </header>

      {/* Le module de l'alphabet est le seul où l'on apprend à FORMER les lettres :
          c'est là que l'atelier de tracé a sa place, pas dans une barre globale. */}
      {mod.id === 'module-01' && (
        <Link
          href="/ecriture"
          className="card-sand card-link mt-6 flex items-center gap-4 p-4"
        >
          <span
            aria-hidden="true"
            className="arabic flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] bg-[color-mix(in_srgb,var(--lapis)_14%,transparent)] text-xl leading-none text-[var(--lapis-text)]"
          >
            ع
          </span>
          <span>
            <span className="display block text-base">S&apos;entraîner à les tracer</span>
            <span className="mt-0.5 block text-sm text-[var(--muted)]">
              Écrivez chaque lettre au doigt ou au stylet et obtenez un pourcentage de
              ressemblance avec le modèle.
            </span>
          </span>
        </Link>
      )}

      <LessonPath
        moduleId={mod.id}
        sections={sections.map((section) => ({
          name: section.name,
          lessons: section.lessons.map((lesson) => ({
            id: lesson.id,
            day: lesson.day,
            title: lesson.title,
            order_index: lesson.order_index,
            read: readLessons.has(lesson.order_index),
          })),
        }))}
        quiz={
          (quizCount ?? 0) > 0
            ? {
                count: quizCount ?? 0,
                passed: moduleProgress?.quizPassed ?? false,
                bestScore: moduleProgress?.bestScore ?? null,
                unlocked:
                  !!moduleProgress &&
                  moduleProgress.lessonsTotal > 0 &&
                  moduleProgress.lessonsRead >= moduleProgress.lessonsTotal,
              }
            : null
        }
      />
    </main>
  );
}
