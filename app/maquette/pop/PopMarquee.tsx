'use client';

import { useState } from 'react';

/**
 * Le bandeau de mots qui défile. Un contenu qui bouge seul plus de cinq secondes doit
 * pouvoir être arrêté (WCAG 2.2.2) : bouton pause, et arrêt au survol ou au focus. Sous
 * `prefers-reduced-motion`, il ne défile pas du tout. La copie qui sert à boucler est
 * masquée aux lecteurs d'écran, qui ne lisent les mots qu'une fois.
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

export default function PopMarquee() {
  const [paused, setPaused] = useState(false);

  const row = (hidden: boolean) =>
    WORDS.map(([word, fr]) => (
      <span key={`${word}-${hidden}`} className="pp-marquee-word" aria-hidden={hidden || undefined}>
        {word} <span className="pp-marquee-fr">{fr}</span>
        <span className="pp-marquee-star" aria-hidden="true">
          ✺
        </span>
      </span>
    ));

  return (
    <section className="pp-marquee" data-paused={paused || undefined} aria-label="Mots du quotidien">
      <div className="pp-marquee-viewport">
        <div className="pp-marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button
        type="button"
        className="pp-marquee-toggle"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? 'Relancer le défilement' : 'Mettre le défilement en pause'}
      >
        {paused ? '▶' : '❚❚'}
      </button>
    </section>
  );
}
