'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { AuthState } from '@/app/auth/actions';

const INPUT =
  'mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-400';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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
      <h1 className="text-2xl font-bold">
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
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {state.error}
          </p>
        )}
        {state.notice && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            {state.notice}
          </p>
        )}

        <SubmitButton label={isSignup ? 'Créer mon compte' : 'Se connecter'} />
      </form>

      <p className="mt-6 text-sm text-neutral-500">
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
