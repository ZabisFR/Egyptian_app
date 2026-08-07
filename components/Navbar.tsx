import Link from 'next/link';
import LevelBadge from './LevelBadge';
import { getProfile } from '@/lib/auth';

export default async function Navbar() {
  const profile = await getProfile();

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <Link href="/" className="font-semibold">
          Arabe égyptien
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/modules"
            className="text-neutral-600 hover:underline dark:text-neutral-400"
          >
            Modules
          </Link>
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="text-neutral-600 hover:underline dark:text-neutral-400"
              >
                Tableau de bord
              </Link>
              <Link href="/profile" className="flex items-center gap-2 hover:underline">
                <LevelBadge level={profile.current_level} />
                <span className="hidden text-neutral-600 sm:inline dark:text-neutral-400">
                  {profile.display_name ?? 'Mon profil'}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-neutral-600 hover:underline dark:text-neutral-400"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
