'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Les quatre sons de l'Arabizi en autocollants (l'idée de la maquette Pop), jouables au
 * clic comme sur l'accueil actuel. Mêmes fichiers que le module 01 : rien n'est
 * téléchargé tant qu'on n'a pas cliqué.
 */

const SOUNDS = [
  { letter: 'ع', digit: '3', name: '3ayn', src: '/audio/alphabet/ayn.mp3', tone: 0 },
  { letter: 'ح', digit: '7', name: '7a', src: '/audio/alphabet/7a.mp3', tone: 1 },
  { letter: 'خ', digit: '5', name: 'kha', src: '/audio/alphabet/kha.mp3', tone: 2 },
  { letter: 'ق', digit: '2', name: '2af', src: '/audio/alphabet/qaf.mp3', tone: 3 },
];

export default function SoundStickers() {
  const [playing, setPlaying] = useState<string | null>(null);
  const current = useRef<HTMLAudioElement | null>(null);

  // Quitter la page pendant une lecture ne doit pas laisser le son continuer.
  useEffect(() => () => current.current?.pause(), []);

  function play(src: string) {
    current.current?.pause();
    const audio = new Audio(src);
    current.current = audio;
    setPlaying(src);
    audio.addEventListener('ended', () => setPlaying((p) => (p === src ? null : p)));
    audio.play().catch(() => setPlaying(null));
  }

  return (
    <ul className="mx-stickers">
      {SOUNDS.map((s, i) => (
        <li key={s.digit} style={{ '--i': i } as React.CSSProperties}>
          <button
            type="button"
            className="mx-sticker"
            data-tone={s.tone}
            data-playing={playing === s.src || undefined}
            onClick={() => play(s.src)}
            aria-label={`Écouter le son ${s.name}, la lettre ${s.letter}, qu’on écrit ${s.digit} en Arabizi`}
          >
            <span className="mx-sticker-letter conte-kufi" aria-hidden="true">
              {s.letter}
            </span>
            <span className="mx-sticker-digit" aria-hidden="true">
              {s.digit}
            </span>
            <span className="mx-sticker-play" aria-hidden="true">
              {playing === s.src ? '♪' : '▶'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
