import Link from 'next/link';
import type { Metadata } from 'next';
import { Noto_Naskh_Arabic } from 'next/font/google';
import LetterTracer from '@/components/LetterTracer';

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
