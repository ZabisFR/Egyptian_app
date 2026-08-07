import Link from 'next/link';
import { notFound } from 'next/navigation';
import LessonViewer from '@/components/LessonViewer';
import LessonReadToggle from '@/components/LessonReadToggle';
import { toggleLessonRead } from '../actions';
import { getUser } from '@/lib/auth';
import { getReadLessons } from '@/lib/progress';
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
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link href={`/modules/${id}`} className="text-sm text-[var(--muted)] hover:underline">
        ← Retour au module
      </Link>

      <div className="mt-4">
        <LessonViewer lesson={lesson} vocab={lesson.vocab_items} />
      </div>

      <div className="mt-10 border-t border-[var(--border)] pt-6">
        <LessonReadToggle
          moduleId={id}
          orderIndex={lesson.order_index}
          initialRead={readLessons.has(lesson.order_index)}
          isLoggedIn={!!user}
          onToggle={toggleLessonRead}
        />
      </div>

      <nav className="mt-8 flex flex-col justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm sm:flex-row sm:gap-4">
        {prev ? (
          <Link href={`/modules/${id}/${prev.id}`} className="text-left hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/modules/${id}/${next.id}`} className="text-right hover:underline">
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  );
}
