import Link from 'next/link';
import { notFound } from 'next/navigation';
import ModuleQuiz from './ModuleQuiz';
import { saveAttempt } from './actions';
import { PASS_THRESHOLD } from '@/lib/quiz-scoring';
import { parseSeed, seededShuffle } from '@/lib/shuffle';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Module } from '@/lib/types';
import type { QuizQuestionView } from '@/components/QuizEngine';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  question_text: string;
  options: { choices?: string[] } | null;
  correct_answer: string;
  difficulty: string | null;
};

export default async function ModuleQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seed?: string | string[] }>;
}) {
  const { id } = await params;
  const seed = parseSeed((await searchParams).seed);
  const supabase = await createClient();

  const [user, { data: mod }, { data: rows }] = await Promise.all([
    getUser(),
    supabase.from('modules').select('*').eq('id', id).maybeSingle<Module>(),
    supabase
      .from('quiz_questions')
      .select('id, question_text, options, correct_answer, difficulty')
      .eq('module_id', id)
      .returns<Row[]>(),
  ]);

  if (!mod) notFound();

  // Les questions de compréhension écrites à la main n'ont pas de `choices` : elles ne
  // sont pas jouables par le moteur de QCM et sont écartées ici.
  const playable = (rows ?? []).filter((q) => q.options?.choices?.length);

  // Rejouer un quiz ne doit pas se réduire à mémoriser une séquence : le bouton
  // « Refaire » ajoute une graine à l'URL, et l'ordre est recalculé à partir d'elle.
  // Déterministe, donc identique côté serveur et côté client — pas de désynchronisation
  // à l'hydratation, et aucun appel aléatoire pendant le rendu.
  const ordered = seed === null ? playable : seededShuffle(playable, seed);

  const questions: QuizQuestionView[] = ordered.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    choices: q.options!.choices!,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty,
  }));

  async function onComplete(result: Parameters<typeof saveAttempt>[1]) {
    'use server';
    await saveAttempt(id, result);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <Link href={`/modules/${id}`} className="text-sm text-[var(--muted)] hover:underline">
        ← Retour au module
      </Link>

      <h1 className="display mt-4 text-3xl">Quiz — {mod.title}</h1>

      <div className="mt-10">
        {questions.length > 0 ? (
          <ModuleQuiz
            moduleId={id}
            moduleTitle={mod.title}
            questions={questions}
            isLoggedIn={!!user}
            passThreshold={PASS_THRESHOLD}
            onComplete={onComplete}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucune question pour ce module. Lancez <code>npm run generate:quiz</code>.
          </p>
        )}
      </div>
    </main>
  );
}
