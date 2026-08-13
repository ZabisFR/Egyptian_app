import Link from 'next/link';

// Les mentions légales et la politique de confidentialité doivent être accessibles depuis
// toutes les pages : c'est une obligation d'accessibilité de l'information (LCEN art. 6),
// pas un simple confort de navigation.
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <div className="egypt-rule">
          <span className="text-xs">◆</span>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="display text-base">Arabe égyptien</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              Le dialecte qu&apos;on parle au Caire, appris comme on apprend une langue
              vivante : par l&apos;oreille, l&apos;usage et la répétition.
            </p>
          </div>

          <nav aria-label="Apprendre">
            <p className="eyebrow">Apprendre</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/modules" className="text-[var(--muted)] hover:text-[var(--ink)]">
                  Tous les modules
                </Link>
              </li>
              <li>
                <Link
                  href="/placement-test"
                  className="text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Test de niveau
                </Link>
              </li>
              <li>
                <Link
                  href="/modules/conjugations-core"
                  className="text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Référence verbes
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Informations légales">
            <p className="eyebrow">Le site</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Aucun traçage, aucune publicité, aucune mesure d&apos;audience.
        </p>
      </div>
    </footer>
  );
}
