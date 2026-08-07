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
      <p className="cartouche">Dialecte cairote</p>

      <h1 className="display mt-6 text-4xl leading-tight sm:text-6xl">
        Parler l&apos;arabe du Caire,
        <br />
        pas celui des manuels.
      </h1>

      <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
        Un parcours en {moduleCount} modules et {lessonCount} leçons, de l&apos;alphabet
        jusqu&apos;au débat : le <em>gim</em> égyptien, le <em>qaf</em> qui devient coup de
        glotte, et l&apos;Arabizi que les Égyptiens écrivent vraiment.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/modules" className="btn-sand">
          Commencer
        </Link>
        <Link href="/placement-test" className="btn-outline">
          Tester mon niveau
        </Link>
        <Link
          href="/modules/conjugations-core"
          className="btn-outline border-transparent text-[var(--muted)]"
        >
          Référence verbes
        </Link>
      </div>

      <div className="egypt-rule mt-16">
        <span className="text-xs">◆</span>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-6">
        {[
          ['A1 → B2', 'Progression complète'],
          ['4 niveaux', 'Alphabet au débat'],
          ['Arabizi', 'Comme on écrit vraiment'],
        ].map(([value, label]) => (
          <div key={label}>
            <dt className="display text-xl sm:text-2xl">{value}</dt>
            <dd className="mt-1 text-sm text-[var(--muted)]">{label}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
