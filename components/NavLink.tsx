'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Lien de navigation qui sait s'il est la page courante.
 *
 * Client Component uniquement pour `usePathname()` : la Navbar qui l'utilise reste un
 * Server Component et continue de lire la session côté serveur.
 *
 * `/` est comparé par égalité stricte — avec un simple `startsWith`, l'accueil serait
 * marqué actif sur absolument toutes les pages.
 */
export default function NavLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const active =
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`nav-link ${className}`}
    >
      {children}
    </Link>
  );
}
