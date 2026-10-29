'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuizEngine, { type QuizQuestionView } from '@/components/QuizEngine';
import ListeningResult from '@/components/ListeningResult';

/** Enrobe `QuizEngine` pour l'entraînement d'écoute : rien n'est enregistré. */
export default function ListeningSession({
  theme,
  questions,
}: {
  theme: string | null;
  questions: QuizQuestionView[];
}) {
  const router = useRouter();

  return (
    <QuizEngine
      questions={questions}
      renderResult={(result) => (
        <ListeningResult title="À l’oreille" result={result} questions={questions}>
          {/* Graine tirée dans le gestionnaire de clic, jamais pendant le rendu. */}
          <button
            type="button"
            onClick={() => {
              const query = new URLSearchParams({ seed: String(Math.floor(Math.random() * 1_000_000)) });
              if (theme) query.set('theme', theme);
              router.push(`/entrainement/ecoute?${query}`);
            }}
            className="btn-sand"
          >
            Nouvelle série
          </button>
          <Link href="/entrainement" className="btn-outline">
            Changer d’exercice
          </Link>
        </ListeningResult>
      )}
    />
  );
}
