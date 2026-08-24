/**
 * Informations légales du site.
 *
 * ⚠️ LES VALEURS MARQUÉES « À REMPLIR » DOIVENT ÊTRE COMPLÉTÉES AVANT TOUTE MISE EN LIGNE
 * PUBLIQUE. Elles ne peuvent pas être devinées : ce sont des mentions d'identité qui
 * engagent juridiquement l'éditeur du site.
 *
 * En droit français, l'article 6 III de la LCEN impose à tout éditeur de site accessible
 * au public d'indiquer son identité et un moyen de le contacter. Pour un particulier
 * éditant un site non professionnel, la loi permet de ne rendre publics que le nom de
 * l'hébergeur et un pseudonyme, à condition d'avoir communiqué son identité complète à
 * l'hébergeur — c'est l'option retenue par défaut ci-dessous.
 */
export const SITE = {
  name: 'Arabe égyptien',
  url: 'https://egyptian-arabic-app-phi.vercel.app',

  /** Nom ou pseudonyme de l'éditeur, affiché dans les mentions légales. À REMPLIR. */
  publisher: 'Evan POUTEAU',

  /** Adresse e-mail de contact pour l'exercice des droits RGPD. À REMPLIR. */
  contactEmail: 'pouteaue78@gmail.com',

  /**
   * Adresse dédiée aux retours et suggestions sur le contenu.
   *
   * Volontairement distincte de `contactEmail` : cette dernière est l'adresse
   * personnelle de l'éditeur, publiée parce que la LCEN et le RGPD l'exigent. Un lecteur
   * qui signale une coquille de translittération n'a aucune raison d'écrire au
   * responsable de traitement — et l'éditeur n'a aucune raison de mélanger les deux flux.
   */
  feedbackEmail: 'arabicappfeedback0000@gmail.com',

  /** Statut de l'éditeur : particulier ou professionnel. */
  publisherStatus: 'Particulier — site personnel sans activité commerciale',

  hostingProvider: 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  databaseProvider: 'Supabase Inc., 970 Toa Payoh North, Singapour',

  /** Date de dernière révision des mentions, à actualiser en cas de modification. */
  lastUpdated: '13 août 2026',
} as const;

/**
 * Construit un lien `mailto:` vers l'adresse de retours, avec objet (et corps) pré-remplis.
 *
 * `encodeURIComponent` plutôt que `URLSearchParams` : ce dernier encode les espaces en `+`,
 * que plusieurs clients de messagerie affichent littéralement dans la ligne d'objet.
 */
export function feedbackMailto(subject: string, body?: string) {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${SITE.feedbackEmail}?${params.join('&')}`;
}
