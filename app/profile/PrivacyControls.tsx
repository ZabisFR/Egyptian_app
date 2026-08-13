'use client';

import { useState, useTransition } from 'react';

export default function PrivacyControls({
  onExport,
  onDelete,
}: {
  onExport: () => Promise<string | null>;
  onDelete: () => Promise<{ error: string } | void>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);

  const CONFIRM_WORD = 'SUPPRIMER';

  function download() {
    startTransition(async () => {
      const json = await onExport();
      if (!json) return;
      // Génère le fichier côté navigateur : les données ne transitent par aucun tiers.
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-arabe-egyptien-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <section className="mt-12">
      <h2 className="display text-xl">Vos données</h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={download}
          disabled={pending}
          className="btn-outline w-full disabled:opacity-50 sm:w-auto"
        >
          {pending ? 'Préparation…' : 'Télécharger mes données (JSON)'}
        </button>

        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full rounded-lg border border-[color-mix(in_srgb,var(--carmine)_50%,transparent)] px-5 py-2.5 text-sm font-semibold text-[var(--carmine-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--carmine)_10%,transparent)] sm:w-auto"
          >
            Supprimer mon compte
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--carmine)_50%,transparent)] bg-[color-mix(in_srgb,var(--carmine)_8%,transparent)] p-4">
          <p className="text-sm font-semibold text-[var(--carmine-text)]">
            Cette action est irréversible.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Votre compte, votre progression, vos scores et votre historique seront effacés
            définitivement. Aucune copie n&apos;est conservée. Pensez à télécharger vos
            données avant, si vous souhaitez les garder.
          </p>

          <label className="mt-4 block">
            <span className="text-sm">
              Tapez <strong>{CONFIRM_WORD}</strong> pour confirmer :
            </span>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--carmine)] sm:max-w-xs"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm text-[var(--carmine-text)]">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={typed !== CONFIRM_WORD || pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await onDelete();
                  if (result?.error) setError(result.error);
                })
              }
              className="w-full rounded-lg bg-[var(--carmine)] px-5 py-2.5 text-sm font-semibold text-[var(--on-carmine)] transition-opacity disabled:opacity-40 sm:w-auto"
            >
              {pending ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped('');
                setError(null);
              }}
              className="btn-outline w-full sm:w-auto"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
