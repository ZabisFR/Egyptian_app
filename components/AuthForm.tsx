'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { AuthState } from '@/app/auth/actions';

const INPUT =
  'mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--gold)] ';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-sand mt-6 w-full disabled:opacity-50"
    >
      {pending ? '…' : label}
    </button>
  );
}

export default function AuthForm({
  mode,
  action,
}: {
  mode: 'login' | 'signup';
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});
  const isSignup = mode === 'signup';

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="display text-2xl">
        {isSignup ? 'Créer un compte' : 'Se connecter'}
      </h1>

      <form action={formAction} className="mt-8">
        {isSignup && (
          <label className="block">
            <span className="text-sm font-medium">Pseudo</span>
            <input
              name="display_name"
              type="text"
              autoComplete="nickname"
              placeholder="Optionnel"
              className={INPUT}
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className={INPUT}
          />
        </label>

        {state.error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] px-3 py-2 text-sm text-[var(--carmine)]"
          >
            {state.error}
          </p>
        )}
        {state.notice && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] px-3 py-2 text-sm text-[var(--malachite)]"
          >
            {state.notice}
          </p>
        )}

        <SubmitButton label={isSignup ? 'Créer mon compte' : 'Se connecter'} />
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        {isSignup ? (
          <>
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="underline">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="underline">
              S&apos;inscrire
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
