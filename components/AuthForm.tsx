'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { AuthState } from '@/app/auth/actions';

// py-3 plutôt que py-2 : avec la hauteur de ligne, le champ atteint 44 px, la hauteur
// minimale confortable au doigt. Le fond `surface` le détache du grain de papyrus, sur
// lequel un champ transparent se repérait mal.
const INPUT =
  'mt-1.5 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm outline-none transition-colors focus:border-[var(--gold)]';

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
    <div className="mx-auto w-full max-w-sm px-6 py-14">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-[0.8rem] bg-[var(--lapis)] text-2xl leading-none text-[var(--gold)] shadow-[var(--shadow-1)]"
      >
        ع
      </span>

      <h1 className="display mt-5 text-3xl">
        {isSignup ? 'Créer un compte' : 'Bon retour'}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {isSignup
          ? 'Pour garder votre progression d’un appareil à l’autre. Rien d’autre ne vous sera demandé.'
          : 'Reprenez là où vous vous étiez arrêté.'}
      </p>

      <form action={formAction} className="card-sand mt-7 p-5">
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
            className="mt-4 rounded-[var(--r-sm)] bg-[color-mix(in_srgb,var(--carmine)_12%,transparent)] px-3 py-2.5 text-sm text-[var(--carmine-text)]"
          >
            {state.error}
          </p>
        )}
        {state.notice && (
          <p
            role="status"
            className="mt-4 rounded-[var(--r-sm)] bg-[color-mix(in_srgb,var(--malachite)_12%,transparent)] px-3 py-2.5 text-sm text-[var(--malachite-text)]"
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
