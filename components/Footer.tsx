import Link from 'next/link';
import { feedbackMailto } from '@/lib/site-config';

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
                <Link href="/modules" className="footer-link">
                  Tous les modules
                </Link>
              </li>
              <li>
                <Link
                  href="/placement-test"
                  className="footer-link"
                >
                  Test de niveau
                </Link>
              </li>
              <li>
                <Link
                  href="/modules/conjugations-core"
                  className="footer-link"
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
                <a
                  href={feedbackMailto('Retour sur Arabe égyptien')}
                  className="footer-link"
                >
                  Nous écrire
                </a>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="footer-link"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="footer-link"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Encart de retours : une langue vivante se corrige par ses locuteurs. Un simple
            `mailto:` plutôt qu'un formulaire — un formulaire supposerait un point de
            collecte, donc une ligne de plus dans la politique de confidentialité, pour un
            service que la messagerie du visiteur rend déjà. */}
        <div className="card-sand mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-base">Une coquille, une tournure qui sonne faux ?</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Les retours des locuteurs sont ce qui corrige le contenu. Suggestions de
              modules bienvenues aussi.
            </p>
          </div>
          <a
            href={feedbackMailto(
              'Retour sur Arabe égyptien',
              'Bonjour,\n\nVoici mon retour :\n\n'
            )}
            className="btn-outline shrink-0"
          >
            Envoyer un retour
          </a>
        </div>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Aucun traçage, aucune publicité, aucune mesure d&apos;audience.
        </p>
      </div>
    </footer>
  );
}
