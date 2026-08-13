import PlacementTest from './PlacementTest';
import { savePlacement } from './actions';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { LEVEL_ORDER } from '@/lib/quiz-scoring';
import type { QuizQuestionView } from '@/components/QuizEngine';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  question_text: string;
  options: { choices: string[] } | null;
  correct_answer: string;
  difficulty: string | null;
};

export default async function PlacementTestPage() {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getUser(),
    supabase
      .from('quiz_questions')
      .select('id, question_text, options, correct_answer, difficulty')
      .is('module_id', null)
      .returns<Row[]>(),
  ]);

  // Ordre A1 → B2 : l'apprenant doit rencontrer les paliers dans l'ordre croissant pour
  // que l'arrêt au premier échec ait du sens.
  const questions: QuizQuestionView[] = (data ?? [])
    .filter((q) => q.options?.choices?.length)
    .sort(
      (a, b) =>
        LEVEL_ORDER.indexOf(a.difficulty as never) -
        LEVEL_ORDER.indexOf(b.difficulty as never)
    )
    .map((q) => ({
      id: q.id,
      question_text: q.question_text,
      choices: q.options!.choices,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty,
    }));

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <h1 className="display text-3xl">Test de positionnement</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {questions.length} questions, de l&apos;alphabet aux formes verbales. Aucune
        préparation nécessaire — répondez au mieux, le but est de situer votre niveau.
      </p>

      <div className="mt-10">
        {questions.length > 0 ? (
          <PlacementTest
            questions={questions}
            isLoggedIn={!!user}
            onComplete={savePlacement}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucune question de positionnement en base. Lancez <code>npm run generate:quiz</code>.
          </p>
        )}
      </div>
    </main>
  );
}
