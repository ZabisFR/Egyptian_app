import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logout } from '../auth/actions';
import PrivacyControls from './PrivacyControls';
import { deleteMyAccount, exportMyData } from './actions';

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
        <h1 className="display text-3xl">{profile.display_name ?? 'Mon profil'}</h1>
        <LevelBadge level={profile.current_level} />
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {profile.email} · inscrit le {since}
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          ['Niveau', profile.current_level],
          ['XP', profile.xp_points],
          ['Modules terminés', completed ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="card-sand p-4">
            <dd className="display text-2xl leading-none tabular">{value}</dd>
            <dt className="eyebrow mt-2">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/placement-test" className="btn-outline">
          {profile.xp_points === 0
            ? 'Passer le test de positionnement'
            : 'Refaire le test de positionnement'}
        </Link>
        <form action={logout}>
          <button type="submit" className="btn-ghost">
            Se déconnecter
          </button>
        </form>
      </div>

      <PrivacyControls onExport={exportMyData} onDelete={deleteMyAccount} />
    </main>
  );
}
