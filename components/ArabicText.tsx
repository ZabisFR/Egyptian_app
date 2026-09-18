/**
 * Affiche un texte qui mélange écriture arabe et alphabet latin.
 *
 * Deux problèmes se posent dès qu'un mot arabe est inséré dans une phrase française, et
 * les deux se voient à l'œil nu :
 *
 * 1. **La direction.** Le navigateur applique l'algorithme bidirectionnel d'Unicode au
 *    paragraphe entier : « « تفاح » → ___ » affiche ses guillemets et sa flèche du mauvais
 *    côté du mot arabe. Chaque passage arabe est donc isolé dans un `<bdi>`, dont c'est
 *    exactement le rôle — il coupe le passage du calcul de direction voisin.
 * 2. **La taille.** À corps égal, l'arabe est illisible : les points diacritiques qui
 *    distinguent ب de ت de ث disparaissent. La classe `.arabic` (voir `globals.css`) monte
 *    le corps à 1,25 em et donne une police à empattements arabes.
 *
 * Le découpage se fait au rendu plutôt qu'à la génération : le corpus reste du texte brut,
 * relisible dans un diff, et n'a pas à transporter de balisage.
 */

/**
 * Un passage arabe : une ou plusieurs lettres, les espaces internes compris tant qu'un
 * caractère arabe suit. L'espace final d'un passage appartient à la phrase latine, pas au
 * mot arabe — sans quoi il serait rendu à 1,25 em et déséquilibrerait la ligne.
 */
const ARABIC_RUN = /((?:[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+(?:[  ]+(?=[؀-ۿݐ-ݿ]))?)+)/g;

export default function ArabicText({ children }: { children: string }) {
  const parts = children.split(ARABIC_RUN);

  // Aucun caractère arabe : on rend la chaîne telle quelle, sans envelopper quoi que ce
  // soit. C'est le cas de la grande majorité des exercices.
  if (parts.length === 1) return <>{children}</>;

  return (
    <>
      {parts.map((part, i) =>
        // `split` avec une capture intercale les passages capturés aux index impairs.
        i % 2 === 1 ? (
          <bdi key={i} dir="rtl" className="arabic">
            {part}
          </bdi>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
