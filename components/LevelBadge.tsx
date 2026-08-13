import type { Level } from '@/lib/types';

/**
 * Les niveaux sont présentés en cartouche — l'ovale qui isole un nom royal sur les
 * inscriptions. Chaque palier garde une couleur du nuancier égyptien plutôt qu'un dégradé
 * vert-à-rouge, qui suggérerait à tort qu'un niveau haut est un danger.
 *
 * Les couleurs de texte sont fixées par palier et par thème (variables `--badge-*`) plutôt
 * que dérivées du pigment par `color-mix` : la dérivation produisait 3,5:1 pour le B1 en
 * thème clair et 4,4:1 pour le A2 en sombre, tous deux sous le seuil AA de 4,5:1. Les
 * valeurs ci-dessous sont mesurées contre le fond teinté réel de chaque badge.
 */
const STYLES: Record<Level, string> = {
  A1: 'border-[color-mix(in_srgb,var(--lapis)_45%,transparent)] bg-[color-mix(in_srgb,var(--lapis)_12%,transparent)] text-[var(--badge-a1)]',
  A2: 'border-[color-mix(in_srgb,var(--badge-a2)_45%,transparent)] bg-[color-mix(in_srgb,var(--badge-a2)_12%,transparent)] text-[var(--badge-a2)]',
  B1: 'border-[color-mix(in_srgb,var(--gold)_50%,transparent)] bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[var(--badge-b1)]',
  B2: 'border-[color-mix(in_srgb,var(--carmine)_45%,transparent)] bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] text-[var(--badge-b2)]',
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
