'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';

export default function LessonReadToggle({
  moduleId,
  orderIndex,
  initialRead,
  isLoggedIn,
  onToggle,
}: {
  moduleId: string;
  orderIndex: number;
  initialRead: boolean;
  isLoggedIn: boolean;
  onToggle: (moduleId: string, orderIndex: number, read: boolean) => Promise<void>;
}) {
  const [read, setRead] = useOptimistic(initialRead);
  const [, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-neutral-500">
        <Link href="/auth/login" className="underline">
          Connectez-vous
        </Link>{' '}
        pour suivre les leçons que vous avez lues.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setRead(!read);
          await onToggle(moduleId, orderIndex, !read);
        })
      }
      aria-pressed={read}
      className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors sm:w-auto ${
        read
          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
          : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900'
      }`}
    >
      {read ? '✓ Leçon lue' : 'Marquer comme lue'}
    </button>
  );
}
