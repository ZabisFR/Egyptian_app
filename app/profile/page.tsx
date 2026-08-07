import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logout } from '../auth/actions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count: completed } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'completed');

  const since = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-bold">{profile.display_name ?? 'Mon profil'}</h1>
        <LevelBadge level={profile.current_level} />
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        {profile.email} · inscrit le {since}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          ['Niveau', profile.current_level],
          ['XP', profile.xp_points],
          ['Modules terminés', completed ?? 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <dt className="text-xs uppercase tracking-wide text-neutral-400">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/placement-test"
        className="mt-6 inline-block text-sm text-neutral-600 underline dark:text-neutral-400"
      >
        {profile.xp_points === 0 ? 'Passer le test de positionnement' : 'Refaire le test de positionnement'}
      </Link>

      <p className="mt-6 text-sm text-neutral-500">
        La progression par module arrivera avec les quiz de modules.
      </p>

      <form action={logout} className="mt-10">
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
