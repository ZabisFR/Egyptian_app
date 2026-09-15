import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: "Identité de l'éditeur, hébergement et propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10 sm:px-8">
      <h1 className="display text-3xl">Mentions légales</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Dernière mise à jour : {SITE.lastUpdated}
      </p>

      <div className="prose mt-8 max-w-none">
        <h2>Éditeur du site</h2>
        <p>
          {SITE.publisher}
          <br />
          {SITE.publisherStatus}
          <br />
          Contact : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
        <p>
          Conformément à l&apos;article 6 III-2 de la loi pour la confiance dans
          l&apos;économie numérique, l&apos;éditeur non professionnel peut ne rendre
          publiques que ces informations, ayant communiqué son identité complète à
          l&apos;hébergeur.
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par :<br />
          {SITE.hostingProvider}
        </p>
        <p>
          La base de données et le service d&apos;authentification sont fournis par :<br />
          {SITE.databaseProvider}
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus pédagogiques (leçons, tableaux, vocabulaire, enregistrements de
          prononciation) sont la propriété de l&apos;éditeur. Toute reproduction ou
          diffusion sans autorisation préalable est interdite.
        </p>
        <p>
          La langue arabe égyptienne, son alphabet et sa grammaire relèvent du domaine
          public : seule la mise en forme pédagogique proposée ici est protégée.
        </p>
        <p>
          Les enregistrements audio de prononciation diffusés sur le site reproduisent la
          voix de l&apos;éditeur. Cette voix est protégée au titre du droit à l&apos;image
          et à la voix, distinct du droit d&apos;auteur sur les enregistrements eux-mêmes.
          Toute extraction, téléchargement, réutilisation, montage, entraînement de
          modèle de synthèse ou d&apos;imitation vocale (voice cloning), ou diffusion de
          ces enregistrements en dehors du site, sous quelque forme que ce soit, est
          <strong> strictement interdite</strong> sans autorisation écrite préalable de
          l&apos;éditeur.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données personnelles est détaillé dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Le site propose un contenu pédagogique fourni à titre informatif. L&apos;éditeur
          s&apos;efforce d&apos;en assurer l&apos;exactitude mais ne peut garantir
          l&apos;absence d&apos;erreurs, notamment dans les transcriptions et
          translittérations, qui admettent souvent plusieurs conventions.
        </p>
      </div>

      <div className="egypt-rule mt-12">
        <span className="text-xs">◆</span>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/confidentialite" className="inline-block py-1.5 underline">
          Politique de confidentialité
        </Link>
      </p>
    </main>
  );
}
