import Link from 'next/link';
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
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link href="/modules" className="text-sm text-neutral-500 hover:underline">
        ← Tous les modules
      </Link>

      <header className="mt-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">{mod.title}</h1>
          <LevelBadge level={mod.level} />
        </div>
        {mod.subtitle && <p className="mt-1 text-sm text-neutral-500">{mod.subtitle}</p>}
        {mod.description && (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
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
