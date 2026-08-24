'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Met en évidence l'élément désigné par le fragment de l'URL (`#mot-<id>`).
 *
 * Pourquoi pas simplement `:target` en CSS — c'était la première version, et elle ne
 * marchait qu'en arrivant par une URL collée dans la barre d'adresse. Après une navigation
 * côté client, Next pose le fragment via l'History API : la page défile bien jusqu'à
 * l'élément, mais le navigateur ne recalcule pas l'élément « ciblé », et `:target` ne
 * correspond à rien. Mesuré : `element.matches(':target')` renvoyait `false` alors que le
 * défilement, lui, avait bien eu lieu.
 *
 * On pose donc la classe à la main, sur montage et à chaque changement de fragment.
 */
export default function HashHighlight() {
  const pathname = usePathname();

  useEffect(() => {
    let minuteur: ReturnType<typeof setTimeout> | undefined;

    function surligner() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const cible = document.getElementById(id);
      if (!cible) return;

      cible.classList.add('mot-cible');
      // Recentrage : le défilement natif place l'ancre juste sous la barre collante,
      // au bord de l'écran. Au centre, le mot est lisible avec son contexte.
      cible.scrollIntoView({ block: 'center' });

      // Retrait par minuteur et non sur `animationend` : en mouvement réduit, la garde
      // globale ramène toutes les animations à 0,01 ms, `animationend` se déclencherait
      // immédiatement et l'utilisateur perdrait le repère avant de l'avoir vu.
      minuteur = setTimeout(() => cible.classList.remove('mot-cible'), 2600);
    }

    surligner();
    window.addEventListener('hashchange', surligner);
    return () => {
      window.removeEventListener('hashchange', surligner);
      if (minuteur) clearTimeout(minuteur);
    };
  }, [pathname]);

  return null;
}
