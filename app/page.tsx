import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ count: moduleCount }, { count: lessonCount }] = await Promise.all([
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Parler l&apos;arabe du Caire,
        <br />
        pas celui des manuels.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        Un parcours en {moduleCount} modules et {lessonCount} leçons, de l&apos;alphabet
        jusqu&apos;au débat : le <em>gim</em> égyptien, le <em>qaf</em> qui devient coup de
        glotte, et l&apos;Arabizi que les Égyptiens écrivent vraiment.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/modules"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Commencer
        </Link>
        <Link
          href="/placement-test"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Tester mon niveau
        </Link>
        <Link
          href="/modules/conjugations-core"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Référence verbes
        </Link>
      </div>

      <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-neutral-200 pt-8 dark:border-neutral-800">
        {[
          ['A1 → B2', 'Progression complète'],
          ['4 niveaux', 'Alphabet au débat'],
          ['Dialecte cairote', 'Pas de littéral'],
        ].map(([value, label]) => (
          <div key={label}>
            <dt className="text-xl font-semibold">{value}</dt>
            <dd className="mt-1 text-sm text-neutral-500">{label}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
