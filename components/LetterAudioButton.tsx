'use client';

import { useRef, useState } from 'react';

// Une seule lecture à la fois : au niveau module (pas React state), on garde une
// référence vers l'audio actif et le callback qui remet son bouton en état "arrêté".
// Cliquer sur une autre lettre coupe la précédente et corrige son icône au passage.
let activeAudio: HTMLAudioElement | null = null;
let activeStop: (() => void) | null = null;

export default function LetterAudioButton({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <button
      type="button"
      aria-label={`Écouter la prononciation de ${label}`}
      onClick={() => {
        if (!audioRef.current) {
          const audio = new Audio(src);
          audio.onended = () => {
            setPlaying(false);
            if (activeAudio === audio) {
              activeAudio = null;
              activeStop = null;
            }
          };
          audioRef.current = audio;
        }
        const audio = audioRef.current;
        const isThisOneActive = activeAudio === audio;

        if (activeAudio && activeAudio !== audio) {
          activeAudio.pause();
          activeStop?.();
        }

        if (isThisOneActive && playing) {
          audio.pause();
          setPlaying(false);
          activeAudio = null;
          activeStop = null;
          return;
        }

        audio.currentTime = 0;
        activeAudio = audio;
        activeStop = () => setPlaying(false);
        setPlaying(true);
        audio.play().catch(() => setPlaying(false));
      }}
      className="group ml-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center align-middle"
    >
      {/*
        Le bouton lui-même fait 40x40 — la zone de clic recommandée pour le tactile —
        mais seul ce cercle intérieur, plus petit, est visible : sinon la table de
        l'alphabet paraîtrait truffée de gros ronds dorés au lieu d'un simple repère audio.
      */}
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)] text-[11px] leading-none text-[var(--gold)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--gold)_15%,transparent)] group-active:bg-[color-mix(in_srgb,var(--gold)_25%,transparent)] ${
          playing ? 'bg-[color-mix(in_srgb,var(--gold)_20%,transparent)]' : ''
        }`}
      >
        {playing ? '❚❚' : '▶'}
      </span>
    </button>
  );
}
