import type { Level } from '@/lib/types';

/**
 * Les niveaux sont présentés en cartouche — l'ovale qui isole un nom royal sur les
 * inscriptions. Chaque palier garde une couleur du nuancier égyptien plutôt qu'un dégradé
 * vert-à-rouge, qui suggérerait à tort qu'un niveau haut est un danger.
 */
const STYLES: Record<Level, string> = {
  A1: 'border-[color-mix(in_srgb,var(--lapis)_45%,transparent)] bg-[color-mix(in_srgb,var(--lapis)_12%,transparent)] text-[color-mix(in_srgb,var(--lapis)_80%,var(--ink))]',
  A2: 'border-[color-mix(in_srgb,#2e7d74_45%,transparent)] bg-[color-mix(in_srgb,#2e7d74_12%,transparent)] text-[color-mix(in_srgb,#2e7d74_85%,var(--ink))]',
  B1: 'border-[color-mix(in_srgb,var(--gold)_50%,transparent)] bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[color-mix(in_srgb,var(--gold)_80%,var(--ink))]',
  B2: 'border-[color-mix(in_srgb,var(--carmine)_45%,transparent)] bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] text-[color-mix(in_srgb,var(--carmine)_85%,var(--ink))]',
  REF: 'border-[var(--border)] bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] text-[var(--muted)]',
};

export default function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        STYLES[level] ?? STYLES.REF
      }`}
    >
      {level}
    </span>
  );
}
