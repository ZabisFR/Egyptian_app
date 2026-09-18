import Link from 'next/link';
import type { Metadata } from 'next';
import { Noto_Naskh_Arabic } from 'next/font/google';
import LetterTracer from '@/components/LetterTracer';
import { ALPHABET } from '@/lib/alphabet';

export const metadata: Metadata = {
  title: "S'entraîner à l'écriture",
  description:
    "Tracez les 28 lettres de l'alphabet arabe à la souris, au doigt ou au stylet, et obtenez un pourcentage de ressemblance avec le modèle. Analyse possible depuis une photo de votre cahier.",
};

/**
 * Police du modèle, chargée sur cette page seulement.
 *
 * Elle n'est pas décorative : c'est l'ÉTALON de la correction. Le modèle est rendu dans un
 * canvas avec cette police, puis comparé au tracé pixel par pixel. Sans police fixée, la
 * pile `.arabic` du site (Segoe UI, Noto Naskh, Traditional Arabic…) donnerait un modèle
 * différent selon la machine — et donc un pourcentage incomparable d'un appareil à
 * l'autre pour exactement le même geste.
 *
 * Le sous-ensemble arabe seul, sur cette route seule : les autres pages n'en paient rien.
 */
const naskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  display: 'swap',
});

export default function EcriturePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header>
        <p className="eyebrow">Atelier d&apos;écriture</p>
        <h1 className="display mt-2 text-4xl">Tracer les lettres</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
          Choisissez une lettre, suivez le modèle gris du doigt, à la souris ou au stylet,
          puis demandez la correction. Le pourcentage mesure à la fois ce que votre tracé
          couvre du modèle et ce qui en déborde — pas seulement la ressemblance générale.
        </p>
      </header>

      <div className={naskh.className}>
        <LetterTracer police={naskh.style.fontFamily} />
      </div>

      {/* ------------------------------------------------- Les quatre formes de chaque lettre */}
      <section className="mt-14">
        <div className="egypt-rule">
          <span className="text-xs">◆</span>
        </div>

        <h2 className="display mt-8 text-2xl">Les quatre formes de chaque lettre</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
          Une lettre arabe ne s’écrit pas de la même façon selon sa place dans le mot :
          elle se soude à ses voisines et perd une partie de son corps. C’est la raison
          pour laquelle un mot reste illisible alors qu’on connaît toutes ses lettres —
          soudée en tête de mot, <span className="arabic">ب</span> devient{' '}
          <span dir="rtl" className="arabic">
            بـ
          </span>{' '}
          et ne ressemble plus à ce qu’on a tracé.
        </p>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
          Le petit trait qui dépasse dans le tableau n’est pas un morceau de la lettre :
          c’est l’attache, à l’endroit où la lettre voisine vient se souder.
        </p>

        {/* Six colonnes, dont quatre en arabe : sur un écran de téléphone, le tableau
            dépasse forcément. `table-scroll` le fait défiler dans son propre cadre plutôt
            que d'élargir la page entière. `tabIndex` pour que le cadre soit atteignable au
            clavier — un contenu qui défile sans pouvoir recevoir le focus est inatteignable
            sans souris. */}
        <div className="table-scroll mt-6" tabIndex={0}>
          <table className="w-full border-collapse text-center">
            <caption className="sr-only">
              Les 28 lettres de l’alphabet arabe et leurs formes isolée, initiale, médiane
              et finale
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="px-2 py-2 text-left text-xs font-semibold">
                  Lettre
                </th>
                <th scope="col" className="px-2 py-2 text-xs font-semibold">
                  Isolée
                </th>
                <th scope="col" className="px-2 py-2 text-xs font-semibold">
                  Début
                </th>
                <th scope="col" className="px-2 py-2 text-xs font-semibold">
                  Milieu
                </th>
                <th scope="col" className="px-2 py-2 text-xs font-semibold">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody>
              {ALPHABET.map((lettre) => (
                <tr
                  key={lettre.nom}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <th scope="row" className="whitespace-nowrap px-2 py-1.5 text-left">
                    <span className="text-sm font-semibold">{lettre.nom}</span>
                    {/* En bloc et non collé au nom : côte à côte, un lecteur d'écran lit
                        « Alifa » d'un seul tenant. */}
                    <span className="block text-xs text-[var(--muted)]">{lettre.arabizi}</span>
                    {/* La marque tient en un mot, sur la ligne de la lettre concernée :
                        une note de bas de tableau se lit une fois et s'oublie. */}
                    {!lettre.attachante && (
                      <span className="mt-0.5 block text-[0.6875rem] text-[var(--gold-text)]">
                        ne lie pas à droite
                      </span>
                    )}
                  </th>
                  {[lettre.isole, lettre.initiale, lettre.mediane, lettre.finale].map(
                    (forme, i) => (
                      <td key={i} dir="rtl" className="arabic px-2 py-1.5 text-2xl">
                        {forme}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Six lettres — <span className="arabic">ا د ذ ر ز و</span> — s’accrochent à celle
          qui les précède mais jamais à celle qui les suit. Leur forme de début est donc
          identique à leur forme isolée, et leurs formes du milieu et de la fin sont
          identiques entre elles : les deux doublons du tableau sont une information, pas
          une erreur. C’est aussi ce qui explique les blancs à l’intérieur des mots, comme
          dans <span dir="rtl" className="arabic">مدرسة</span>.
        </p>
      </section>

      <section className="mt-12">
        <div className="egypt-rule">
          <span className="text-xs">◆</span>
        </div>
        <h2 className="display mt-8 text-xl">Comment la note est calculée</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Aucune intelligence artificielle, aucun envoi de données : le modèle et votre
          tracé sont convertis en deux images en noir et blanc, puis superposés. Deux
          mesures en sortent — la part de votre trait qui tombe sur le modèle, et la part
          du modèle que vous avez couverte. Le pourcentage affiché est leur moyenne
          harmonique : il ne monte que si les deux sont bonnes. Noircir toute la case ou
          poser un seul point bien placé donnent l&apos;un comme l&apos;autre une note
          basse.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Une tolérance de quelques pixels est admise : sans elle, aucun tracé humain ne
          dépasserait 30 %. Attendez-vous à plafonner autour de 90 % — un tracé à la main
          ne recouvre jamais exactement une lettre imprimée.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/modules/module-01" className="inline-block py-1.5 underline">
            Revoir les leçons sur l&apos;alphabet
          </Link>
        </p>
      </section>
    </main>
  );
}
