import type { Level } from '@/lib/types';

const STYLES: Record<Level, string> = {
  A1: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  A2: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  B1: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  B2: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  REF: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

export default function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
        STYLES[level] ?? STYLES.REF
      }`}
    >
      {level}
    </span>
  );
}
