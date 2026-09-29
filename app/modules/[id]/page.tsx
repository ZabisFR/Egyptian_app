import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LessonPath from '@/components/LessonPath';
import ProgressBar from '@/components/ProgressBar';
import { getUser } from '@/lib/auth';
import { getAllProgress, getReadLessons } from '@/lib/progress';
import { LEVEL_TONE } from '@/lib/level-tone';
import { QUIZ_SIZE } from '@/lib/quiz-scoring';
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
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-8">
      <Link
        href="/modules"
        // `inline-block` + `py-1` : le lien nu ne faisait que 18 px de haut, sous les
        // 24 px exigés pour une cible cliquable.
        className="inline-block py-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        ← Tous les modules
      </Link>

      {/* L'en-tête prend la couleur du niveau : on sait où l'on est dans le programme
          avant même d'avoir lu le titre. */}
      <header className={`pop-card mt-5 ${LEVEL_TONE[mod.level] ?? LEVEL_TONE.REF}`}>
        <div className="flex flex-wrap items-center gap-3">
          {mod.order_index < 99 && (
            <span aria-hidden="true" className="pop-num">
              {mod.number}
            </span>
          )}
          <span className="pop-chip">
            {mod.order_index < 99 ? `Module ${mod.number} · ` : ''}
            {mod.level}
          </span>
        </div>
        <h1 className="display mt-4 text-4xl leading-[1.05] sm:text-5xl">{mod.title}</h1>
        {mod.subtitle && <p className="mt-2 font-semibold">{mod.subtitle}</p>}
        {mod.description && (
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed">{mod.description}</p>
        )}
      </header>

      <div>

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
      </div>

      {/* Le module de l'alphabet est le seul où l'on apprend à FORMER les lettres :
          c'est là que l'atelier de tracé a sa place, pas dans une barre globale. */}
      {mod.id === 'module-01' && (
        <Link href="/ecriture" className="pop-card pop-card-row pop-tone-saffron mt-8">
          <span aria-hidden="true" className="pop-num text-2xl">
            ع
          </span>
          <span>
            <span className="display block text-lg">S&apos;entraîner à les tracer</span>
            <span className="mt-0.5 block text-sm font-medium">
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
                // La banque en compte davantage, mais une tentative n'en pose que QUIZ_SIZE.
                count: Math.min(quizCount ?? 0, QUIZ_SIZE),
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
