import Link from 'next/link';
import type { Metadata } from 'next';
import ArabicText from '@/components/ArabicText';
import { listSets, SERIES_SIZE, totalCount, type DrillSetId } from '@/lib/exercises';

export const metadata: Metadata = {
  title: 'Entraînement',
  description:
    'Des séries d’exercices à trous pour conjuguer, nier, transformer et écrire l’arabe égyptien sans choix multiple.',
};

/**
 * Une couleur par famille d'exercices, pour que le sommaire se lise par blocs : les
 * temps, ce qui les transforme, le lexique, l'écriture arabe, les phrases.
 */
const FAMILY_TONE: Record<DrillSetId, string> = {
  present: 'pop-tone-turquoise',
  futur: 'pop-tone-turquoise',
  passe: 'pop-tone-turquoise',
  negation: 'pop-tone-gold',
  imperatif: 'pop-tone-gold',
  modalites: 'pop-tone-gold',
  transformation: 'pop-tone-gold',
  vocabulaire: 'pop-tone-grenade',
  lecture: 'pop-tone-indigo',
  'premiere-lettre': 'pop-tone-indigo',
  'derniere-lettre': 'pop-tone-indigo',
  formes: 'pop-tone-indigo',
  phrases: 'pop-tone-saffron',
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
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <p className="cartouche">Entraînement libre</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">
        S’exercer, pas être <span className="pop-hl pop-tone-gold">noté</span>
      </h1>

      <p className="mt-4 max-w-2xl text-[var(--muted)]">
        {totalCount()} exercices à trous tirés du contenu des modules. On tape la réponse,
        on ne la choisit pas — et rien n’est enregistré : ni score, ni XP, ni progression.
        C’est le brouillon, le quiz de module reste la copie.
      </p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <li key={set.id}>
            <Link href={`/entrainement/${set.id}`} className={`pop-card ${FAMILY_TONE[set.id]}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="display text-2xl leading-tight">{set.title}</h2>
                <span className="pop-chip tabular shrink-0">{set.count}</span>
              </div>

              <p className="mt-1.5 text-sm font-medium">{set.tagline}</p>

              {/* L'exemple vaut mieux qu'une explication : on voit en un coup d'œil à quoi
                  ressemble l'exercice avant de s'y engager. */}
              <p className="mt-auto pt-4">
                <span className="block rounded-2xl border-2 border-[var(--on)] bg-[var(--veil)] px-3 py-2 font-mono text-[0.8125rem]">
                  <ArabicText>{set.sample}</ArabicText>
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-2xl text-sm text-[var(--muted)]">
        Chaque série tire {SERIES_SIZE} exercices au hasard. Bloqué sur un mot ? Le bouton
        « je sèche » affiche quatre propositions — l’écran de fin compte à part ce qui a
        été trouvé sans aide.
      </p>
    </main>
  );
}
