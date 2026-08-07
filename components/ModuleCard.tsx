import Link from 'next/link';
import LevelBadge from './LevelBadge';
import type { Module, ModuleStatus } from '@/lib/types';

const STATUS_LABEL: Record<ModuleStatus, string | null> = {
  locked: 'Verrouillé',
  not_started: null,
  in_progress: 'En cours',
  completed: 'Terminé',
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
  const label =
    status === 'in_progress' && lessonsRead > 0
      ? `${lessonsRead}/${lessonCount} leçons lues`
      : STATUS_LABEL[status];

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display text-lg leading-snug">
          {module.order_index < 99 && (
            <span className="mr-2 text-[var(--gold)]">{module.number}.</span>
          )}
          {module.title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {status === 'completed' && (
            <span className="text-[var(--gold)]" title="Module terminé">
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
        {label && ` · ${label}`}
      </p>
    </>
  );

  if (status === 'locked') {
    return (
      <div aria-disabled="true" className="card-sand block cursor-not-allowed p-4 opacity-50">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/modules/${module.id}`}
      className="card-sand relative block overflow-hidden p-4 pl-5 transition-colors hover:bg-[color-mix(in_srgb,var(--gold)_8%,transparent)]"
    >
      {/* Filet vertical doré, plein quand le module est terminé : le statut se lit au bord
          de la carte sans avoir à parcourir le texte. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${
          status === 'completed'
            ? 'bg-[var(--gold)]'
            : status === 'in_progress'
              ? 'bg-[color-mix(in_srgb,var(--gold)_40%,transparent)]'
              : 'bg-transparent'
        }`}
      />
      {body}
    </Link>
  );
}
