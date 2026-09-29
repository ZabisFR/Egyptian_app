'use client';

import { useState } from 'react';

/**
 * Bandeau de mots égyptiens du quotidien, qui défile sur l'accueil.
 *
 * Un contenu qui bouge seul plus de cinq secondes doit pouvoir être arrêté (WCAG 2.2.2) :
 * bouton pause, et arrêt au survol ou au focus. Sous `prefers-reduced-motion`, il ne
 * défile pas du tout (voir `.pop-marquee` dans globals.css). La copie qui sert à boucler
 * est masquée aux lecteurs d'écran, qui ne lisent les mots qu'une fois.
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
      <span key={`${word}-${hidden}`} className="pop-marquee-word" aria-hidden={hidden || undefined}>
        {word} <span className="pop-marquee-fr">{fr}</span>
        <span className="pop-marquee-star" aria-hidden="true">
          ✦
        </span>
      </span>
    ));

  return (
    <section className="pop-marquee" data-paused={paused || undefined} aria-label="Mots du quotidien">
      <div className="pop-marquee-viewport">
        <div className="pop-marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button
        type="button"
        className="pop-marquee-toggle"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? 'Relancer le défilement' : 'Mettre le défilement en pause'}
      >
        {paused ? '▶' : '❚❚'}
      </button>
    </section>
  );
}
