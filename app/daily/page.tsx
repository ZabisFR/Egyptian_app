import Link from 'next/link';
import DailyReview from './DailyReview';
import { saveDailyReview } from './actions';
import { requireProfile } from '@/lib/auth';
import { getDailyLesson, DAILY_MIN_POOL } from '@/lib/daily';
import { getStreak } from '@/lib/streak';
import StreakBadge from '@/components/StreakBadge';

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const profile = await requireProfile();
  const [daily, streak] = await Promise.all([
    getDailyLesson(profile.id),
    getStreak(profile.id),
  ]);

  const formattedDate = new Date(`${daily.date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="cartouche">Leçon du jour</p>
        <StreakBadge streak={streak} size="sm" />
      </div>
      <h1 className="display mt-4 text-3xl first-letter:uppercase sm:text-4xl">
        {formattedDate}
      </h1>

      {daily.questions.length === 0 ? (
        <div className="card-sand mt-8 p-6">
          <h2 className="display text-xl">Rien à réviser pour l&apos;instant</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {daily.lessonsRead === 0
              ? "La leçon du jour se compose à partir des leçons que vous avez marquées comme lues. Lisez-en une et cochez-la : elle alimentera la révision de demain."
              : `Vos leçons lues ne contiennent que ${daily.poolSize} mot${daily.poolSize > 1 ? 's' : ''} exploitable${daily.poolSize > 1 ? 's' : ''}, il en faut au moins ${DAILY_MIN_POOL} pour construire un QCM.`}
          </p>
          <Link href="/modules" className="btn-sand mt-6">
            Aller aux modules
          </Link>
        </div>
      ) : daily.alreadyDone ? (
        <div className="card-sand mt-8 p-6">
          <h2 className="display text-xl">Déjà faite aujourd&apos;hui</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Vous avez obtenu {daily.lastScore} % sur la révision du jour. Une nouvelle
            sélection sera tirée demain — c&apos;est l&apos;espacement qui fait tenir le
            vocabulaire, pas la répétition dans la même journée.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/modules" className="btn-sand">
              Continuer un module
            </Link>
            <Link href="/dashboard" className="btn-outline">
              Tableau de bord
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {daily.questions.length} mots tirés de vos {daily.lessonsRead} leçons lues, sur
            un vivier de {daily.poolSize}.
          </p>
          <div className="mt-10">
            <DailyReview
              questions={daily.questions}
              initialStreak={streak}
              onComplete={saveDailyReview}
            />
          </div>
        </>
      )}
    </main>
  );
}
