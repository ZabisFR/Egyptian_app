import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données personnelles sont collectées par le site, pourquoi, combien de temps, et comment exercer vos droits.',
};

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="display text-3xl">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Dernière mise à jour : {SITE.lastUpdated}
      </p>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:display prose-a:text-[var(--lapis)]">
        <h2>En résumé</h2>
        <p>
          Ce site ne pratique aucun traçage publicitaire, n&apos;utilise aucun outil
          d&apos;analyse d&apos;audience, et ne transmet vos données à aucun tiers à des fins
          commerciales. Les seuls cookies déposés servent à vous garder connecté.
        </p>

        <h2>Responsable du traitement</h2>
        <p>
          {SITE.publisher} — contact : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>

        <h2>Données collectées</h2>
        <p>Le site ne fonctionne qu&apos;avec les données strictement nécessaires :</p>
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Origine</th>
              <th>Pourquoi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Adresse e-mail</td>
              <td>Vous, à l&apos;inscription</td>
              <td>Identifiant de connexion et confirmation du compte</td>
            </tr>
            <tr>
              <td>Mot de passe</td>
              <td>Vous, à l&apos;inscription</td>
              <td>
                Stocké uniquement sous forme chiffrée et irréversible par notre
                prestataire d&apos;authentification. Il n&apos;est jamais lisible, ni par
                nous ni par personne.
              </td>
            </tr>
            <tr>
              <td>Pseudo (facultatif)</td>
              <td>Vous, à l&apos;inscription</td>
              <td>Affichage dans l&apos;interface</td>
            </tr>
            <tr>
              <td>Progression pédagogique</td>
              <td>Votre usage du site</td>
              <td>
                Leçons lues, scores aux quiz, niveau estimé, points d&apos;expérience — pour
                vous permettre de reprendre où vous en étiez
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Aucune donnée de localisation, aucun profil publicitaire, aucune donnée sensible au
          sens de l&apos;article 9 du RGPD n&apos;est collectée.
        </p>

        <h2>Base légale</h2>
        <p>
          Le traitement repose sur l&apos;exécution du contrat (article 6.1.b du RGPD) :
          fournir le service d&apos;apprentissage auquel vous vous êtes inscrit. Sans compte,
          le contenu des leçons reste consultable et aucune donnée personnelle n&apos;est
          enregistrée.
        </p>

        <h2>Cookies</h2>
        <p>
          Seuls des cookies de session sont déposés, par notre prestataire
          d&apos;authentification, pour vous maintenir connecté d&apos;une page à
          l&apos;autre. Ils sont <strong>strictement nécessaires</strong> au fonctionnement
          du service : à ce titre, la réglementation ePrivacy et les recommandations de la
          CNIL n&apos;imposent pas de recueillir votre consentement, et aucun bandeau
          cookies n&apos;est affiché.
        </p>
        <p>
          Aucun cookie de mesure d&apos;audience, de publicité ou de réseau social
          n&apos;est utilisé. Les polices de caractères sont hébergées sur nos propres
          serveurs : leur affichage n&apos;envoie aucune requête à un tiers.
        </p>

        <h2>Sous-traitants et hébergement</h2>
        <ul>
          <li>
            <strong>{SITE.hostingProvider}</strong> — hébergement du site.
          </li>
          <li>
            <strong>{SITE.databaseProvider}</strong> — base de données et authentification.
          </li>
        </ul>
        <p>
          Ces prestataires agissent comme sous-traitants au sens du RGPD. Selon la région
          d&apos;hébergement configurée, vos données peuvent être traitées hors de
          l&apos;Union européenne ; ces transferts sont alors encadrés par les clauses
          contractuelles types de la Commission européenne.
        </p>

        <h2>Durée de conservation</h2>
        <p>
          Vos données sont conservées tant que votre compte existe. La suppression du compte
          efface immédiatement et définitivement l&apos;ensemble de vos données : profil,
          progression, historique des quiz. Cette suppression est irréversible et ne
          conserve aucune copie.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          portabilité, de limitation et d&apos;opposition. Deux de ces droits s&apos;exercent
          directement depuis votre espace, sans avoir à nous écrire :
        </p>
        <ul>
          <li>
            <strong>Accès et portabilité</strong> — téléchargez l&apos;intégralité de vos
            données au format JSON depuis <Link href="/profile">votre profil</Link>.
          </li>
          <li>
            <strong>Effacement</strong> — supprimez votre compte et toutes vos données depuis{' '}
            <Link href="/profile">votre profil</Link>.
          </li>
        </ul>
        <p>
          Pour les autres droits, écrivez à{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. Vous pouvez
          également introduire une réclamation auprès de la CNIL (
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          ).
        </p>

        <h2>Sécurité</h2>
        <p>
          Les échanges sont chiffrés en HTTPS. L&apos;accès aux données est cloisonné au
          niveau de la base : les règles de sécurité garantissent qu&apos;un compte ne peut
          lire ni modifier que ses propres lignes.
        </p>
      </div>

      <div className="egypt-rule mt-12">
        <span className="text-xs">◆</span>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/mentions-legales" className="underline">
          Mentions légales
        </Link>
      </p>
    </main>
  );
}
