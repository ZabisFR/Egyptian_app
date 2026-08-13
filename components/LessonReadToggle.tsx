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
      <p className="text-sm text-[var(--muted)]">
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
      className={`w-full sm:w-auto ${
        read
          ? 'btn-outline border-[var(--malachite)] bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] text-[var(--malachite-text)] hover:bg-[color-mix(in_srgb,var(--malachite)_18%,transparent)]'
          : 'btn-sand'
      }`}
    >
      {read ? '✓ Leçon lue' : 'Marquer comme lue'}
    </button>
  );
}
