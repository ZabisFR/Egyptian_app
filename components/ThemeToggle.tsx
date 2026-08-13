'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

/**
 * Le thème n'est pas un état React : c'est un état du DOM (`data-theme` sur `<html>`),
 * posé par le script inline du layout AVANT le premier rendu — sans lui, une page ouverte
 * en thème sombre s'afficherait blanche pendant une frame, le temps que React monte.
 *
 * On le lit donc avec `useSyncExternalStore` plutôt qu'avec un `useState` synchronisé dans
 * un `useEffect` : le composant reste la source de vérité *lecture seule* d'une valeur qui
 * vit ailleurs, il n'y a pas de rendu en cascade au montage, et l'hydratation est propre
 * (le serveur renvoie `null`, puisqu'il ne peut connaître ni le `localStorage` ni la
 * préférence système du visiteur).
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // La préférence système peut changer pendant la visite (bascule automatique au coucher
  // du soleil sur macOS et Android) : sans cet abonnement, l'icône mentirait.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onChange);
  };
}

function readTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  // Stockage local et non cookie : la préférence ne quitte jamais l'appareil, donc rien
  // n'est transmis au serveur à chaque requête (voir /confidentialite).
  try {
    localStorage.setItem('theme', next);
  } catch {
    // Navigation privée ou stockage refusé : la bascule reste valable pour la session.
  }
  // `localStorage` n'émet d'événement que vers les AUTRES onglets : c'est à nous de
  // prévenir celui-ci.
  listeners.forEach((notify) => notify());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);
  const goingDark = theme !== 'dark';

  return (
    <button
      type="button"
      onClick={() => applyTheme(goingDark ? 'dark' : 'light')}
      aria-label={
        theme === null
          ? 'Changer de thème'
          : goingDark
            ? 'Passer au thème sombre'
            : 'Passer au thème clair'
      }
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] hover:text-[var(--ink)]"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {goingDark ? (
          // Croissant : la nuit du désert.
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        ) : (
          // Disque solaire et ses rayons — Rê, mais dessiné au trait pour rester sobre.
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
