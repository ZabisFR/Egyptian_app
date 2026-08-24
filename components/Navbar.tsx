import Link from 'next/link';
import LevelBadge from './LevelBadge';
import NavLink from './NavLink';
import ThemeToggle from './ThemeToggle';
import VocabSearch from './VocabSearch';
import { getProfile } from '@/lib/auth';

export default async function Navbar() {
  const profile = await getProfile();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-md">
      {/* Frise dorée : la bande peinte qui court en haut des stèles. */}
      <div className="frieze" />

      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8 sm:py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          {/*
            Marque : le ʿayn, la lettre qui n'existe pas en français et qui ouvre le mot
            « ʿarabi ». Elle sert déjà d'icône d'écran d'accueil (public/icons) — la
            reprendre ici fait que l'onglet, l'icône iOS et l'en-tête racontent la même
            chose.
          */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.6rem] bg-[var(--lapis)] text-lg leading-none text-[var(--gold)] shadow-[var(--shadow-1)] transition-transform duration-200 group-hover:-rotate-6"
          >
            ع
          </span>
          {/* Le nom disparaît sous 640 px : à 375 px, il ne restait plus assez de place
              pour les liens sans que la barre passe à deux lignes. La marque suffit. */}
          <span className="display hidden text-lg sm:inline">Arabe égyptien</span>
        </Link>

        <div className="flex items-center gap-3.5 text-sm sm:gap-4">
          <VocabSearch />
          <NavLink href="/modules">Modules</NavLink>

          {profile ? (
            <>
              <NavLink href="/daily">Du jour</NavLink>
              {/* Repoussé à 1024 px : à 768 px, la barre de recherche prend la place que
                  ce lien occupait, et la barre passait à deux lignes (mesuré). Le tableau
                  de bord reste atteignable par le lien de profil. */}
              <NavLink href="/dashboard" className="hidden lg:inline">
                Tableau de bord
              </NavLink>
              <ThemeToggle />
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
              >
                <LevelBadge level={profile.current_level} />
                <span className="hidden max-w-28 truncate text-[var(--muted)] sm:inline">
                  {profile.display_name ?? 'Mon profil'}
                </span>
              </Link>
            </>
          ) : (
            <>
              <ThemeToggle />
              {/* Libellé court sous 640 px : avec « Se connecter », la barre dépassait de
                  19 px à 375 px une fois la recherche ajoutée, et le bouton passait à deux
                  lignes — la barre entière gagnait 16 px de hauteur (mesuré). */}
              <Link
                href="/auth/login"
                className="btn-outline shrink-0 whitespace-nowrap px-4 py-2"
              >
                <span className="sm:hidden">Connexion</span>
                <span className="hidden sm:inline">Se connecter</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
