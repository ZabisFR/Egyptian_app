import Link from 'next/link';
import { notFound } from 'next/navigation';
import ModuleQuiz from './ModuleQuiz';
import { saveAttempt } from './actions';
import { PASS_THRESHOLD } from '@/lib/quiz-scoring';
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Ordre tiré au sort à chaque tentative : rejouer le quiz ne doit pas se réduire à
  // mémoriser une séquence.
  const questions: QuizQuestionView[] = playable
    .map((q) => ({ q, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ q }) => ({
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
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link href={`/modules/${id}`} className="text-sm text-neutral-500 hover:underline">
        ← Retour au module
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Quiz — {mod.title}</h1>

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
          <p className="text-sm text-neutral-500">
            Aucune question pour ce module. Lancez <code>npm run generate:quiz</code>.
          </p>
        )}
      </div>
    </main>
  );
}
