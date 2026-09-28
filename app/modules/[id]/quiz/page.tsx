import { randomInt } from 'node:crypto';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ModuleQuiz from './ModuleQuiz';
import { saveAttempt } from './actions';
import { PASS_THRESHOLD, QUIZ_SIZE } from '@/lib/quiz-scoring';
import { parseSeed, seededShuffle } from '@/lib/shuffle';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Module } from '@/lib/types';
import type { QuizQuestionView } from '@/components/QuizEngine';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('modules')
    .select('title')
    .eq('id', id)
    .maybeSingle<Pick<Module, 'title'>>();

  return { title: data ? `Quiz — ${data.title}` : 'Quiz introuvable' };
}

type Row = {
  id: string;
  question_text: string;
  options: { choices?: string[]; item?: string } | null;
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

  // Sans graine, on en tire une et on redirige : le rendu reste une fonction de l'URL
  // (serveur et hydratation concordent), et chaque arrivée sur le quiz tire une autre
  // sélection dans la banque.
  if (seed === null) redirect(`/modules/${id}/quiz?seed=${randomInt(1, 1_000_000)}`);

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

  // Rejouer un quiz ne doit pas se réduire à mémoriser une séquence : la banque d'un module
  // compte jusqu'à 48 questions, et chaque graine en tire `QUIZ_SIZE`. Le bouton « Refaire »
  // change la graine, donc les questions — pas seulement leur ordre. Déterministe :
  // identique côté serveur et côté client, aucun appel aléatoire pendant le rendu.
  // Un même mot n'est interrogé qu'une fois par tentative, même s'il a deux questions.
  const ordered: Row[] = [];
  const items = new Set<string>();
  for (const q of seededShuffle(playable, seed)) {
    if (ordered.length === QUIZ_SIZE) break;
    const item = q.options?.item;
    if (item && items.has(item)) continue;
    if (item) items.add(item);
    ordered.push(q);
  }

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
      <Link
        href={`/modules/${id}`}
        className="inline-block py-2 text-sm text-[var(--muted)] hover:underline"
      >
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
