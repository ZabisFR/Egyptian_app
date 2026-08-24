'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchVocab, type VocabHit } from '@/lib/search';

/**
 * Recherche de vocabulaire, accessible depuis toutes les pages.
 *
 * Pourquoi une palette et non un champ posé en permanence dans la barre : mesurée à
 * 375 px, la barre de navigation ne laisse qu'une soixantaine de pixels libres une fois
 * la marque, les liens, la bascule de thème et le badge de niveau placés. Un champ y
 * serait illisible, et le faire basculer sur une deuxième ligne mangerait 11 % de la
 * hauteur d'écran en permanence, sur une barre déjà collante. Le déclencheur prend donc
 * la place d'une icône sur mobile, celle d'un champ à partir de 640 px, et ouvre dans les
 * deux cas la même palette — qui a, elle, toute la place d'afficher les traductions.
 *
 * L'index (422 mots) n'est téléchargé qu'à la première ouverture, puis gardé en mémoire :
 * tant que personne ne cherche, la fonctionnalité ne coûte pas un octet.
 */
export default function VocabSearch() {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [index, setIndex] = useState<VocabHit[] | null>(null);
  const [etat, setEtat] = useState<'repos' | 'chargement' | 'erreur'>('repos');
  const [actif, setActif] = useState(0);

  const champRef = useRef<HTMLInputElement>(null);
  const declencheurRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const resultats = index ? searchVocab(index, requete) : [];

  function chargerIndex() {
    setEtat('chargement');
    fetch('/api/vocab')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: VocabHit[]) => {
        setIndex(data);
        setEtat('repos');
      })
      .catch(() => setEtat('erreur'));
  }

  // Le chargement part du geste d'ouverture et non d'un effet : appeler setState
  // directement dans le corps d'un effet déclenche un rendu en cascade au montage.
  function ouvrir() {
    setOuvert(true);
    setActif(0);
    if (!index && etat !== 'chargement') chargerIndex();
  }

  function fermer() {
    setOuvert(false);
    setRequete('');
    setActif(0);
    declencheurRef.current?.focus();
  }

  // Raccourcis globaux. « / » est la convention des sites de documentation ; on l'ignore
  // si le focus est déjà dans un champ, sinon taper une barre oblique dans un formulaire
  // ouvrirait la recherche.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      const dansUnChamp =
        cible instanceof HTMLInputElement ||
        cible instanceof HTMLTextAreaElement ||
        cible?.isContentEditable;

      if (!ouvert && !dansUnChamp && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k'))) {
        e.preventDefault();
        ouvrir();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Focus dans le champ à l'ouverture, et blocage du défilement de l'arrière-plan : sans
  // lui, faire défiler la liste de résultats fait aussi défiler la page derrière.
  useEffect(() => {
    if (!ouvert) return;
    champRef.current?.focus();
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  function allerA(hit: VocabHit) {
    setOuvert(false);
    setRequete('');
    // L'ancre `#mot-<id>` cible la fiche du mot en bas de la leçon, qui se met en
    // évidence via `:target` (voir globals.css) : sans elle, on atterrit en haut d'une
    // leçon de 2 000 mots sans savoir où regarder.
    router.push(`/modules/${hit.m}/${hit.l}#mot-${hit.i}`);
  }

  function onChampKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActif((i) => (resultats.length ? (i + 1) % resultats.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActif((i) => (resultats.length ? (i - 1 + resultats.length) % resultats.length : 0));
      return;
    }
    if (e.key === 'Enter' && resultats[actif]) {
      e.preventDefault();
      allerA(resultats[actif]);
    }
  }

  return (
    <>
      <button
        ref={declencheurRef}
        type="button"
        onClick={ouvrir}
        aria-label="Rechercher un mot"
        className="search-trigger"
      >
        <LoupeIcon />
        <span className="hidden md:inline">Rechercher un mot</span>
        <kbd className="ml-auto hidden rounded border border-[var(--border)] px-1.5 text-[10px] leading-[1.4] md:inline">
          /
        </kbd>
      </button>

      {/*
        Portail obligatoire, et pas seulement élégant : la barre de navigation porte un
        `backdrop-filter`, et un filtre fait de l'élément un BLOC CONTENEUR pour ses
        descendants en `position: fixed`. Rendu sur place, l'overlay se retrouvait donc
        contraint aux 88 px de hauteur de la barre — mesuré — et le panneau s'écrasait à
        2 px. Monté sur `document.body`, il retrouve le viewport entier.

        Le portail n'est créé que si `ouvert` est vrai, état qui ne peut venir que d'un
        clic : le rendu serveur ne touche donc jamais à `document`.
      */}
      {ouvert &&
        createPortal(
        <div className="search-overlay" onMouseDown={fermer}>
          {/* `onMouseDown` sur le fond et `stopPropagation` sur le panneau : avec un
              `onClick`, un glisser commencé dans le champ et relâché sur le fond fermait
              la palette en pleine sélection de texte. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Rechercher un mot"
            className="search-panel"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="search-field">
              <LoupeIcon />
              <input
                ref={champRef}
                type="text"
                value={requete}
                onChange={(e) => {
                  setRequete(e.target.value);
                  setActif(0);
                }}
                onKeyDown={onChampKeyDown}
                placeholder="Un mot en français, en arabe ou en Arabizi…"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-expanded={resultats.length > 0}
                aria-controls="search-results"
                aria-activedescendant={resultats[actif] ? `mot-option-${actif}` : undefined}
                className="search-input"
              />
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer la recherche"
                className="shrink-0 rounded-full px-2 py-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Échap
              </button>
            </div>

            <div id="search-results" role="listbox" aria-label="Résultats">
              {etat === 'chargement' && (
                <p className="px-4 py-6 text-sm text-[var(--muted)]">Chargement du lexique…</p>
              )}

              {etat === 'erreur' && (
                <p className="px-4 py-6 text-sm text-[var(--carmine-text)]">
                  Le lexique n&apos;a pas pu être chargé. Vérifiez votre connexion et
                  réessayez.
                </p>
              )}

              {etat === 'repos' && requete.trim() === '' && (
                <p className="px-4 py-6 text-sm text-[var(--muted)]">
                  {index ? (
                    <>
                      {index.length} mots indexés. Tapez « bokra », « demain » ou « بكرة » —
                      ou parcourez le{' '}
                      <Link
                        href="/glossaire"
                        onClick={() => setOuvert(false)}
                        className="text-[var(--lapis-text)] underline"
                      >
                        glossaire complet
                      </Link>
                      .
                    </>
                  ) : (
                    'Tapez pour chercher.'
                  )}
                </p>
              )}

              {etat === 'repos' && requete.trim() !== '' && resultats.length === 0 && (
                <p className="px-4 py-6 text-sm text-[var(--muted)]">
                  Aucun mot ne correspond à « {requete.trim()} ».
                </p>
              )}

              <ul>
                {resultats.map((hit, i) => (
                  <li key={hit.i}>
                    <Link
                      id={`mot-option-${i}`}
                      role="option"
                      aria-selected={i === actif}
                      href={`/modules/${hit.m}/${hit.l}#mot-${hit.i}`}
                      onClick={() => {
                        setOuvert(false);
                        setRequete('');
                      }}
                      onMouseEnter={() => setActif(i)}
                      className={`search-result ${i === actif ? 'search-result-active' : ''}`}
                    >
                      <span className="arabic shrink-0 text-right leading-none" dir="rtl">
                        {hit.a ?? '—'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          <span className="font-semibold">{hit.t}</span>
                          <span className="text-[var(--muted)]"> — {hit.f}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                          {hit.d !== null ? `Jour ${hit.d} · ` : ''}
                          {hit.lt}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}

function LoupeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
