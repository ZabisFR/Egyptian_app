import { randomInt } from 'node:crypto';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import DrillSession from './DrillSession';
import { parseSeed } from '@/lib/shuffle';
import {
  drawSeries,
  findSet,
  SERIES_SIZE,
  themesOf,
  type DrillSetId,
} from '@/lib/exercises';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ set: string }>;
}): Promise<Metadata> {
  const set = findSet((await params).set);
  return { title: set ? `Entraînement — ${set.title}` : 'Entraînement introuvable' };
}

const first = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);

export default async function DrillSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ set: string }>;
  searchParams: Promise<{ seed?: string | string[]; theme?: string | string[] }>;
}) {
  const { set: setId } = await params;
  const set = findSet(setId);
  if (!set) notFound();

  const query = await searchParams;
  const theme = first(query.theme) ?? null;
  const themes = themesOf(set.id as DrillSetId);

  // Pas de graine dans l'URL : on en tire une et on redirige vers l'URL qui la porte. Une
  // graine fixe rendait la page idempotente, mais chaque arrivée depuis le sommaire
  // redonnait alors exactement la même première série. Avec la redirection, le rendu reste
  // une fonction de l'URL (serveur et hydratation concordent), et la série est partageable.
  const seed = parseSeed(first(query.seed));
  if (seed === null) {
    const params = new URLSearchParams({ seed: String(randomInt(1, 1_000_000)) });
    if (theme) params.set('theme', theme);
    redirect(`/entrainement/${set.id}?${params}`);
  }

  const exercises = drawSeries({ set: set.id, seed, theme, size: SERIES_SIZE });

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <Link
        href="/entrainement"
        className="inline-block py-2 text-sm text-[var(--muted)] hover:underline"
      >
        ← Tous les entraînements
      </Link>

      <h1 className="display mt-4 text-3xl">{set.title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{set.tagline}</p>

      {/* Le filtre par thème ne s'affiche que là où il veut dire quelque chose : les
          conjugaisons viennent toutes de la même fiche de référence, il n'y a rien à
          filtrer. */}
      {themes.length > 1 && (
        // Replié par défaut : le vocabulaire compte vingt-neuf thèmes, et les déplier
        // d'office repousserait l'exercice sous la ligne de flottaison. Un `<details>`
        // plutôt qu'un bouton : il s'ouvre sans JavaScript et s'annonce tout seul.
        <details className="mt-5" open={!!theme}>
          <summary className="inline-block cursor-pointer py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            {theme
              ? `Thème : ${themes.find((t) => t.value === theme)?.label ?? theme}`
              : `Filtrer par thème (${themes.length})`}
          </summary>

          <nav aria-label="Filtrer par thème" className="mt-3 flex flex-wrap gap-2">
            <ThemeChip href={`/entrainement/${set.id}`} active={!theme} label="Tous" />
            {themes.map((t) => (
              <ThemeChip
                key={t.value}
                href={`/entrainement/${set.id}?theme=${encodeURIComponent(t.value)}`}
                active={theme === t.value}
                label={`${t.label} (${t.count})`}
              />
            ))}
          </nav>
        </details>
      )}

      <div className="mt-8">
        {exercises.length > 0 ? (
          <DrillSession
            key={`${theme ?? 'all'}-${seed}`}
            setId={set.id}
            setTitle={set.title}
            theme={theme}
            exercises={exercises}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucun exercice pour ce filtre. Lancez <code>npm run generate:drills</code> après
            avoir ajouté du contenu.
          </p>
        )}
      </div>
    </main>
  );
}

function ThemeChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[var(--gold-text)]'
          : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]'
      }`}
    >
      {label}
    </Link>
  );
}
