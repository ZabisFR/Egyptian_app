/**
 * Test de positionnement — 12 questions écrites à la main, pas générées.
 *
 * Chacune est vérifiée contre le contenu réellement présent en base (tables de l'Arabizi
 * du module-01, tableau des 4 règles temporelles de conjugations-core, élatif du module-08,
 * formes dérivées du module-09, participe passif et pluriels brisés du module-12). Une
 * question de placement mal calibrée assigne un mauvais niveau à l'apprenant pour toute la
 * suite du parcours : on ne les génère pas au hasard.
 *
 * Deux règles de calibrage, apprises d'une première version ratée :
 *
 * 1. **3 questions minimum par palier.** À 2 questions, le seuil de 60 % ne peut valoir que
 *    0 %, 50 % ou 100 % — aucune granularité.
 * 2. **La difficulté doit monter en nature, pas seulement en rareté.** La v1 testait le B2
 *    par du vocabulaire (« kassar » = briser) alors que le B1 portait sur des règles de
 *    grammaire : le palier haut était mécaniquement plus facile que le palier bas. Les
 *    questions B2 portent désormais sur des systèmes (moule du participe passif, pluriel
 *    brisé, dérivation des formes), pas sur du lexique.
 *
 * Translittération : Arabizi uniquement (2 = hamza, 7 = Ha râpeux, 3 = 'Ayn), comme le
 * reste du contenu depuis `npm run normalize`.
 *
 * La bonne réponse est toujours `choices[0]` ; l'ordre est mélangé à l'affichage.
 */
export type PlacementQuestion = {
  difficulty: 'A1' | 'A2' | 'B1' | 'B2';
  question_text: string;
  choices: [string, string, string, string];
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ---------- A1 : alphabet, sons, vocabulaire de base ----------
  {
    difficulty: 'A1',
    question_text: 'Que veut dire « باب » (Bab) ?',
    choices: ['Porte', 'Fille', 'Beau', 'Amour'],
  },
  {
    difficulty: 'A1',
    question_text: 'En Arabizi, le chiffre 3 remplace quel son ?',
    choices: [
      "Le 'Ayn — contraction du fond de la gorge",
      'Le hamza — coup de glotte',
      'Le Ha râpeux du milieu de la gorge',
      'Le Kha — raclement',
    ],
  },
  {
    difficulty: 'A1',
    question_text: 'Que veut dire « بنت » (Bent) ?',
    choices: ['Fille', 'Garçon', 'Maison', 'Sœur'],
  },

  // ---------- A2 : système verbal, temps de base ----------
  {
    difficulty: 'A2',
    question_text: 'Que veut dire « Batkallem 3arabi » ?',
    choices: [
      'Je parle arabe',
      "J'apprends l'arabe",
      "Je comprends l'arabe",
      "J'écris en arabe",
    ],
  },
  {
    difficulty: 'A2',
    question_text: 'Devant un verbe, le préfixe B- marque :',
    choices: ['Le présent', 'Le futur', 'Le passé', "L'impératif"],
  },
  {
    difficulty: 'A2',
    question_text: 'Comment dit-on « je mangerai » ?',
    choices: ['Ana 7akol', 'Ana bakol', 'Akalt', 'Lazem akol'],
  },

  // ---------- B1 : impératif, négation, comparatif ----------
  {
    difficulty: 'B1',
    question_text: 'Que veut dire « استنى » (Istanna) ?',
    choices: ['Attends !', 'Viens !', 'Regarde !', 'Assieds-toi !'],
  },
  {
    difficulty: 'B1',
    question_text: 'Pour nier un verbe au passé, on utilise :',
    choices: [
      'Ma-[verbe]-sh',
      'Mesh + verbe',
      'La + verbe',
      'Mesh + verbe au présent',
    ],
  },
  {
    difficulty: 'B1',
    question_text: 'Que veut dire « Da akbar mabna fel-madina » ?',
    choices: [
      "C'est le plus grand bâtiment de la ville",
      "C'est un grand bâtiment de la ville",
      "Ce bâtiment est plus grand que l'autre",
      "C'est le bâtiment le plus ancien de la ville",
    ],
  },

  // ---------- B2 : systèmes morphologiques, pas du lexique ----------
  {
    difficulty: 'B2',
    question_text: 'Le participe passif de « katab » (écrire) est :',
    choices: ['maktuub', 'itkatab', 'kaatib', 'kitaab'],
  },
  {
    difficulty: 'B2',
    question_text: 'Quel est le pluriel de « kitaab » (livre) ?',
    choices: ['kutub', 'kitaabaat', 'kitaabiin', 'kitaabeen'],
  },
  {
    difficulty: 'B2',
    question_text: 'Ajouter « it- » devant un verbe de Forme II donne :',
    choices: [
      'La Forme V — le réfléchi',
      'La Forme III — le réciproque',
      'Le participe passif',
      'La Forme I de base',
    ],
  },
];
