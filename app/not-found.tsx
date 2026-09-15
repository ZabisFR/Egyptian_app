import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
};

/**
 * Page 404.
 *
 * Sans ce fichier, Next servait sa page par défaut : fond noir, texte anglais
 * « This page could not be found. », en-tête et thème du site ignorés. Sur un site
 * francophone, c'était l'endroit le plus susceptible de faire croire à une panne.
 *
 * Trois sorties plutôt qu'un simple retour à l'accueil : une URL de leçon périmée est le
 * cas le plus probable ici (un lien partagé, un signet gardé après un réimport du
 * contenu), et le glossaire retrouve le mot cherché bien mieux que la page d'accueil.
 */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-16 text-center sm:px-8">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="display mt-3 text-3xl">Cette page n’existe pas</h1>
      <p className="mt-4 text-[var(--muted)]">
        Le lien est peut-être périmé, ou l’adresse comporte une faute de frappe.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Link href="/modules" className="btn-sand">
          Voir les modules
        </Link>
        <Link href="/glossaire" className="btn-outline">
          Chercher un mot
        </Link>
        <Link href="/" className="btn-outline">
          Accueil
        </Link>
      </div>

      <div className="egypt-rule mt-14">
        <span className="text-xs">◆</span>
      </div>
    </main>
  );
}
