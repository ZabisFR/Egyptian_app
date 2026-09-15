import type { NextConfig } from 'next';

/**
 * En-têtes de sécurité.
 *
 * Mesuré avant ajout : la production ne renvoyait que le `Strict-Transport-Security`
 * posé par Vercel. Rien n'empêchait donc d'afficher le site dans une iframe — un
 * formulaire de connexion encadrable est la condition même du détournement de clic
 * (clickjacking) — ni de faire deviner un type MIME à un navigateur, ni de transmettre
 * l'URL complète d'une leçon à un tiers dans l'en-tête `Referer`.
 *
 * Ce qui n'est PAS ajouté ici : une `Content-Security-Policy` complète. Elle demande
 * d'inventorier les scripts en ligne de Next, le domaine Supabase et Google Fonts, puis
 * de la vérifier page par page ; mal réglée, elle casse le site en silence. Seule la
 * directive `frame-ancestors` est posée, car elle ne restreint que l'encadrement et ne
 * peut donc rien casser. Une CSP complète reste à faire, et c'est un choix à assumer,
 * pas un oubli.
 */
const enTetesSecurite = [
  // Empêche le navigateur de « deviner » un type MIME différent de celui annoncé.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // L'URL d'une leçon porte son identifiant ; on ne l'envoie pas aux sites tiers.
  // Les liens sortants (Gmail, CNIL) ne reçoivent donc que l'origine.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Anti-détournement de clic. `frame-ancestors` est la forme moderne, `X-Frame-Options`
  // reste là pour les navigateurs qui ne lisent que celle-ci.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },

  // Le site n'a besoin d'aucune de ces interfaces. `camera=(self)` est conservé :
  // l'entraînement à l'écriture propose de photographier une lettre.
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig: NextConfig = {
  // Inutile d'annoncer la pile technique à qui cherche une faille connue.
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:chemin*', headers: enTetesSecurite }];
  },
};

export default nextConfig;
