/**
 * Réglages du tuteur IA, réunis ici pour se modifier sans chercher dans le code.
 *
 * Importé à la fois par la route `/api/chat` (qui fait respecter les limites) et par
 * l'interface (qui les affiche). Aucune valeur secrète : la clé Google reste dans
 * `GOOGLE_GENERATIVE_AI_API_KEY`, lue par le serveur seulement.
 */
export const CHAT_LIMITS = {
  /** Messages envoyés au tuteur par utilisateur et par jour (jour de Paris, voir plus bas). */
  dailyMessages: 20,
  /** Messages par minute : freine les rafales, y compris des requêtes parallèles. */
  perMinute: 5,
  /** Longueur maximale d'un message de l'élève, en caractères. */
  maxMessageChars: 500,
  /** Nombre de messages d'historique (élève + tuteur) transmis à l'IA. */
  maxHistory: 10,
  /** Longueur maximale d'une réponse du tuteur, en jetons (~4 caractères chacun). */
  maxOutputTokens: 400,
} as const;

/**
 * Les réponses du tuteur que le navigateur renvoie dans l'historique. Elles ne sont pas
 * soumises aux 500 caractères de l'élève (400 jetons font facilement 1 500 caractères),
 * mais restent bornées : l'historique vient du navigateur, quelqu'un pourrait sinon y
 * glisser un roman pour gonfler la facture.
 */
export const MAX_ASSISTANT_CHARS = 2500;

/**
 * Modèle utilisé si `CHAT_MODEL` n'est pas défini. `gemini-flash-latest` suit la version
 * Flash courante de Google : pas de modèle retiré du service à surveiller. Pour figer une
 * version précise, définir `CHAT_MODEL` (ex. `gemini-2.5-flash`) sans toucher au code.
 */
export const DEFAULT_CHAT_MODEL = 'gemini-flash-latest';

/**
 * Le « jour » du quota suit l'heure de Paris : le site s'adresse à des francophones, un
 * compteur remis à zéro à 2 h du matin (minuit UTC en été) surprendrait. Doit rester
 * identique au fuseau écrit dans la migration `007_chat_usage.sql`.
 */
export const CHAT_TIMEZONE = 'Europe/Paris';
