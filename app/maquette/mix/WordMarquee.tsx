'use client';

import { useState } from 'react';

/**
 * Bandeau de mots égyptiens qui défile (l'idée de la maquette Pop).
 *
 * Un contenu qui bouge seul plus de cinq secondes doit pouvoir être arrêté (WCAG 2.2.2) :
 * d'où le bouton pause, et l'arrêt au survol. Sous `prefers-reduced-motion`, le bandeau
 * ne défile pas du tout (voir mix.css). Les mots sont lisibles par les lecteurs d'écran
 * une seule fois : la copie qui sert à boucler est masquée.
 */

const WORDS = [
  ['Ahlan', 'bonjour'],
  ['Yalla', 'allez !'],
  ['Mashi', 'd’accord'],
  ['Habibi', 'mon cher'],
  ['Shokran', 'merci'],
  ['Tamam', 'parfait'],
  ['Ma3lesh', 'pas grave'],
  ['Khalas', 'c’est fini'],
];

export default function WordMarquee() {
  const [paused, setPaused] = useState(false);

  const row = (hidden: boolean) =>
    WORDS.map(([word, fr]) => (
      <span key={`${word}-${hidden}`} className="mx-word" aria-hidden={hidden || undefined}>
        <strong>{word}</strong> <span className="mx-word-fr">{fr}</span>
        <span className="mx-word-star" aria-hidden="true">
          ✦
        </span>
      </span>
    ));

  return (
    <section className="mx-marquee" data-paused={paused || undefined} aria-label="Mots du quotidien">
      <div className="mx-marquee-viewport">
        <div className="mx-marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button
        type="button"
        className="mx-marquee-toggle"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? 'Relancer le défilement' : 'Mettre le défilement en pause'}
      >
        {paused ? '▶' : '❚❚'}
      </button>
    </section>
  );
}
