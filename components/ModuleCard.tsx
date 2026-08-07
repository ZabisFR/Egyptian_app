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
        <h2 className="font-semibold">
          {module.order_index < 99 && (
            <span className="mr-2 text-neutral-400">{module.number}.</span>
          )}
          {module.title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {status === 'completed' && (
            <span className="text-emerald-600 dark:text-emerald-400" title="Module terminé">
              ✓
            </span>
          )}
          <LevelBadge level={module.level} />
        </div>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {module.subtitle}
        {module.subtitle && ' · '}
        {lessonCount} leçons
        {label && ` · ${label}`}
      </p>
    </>
  );

  if (status === 'locked') {
    return (
      <div
        aria-disabled="true"
        className="block cursor-not-allowed rounded-lg border border-neutral-200 p-4 opacity-50 dark:border-neutral-800"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/modules/${module.id}`}
      className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
    >
      {body}
    </Link>
  );
}
