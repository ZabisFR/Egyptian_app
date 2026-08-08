import Link from 'next/link';
import LevelBadge from './LevelBadge';
import { getProfile } from '@/lib/auth';

export default async function Navbar() {
  const profile = await getProfile();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur">
      {/* Frise dorée : la bande qui court en haut des stèles. Deux pixels suffisent à
          poser le registre égyptien sans charger chaque page d'ornements. */}
      <div className="h-0.5 bg-gradient-to-r from-[var(--carmine)] via-[var(--gold)] to-[var(--lapis)]" />
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <Link href="/" className="display text-lg">
          Arabe égyptien
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/modules"
            className="text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
          >
            Modules
          </Link>
          {profile ? (
            <>
              <Link
                href="/daily"
                className="text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
              >
                Du jour
              </Link>
              <Link
                href="/dashboard"
                className="hidden text-[var(--muted)] hover:text-[var(--ink)] hover:underline sm:inline"
              >
                Tableau de bord
              </Link>
              <Link href="/profile" className="flex items-center gap-2 hover:underline">
                <LevelBadge level={profile.current_level} />
                <span className="hidden text-[var(--muted)] sm:inline">
                  {profile.display_name ?? 'Mon profil'}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
