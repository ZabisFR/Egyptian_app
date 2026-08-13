import Link from 'next/link';
import LevelBadge from './LevelBadge';
import type { Level, Module, ModuleStatus } from '@/lib/types';

const STATUS_LABEL: Record<ModuleStatus, string | null> = {
  locked: 'Verrouillé',
  not_started: null,
  in_progress: 'En cours',
  completed: 'Terminé',
};

/**
 * Le filet vertical prend la couleur du niveau, pas du statut.
 *
 * Sur une liste de quinze modules, c'est ce qui permet de voir d'un coup d'œil où finit
 * le A1 et où commence le A2 — une information qu'aucune lecture de titre ne donne. Le
 * statut, lui, se lit à la barre de progression et au badge en bout de ligne.
 */
const LEVEL_ACCENT: Record<Level, string> = {
  A1: 'var(--lapis)',
  A2: 'var(--malachite)',
  B1: 'var(--gold)',
  B2: 'var(--carmine)',
  REF: 'var(--muted)',
};

export default function ModuleCard({
  module,
  lessonCount,
  status = 'not_started',
  lessonsRead = 0,
}: {
  module: Module;
  lessonCount: number;
  status?: ModuleStatus;
  lessonsRead?: number;
}) {
  const accent = LEVEL_ACCENT[module.level] ?? LEVEL_ACCENT.REF;
  const started = lessonsRead > 0;
  const pct = lessonCount === 0 ? 0 : Math.round((lessonsRead / lessonCount) * 100);
  const isNumbered = module.order_index < 99;

  const body = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent, opacity: status === 'completed' ? 1 : 0.42 }}
      />

      <div className="flex items-start gap-3">
        {isNumbered && (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
              background: `color-mix(in srgb, ${accent} 10%, transparent)`,
              color: 'var(--ink)',
            }}
          >
            {module.number}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="display text-lg leading-snug">{module.title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {status === 'completed' && (
                <span
                  className="text-[var(--malachite-text)]"
                  title="Module terminé"
                  aria-label="Module terminé"
                >
                  ✓
                </span>
              )}
              <LevelBadge level={module.level} />
            </div>
          </div>

          <p className="mt-1 text-sm text-[var(--muted)]">
            {module.subtitle}
            {module.subtitle && ' · '}
            {lessonCount} leçons
            {!started && STATUS_LABEL[status] && ` · ${STATUS_LABEL[status]}`}
          </p>

          {/* La piste n'apparaît qu'une fois le module entamé : quinze barres à zéro sur
              la page d'accueil des modules ressemblent à un échec, pas à un départ. */}
          {started && (
            <div className="mt-3 flex items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: accent }}
                />
              </span>
              <span className="shrink-0 text-xs text-[var(--muted)] tabular">
                {lessonsRead}/{lessonCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (status === 'locked') {
    return (
      <div
        aria-disabled="true"
        className="card-sand relative block cursor-not-allowed overflow-hidden p-4 pl-5 opacity-50"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/modules/${module.id}`}
      className="card-sand card-link group relative block overflow-hidden p-4 pl-5"
    >
      {body}
    </Link>
  );
}
