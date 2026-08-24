import Link from 'next/link';
import { notFound } from 'next/navigation';
import LessonViewer from '@/components/LessonViewer';
import LessonReadToggle from '@/components/LessonReadToggle';
import { toggleLessonRead } from '../actions';
import { getUser } from '@/lib/auth';
import { getReadLessons } from '@/lib/progress';
import FeedbackActions from '@/components/FeedbackActions';
import { SITE } from '@/lib/site-config';
import { createClient } from '@/lib/supabase/server';
import type { Lesson, VocabItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const supabase = await createClient();

  const user = await getUser();
  const [{ data: lesson }, { data: siblings }, readLessons] = await Promise.all([
    supabase
      .from('lessons')
      .select('*, vocab_items(*)')
      .eq('id', lessonId)
      .maybeSingle<Lesson & { vocab_items: VocabItem[] }>(),
    supabase
      .from('lessons')
      .select('id, title')
      .eq('module_id', id)
      .order('order_index')
      .returns<Pick<Lesson, 'id' | 'title'>[]>(),
    getReadLessons(user?.id ?? null, id),
  ]);

  if (!lesson || lesson.module_id !== id) notFound();

  const at = siblings!.findIndex((l) => l.id === lessonId);
  const prev = at > 0 ? siblings![at - 1] : null;
  const next = at < siblings!.length - 1 ? siblings![at + 1] : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-8 sm:px-8">
      <Link
        href={`/modules/${id}`}
        className="inline-block py-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
      >
        ← Retour au module
      </Link>

      <div className="mt-4">
        <LessonViewer lesson={lesson} vocab={lesson.vocab_items} />
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <LessonReadToggle
          moduleId={id}
          orderIndex={lesson.order_index}
          initialRead={readLessons.has(lesson.order_index)}
          isLoggedIn={!!user}
          onToggle={toggleLessonRead}
        />

        {/*
          Signalement contextuel : l'objet et le corps du message portent déjà la leçon,
          le module et l'URL. Sans ce pré-remplissage, un retour arrive sous la forme
          « il y a une faute dans la leçon sur les couleurs » et il faut retrouver
          laquelle — c'est ce qui décourage d'y donner suite.
        */}
        <FeedbackActions
          variant="inline"
          subject={`Coquille — ${lesson.title}`}
          body={
            `Leçon : ${lesson.title}${lesson.day !== null ? ` (jour ${lesson.day})` : ''}\n` +
            `Module : ${id}\n` +
            `Page : ${SITE.url}/modules/${id}/${lessonId}\n\n` +
            `Ce qui me semble incorrect :\n\n`
          }
        />
      </div>

      {/* Précédent / suivant en cartes plutôt qu'en liens nus : c'est le geste le plus
          fréquent d'une leçon à l'autre, et une cible de 1,5 ligne de texte se rate au
          doigt. Le titre de la leçon visée y est lisible avant le clic. */}
      <nav className="mt-8 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/modules/${id}/${prev.id}`}
            className="card-sand card-link p-4 text-left"
          >
            <span className="eyebrow">← Précédent</span>
            <span className="display mt-1 block text-sm leading-snug">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/modules/${id}/${next.id}`}
            className="card-sand card-link p-4 text-right sm:col-start-2"
          >
            <span className="eyebrow">Suivant →</span>
            <span className="display mt-1 block text-sm leading-snug">{next.title}</span>
          </Link>
        )}
      </nav>
    </main>
  );
}
