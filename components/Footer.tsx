import Link from 'next/link';

// Les mentions légales et la politique de confidentialité doivent être accessibles depuis
// toutes les pages : c'est une obligation d'accessibilité de l'information (LCEN art. 6),
// pas un simple confort de navigation.
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Arabe égyptien — apprendre le dialecte cairote</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/mentions-legales" className="hover:text-[var(--ink)] hover:underline">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-[var(--ink)] hover:underline">
            Confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  );
}
