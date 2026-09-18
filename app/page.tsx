import Link from 'next/link';
import HorizonPlate from '@/components/HorizonPlate';
import SoundSampler from '@/components/SoundSampler';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Ce qu'on sait faire à la fin de chaque palier, en une phrase concrète. */
const LEVELS = [
  {
    level: 'A1',
    title: 'Les fondations',
    text: "Lire l'alphabet, écrire en Arabizi, saluer, compter, commander un café sans passer à l'anglais.",
  },
  {
    level: 'A2',
    title: 'La vie courante',
    text: 'Le passé et le futur, marchander au souk, raconter sa journée, poser une question et comprendre la réponse.',
  },
  {
    level: 'B1',
    title: "L'aisance",
    text: "Suivre une conversation entre amis, saisir l'humour cairote, changer de registre selon la personne en face.",
  },
  {
    level: 'B2',
    title: 'Le débat',
    text: 'Nuancer, argumenter, suivre une série égyptienne sans sous-titres et une discussion politique au café.',
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ count: moduleCount }, { count: lessonCount }, { count: vocabCount }] =
    await Promise.all([
      supabase.from('modules').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('vocab_items').select('*', { count: 'exact', head: true }),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-12 sm:px-8 sm:pt-16">
      {/* ---------------------------------------------------------------- Ouverture */}
      <section>
        <p className="cartouche rise">Dialecte cairote</p>

        <h1
          className="display rise mt-5 text-[2.6rem] leading-[1.05] sm:text-6xl"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          Parler l&apos;arabe du Caire,
          <br />
          pas celui des manuels.
        </h1>

        <p
          className="rise mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]"
          style={{ '--i': 2 } as React.CSSProperties}
        >
          Un parcours en {moduleCount} modules, {lessonCount} leçons et {vocabCount} mots, de
          l&apos;alphabet jusqu&apos;au débat : le <em>gim</em> égyptien, le <em>qaf</em> qui
          devient coup de glotte, et l&apos;Arabizi que les Égyptiens écrivent vraiment.
        </p>

        <div
          className="rise mt-8 flex flex-wrap gap-3"
          style={{ '--i': 3 } as React.CSSProperties}
        >
          <Link href="/modules" className="btn-sand">
            Commencer par le début
          </Link>
          <Link href="/placement-test" className="btn-outline">
            Tester mon niveau
          </Link>
        </div>

        <div className="rise mt-12" style={{ '--i': 4 } as React.CSSProperties}>
          <HorizonPlate />
        </div>
      </section>

      {/* ---------------------------------------------- Les quatre sons de l'Arabizi */}
      <section className="mt-24" aria-labelledby="sons">
        <p className="eyebrow">À écouter</p>
        <h2 id="sons" className="display mt-2 text-3xl sm:text-4xl">
          Pourquoi des chiffres au milieu des mots ?
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-[var(--muted)]">
          Parce que quatre sons arabes n&apos;ont aucune lettre latine pour les écrire. Les
          Égyptiens ont fait le plus simple : ils ont pris le chiffre dont la forme
          ressemble à la lettre. Cliquez pour les entendre — c&apos;est plus rapide que de
          les lire.
        </p>

        <SoundSampler />
      </section>

      {/* ------------------------------------------------------------------ Parcours */}
      <section className="mt-24" aria-labelledby="parcours">
        <p className="eyebrow">Le chemin</p>
        <h2 id="parcours" className="display mt-2 text-3xl sm:text-4xl">
          D&apos;un alphabet inconnu à une conversation
        </h2>

        <ol className="level-rail mt-10">
          {LEVELS.map((step, i) => (
            <li
              key={step.level}
              className="level-step rise"
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className="level-dot" aria-hidden="true" />
              <div className="pb-8 sm:pb-0">
                <span className="cartouche">{step.level}</span>
                <h3 className="display mt-2 text-lg">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------------- Fonctionnement */}
      <section className="mt-24" aria-labelledby="methode">
        <p className="eyebrow">La méthode</p>
        <h2 id="methode" className="display mt-2 text-3xl sm:text-4xl">
          Trois habitudes, pas trente fonctionnalités
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Feature
            title="Un chemin, pas une liste"
            text="Les leçons montent le long d'une piste de dunes. Un halo marque toujours l'étape où vous en êtes : on retrouve sa place sans chercher."
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M4 15c2.5-2.5 4.5-1 6.5 0s4 1.5 5.5-1" />
              </>
            }
          />
          <Feature
            title="On vérifie ce qui reste"
            text="Chaque module se termine par un quiz. Il faut 70 % pour le valider — et avoir lu toutes les leçons. Cocher ne suffit pas."
            icon={
              <>
                <path d="M12 3 21 19H3Z" />
                <path d="M12 3v16" />
              </>
            }
          />
          <Feature
            title="Cinq minutes par jour"
            text="La leçon du jour retire au hasard des mots de vos leçons déjà lues. Elle ne vous demande jamais ce que vous n'avez pas encore vu."
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            }
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------- Reprise */}
      <section className="mt-24">
        <div className="egypt-rule">
          <span className="text-xs">◆</span>
        </div>
        <div className="mt-10 text-center">
          <h2 className="display text-3xl">Yalla, on commence ?</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
            Le contenu est consultable sans compte. Créez-en un seulement quand vous
            voudrez garder votre progression.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/modules/module-01" className="btn-sand">
              Ouvrir la première leçon
            </Link>
            <Link href="/entrainement" className="btn-outline">
              S’entraîner
            </Link>
            <Link href="/modules/conjugations-core" className="btn-outline">
              Référence verbes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-sand p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[0.7rem] bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-[var(--gold-text)]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <h3 className="display mt-3 text-lg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{text}</p>
    </div>
  );
}
