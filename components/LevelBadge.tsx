import { LEVEL_TONE } from '@/lib/level-tone';
import type { Level } from '@/lib/types';

/**
 * Le badge « A1 »/« B2 » : une pastille pleine à la couleur du palier, cerclée d'encre.
 * Le couple fond / encre vient de la classe `pop-tone-*` (voir lib/level-tone.ts) et reste
 * donc lisible dans les deux thèmes sans valeur propre au badge.
 */
export default function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border-2 border-[var(--line-strong)] bg-[var(--tone)] px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-[var(--on)] ${
        LEVEL_TONE[level] ?? LEVEL_TONE.REF
      }`}
    >
      {level}
    </span>
  );
}
