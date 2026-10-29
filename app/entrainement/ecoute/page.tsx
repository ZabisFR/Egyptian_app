import { randomInt } from 'node:crypto';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ListeningSession from './ListeningSession';
import { getLessonLinks, getModules, getVocabLite } from '@/lib/content';
import { listenable, listeningSeries } from '@/lib/listening';
import { parseSeed } from '@/lib/shuffle';
import { SERIES_SIZE } from '@/lib/exercises';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Entraînement — À l’oreille',
  description:
    'Un mot égyptien est prononcé sans être écrit : retrouvez son sens. Pour entraîner l’oreille sur tout le vocabulaire du cours.',
};

const first = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);

/**
 * Entraînement d'écoute. Jeu à part des exercices à trous (`/entrainement/[set]`) : ceux-ci
 * viennent d'un fichier généré et se tapent au clavier, celui-ci est un QCM sur le
 * vocabulaire de la base, dont seuls les mots au son de confiance sont retenus.
 *
 * Même mécanique de graine que les autres jeux : sans `?seed=`, on en tire une et on
 * redirige, pour que le rendu reste une fonction de l'URL.
 */
export default async function EcoutePage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string | string[]; theme?: string | string[] }>;
}) {
  const query = await searchParams;
  const theme = first(query.theme) ?? null;

  const seed = parseSeed(first(query.seed));
  if (seed === null) {
    const params = new URLSearchParams({ seed: String(randomInt(1, 1_000_000)) });
    if (theme) params.set('theme', theme);
    redirect(`/entrainement/ecoute?${params}`);
  }

  const [vocab, lessons, modules] = await Promise.all([getVocabLite(), getLessonLinks(), getModules()]);
  const moduleOf = new Map(lessons.map((l) => [l.id, l.module_id]));

  // Thèmes = modules qui ont au moins quatre mots écoutables (de quoi faire un QCM), dans
  // l'ordre du programme.
  const themes = modules
    .map((m) => ({
      value: m.id,
      label: m.title,
      count: listenable(vocab.filter((v) => moduleOf.get(v.lesson_id) === m.id)).length,
    }))
    .filter((t) => t.count >= 4);

  const items = theme ? vocab.filter((v) => moduleOf.get(v.lesson_id) === theme) : vocab;
  // Leurres pris d'abord dans le même thème : « chien » contre « chat » entraîne mieux
  // l'oreille que « chien » contre « mercredi ».
  const questions = listeningSeries(items, vocab, vocab, seed, SERIES_SIZE);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <Link
        href="/entrainement"
        className="inline-block py-2 text-sm text-[var(--muted)] hover:underline"
      >
        ← Tous les entraînements
      </Link>

      <h1 className="display mt-4 text-3xl">À l’oreille</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Le mot est prononcé, pas écrit : retrouvez son sens. Réécoutez autant que vous voulez.
      </p>

      {themes.length > 1 && (
        <details className="mt-5" open={!!theme}>
          <summary className="inline-block cursor-pointer py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            {theme
              ? `Thème : ${themes.find((t) => t.value === theme)?.label ?? theme}`
              : `Filtrer par thème (${themes.length})`}
          </summary>
          <nav aria-label="Filtrer par thème" className="mt-3 flex flex-wrap gap-2">
            <ThemeChip href="/entrainement/ecoute" active={!theme} label="Tous" />
            {themes.map((t) => (
              <ThemeChip
                key={t.value}
                href={`/entrainement/ecoute?theme=${encodeURIComponent(t.value)}`}
                active={theme === t.value}
                label={`${t.label} (${t.count})`}
              />
            ))}
          </nav>
        </details>
      )}

      <div className="mt-8">
        {questions.length > 0 ? (
          <ListeningSession key={`${theme ?? 'all'}-${seed}`} theme={theme} questions={questions} />
        ) : (
          <p className="text-sm text-[var(--muted)]">Aucun mot à écouter pour ce thème.</p>
        )}
      </div>
    </main>
  );
}

function ThemeChip({ href, active, label }: { href: string; active: boolean; label: string }) {
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
