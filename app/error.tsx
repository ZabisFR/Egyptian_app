'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Frontière d'erreur du site.
 *
 * Sans elle, une exception de rendu affichait la page d'erreur brute de Next — en
 * anglais, hors thème, sans aucune issue. Ici, l'apprenant garde l'en-tête, le thème, et
 * surtout un bouton qui retente le rendu : la cause la plus fréquente sur ce site est une
 * requête Supabase qui échoue passagèrement, et un simple nouvel essai suffit alors.
 *
 * `digest` est l'identifiant que Next attribue à l'erreur côté serveur ; c'est la seule
 * chose affichable sans rien divulguer de la pile, et elle permet de retrouver la trace
 * complète dans les journaux Vercel.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur de rendu :', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-16 text-center sm:px-8">
      <p className="eyebrow">Une erreur est survenue</p>
      <h1 className="display mt-3 text-3xl">La page n’a pas pu s’afficher</h1>
      <p className="mt-4 text-[var(--muted)]">
        C’est presque toujours passager. Réessayez : si cela se reproduit, le lien de
        signalement en bas de page nous le fera savoir.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={reset} className="btn-sand">
          Réessayer
        </button>
        <Link href="/modules" className="btn-outline">
          Voir les modules
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-[var(--muted)] tabular">
          Référence de l’incident : {error.digest}
        </p>
      )}
    </main>
  );
}
