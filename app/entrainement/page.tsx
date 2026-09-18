import Link from 'next/link';
import type { Metadata } from 'next';
import ArabicText from '@/components/ArabicText';
import { listSets, SERIES_SIZE, totalCount } from '@/lib/exercises';

export const metadata: Metadata = {
  title: 'Entraînement',
  description:
    'Des séries d’exercices à trous pour conjuguer, nier, transformer et écrire l’arabe égyptien sans choix multiple.',
};

/**
 * Le sommaire de l'entraînement.
 *
 * Le corpus vient d'un fichier généré, pas de Supabase : cette page ne lit ni session ni
 * base, et n'a donc pas besoin du `force-dynamic` que porte le reste du site pour échapper
 * au cache. Ce qu'elle affiche ne change qu'au prochain `npm run generate:drills`.
 */
export default function EntrainementPage() {
  const sets = listSets();

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <p className="eyebrow">Entraînement libre</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl">S’exercer, pas être noté</h1>

      <p className="mt-4 text-[var(--muted)]">
        {totalCount()} exercices à trous tirés du contenu des modules. On tape la réponse,
        on ne la choisit pas — et rien n’est enregistré : ni score, ni XP, ni progression.
        C’est le brouillon, le quiz de module reste la copie.
      </p>

      <div className="egypt-rule my-8" />

      <ul className="grid gap-3 sm:grid-cols-2">
        {sets.map((set) => (
          <li key={set.id}>
            <Link
              href={`/entrainement/${set.id}`}
              className="card-sand card-link flex h-full flex-col p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="display text-xl">{set.title}</h2>
                <span className="eyebrow tabular shrink-0">{set.count}</span>
              </div>

              <p className="mt-1.5 text-sm text-[var(--muted)]">{set.tagline}</p>

              {/* L'exemple vaut mieux qu'une explication : on voit en un coup d'œil à quoi
                  ressemble l'exercice avant de s'y engager. */}
              <p className="mt-4 rounded-[var(--r-sm)] bg-[var(--surface-sunken)] px-3 py-2 font-mono text-[0.8125rem] text-[var(--ink)]">
                <ArabicText>{set.sample}</ArabicText>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-[var(--muted)]">
        Chaque série tire {SERIES_SIZE} exercices au hasard. Bloqué sur un mot ? Le bouton
        « je sèche » affiche quatre propositions — l’écran de fin compte à part ce qui a
        été trouvé sans aide.
      </p>
    </main>
  );
}
