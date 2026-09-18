# Architecture du projet

Référence fichier par fichier, pour déboguer sans avoir à tout relire. Organisé dans l'ordre où une requête traverse l'app : config → routes → composants → logique partagée → base de données.

---

## Racine

| Fichier | Rôle |
|---|---|
| `middleware.ts` | S'exécute avant **chaque** requête (sauf assets statiques, voir `matcher`). Rafraîchit le token de session Supabase dans les cookies. Sans lui, une session expirée déconnecterait silencieusement l'utilisateur — les Server Components ne peuvent pas écrire de cookies eux-mêmes. |
| `app/globals.css` | **Le fichier à lire avant toute modification visuelle.** Organisé en sections numérotées : (1) les deux palettes complètes — papyrus puis nuit du désert — (2) base et focus, (3) typographie et prose markdown, (4) ornements, (5) surfaces, (6) boutons, (7) mouvement, (8) planche gravée, (9) chemin de dunes. Les jetons couvrent la couleur (`--lapis`, `--gold`…), l'élévation (`--shadow-1..3`), les rayons (`--r-sm/md/lg`) et le mouvement (`--ease`, `--t-fast/mid/slow`). |
| `app/layout.tsx` | Layout racine : charge les polices (Geist + Cormorant Garamond pour `.display`), monte `<Navbar>`, définit les métadonnées globales (`<title>`), et exécute le **script inline anti-flash** qui applique `data-theme` avant le premier rendu. |
| `.env.local` | Jamais commité (`.gitignore`). Contient `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (utilisées par l'app) et `SUPABASE_SECRET_KEY` (scripts locaux uniquement, jamais sur Vercel). |
| `.env.example` | Modèle sans valeurs réelles, documente à quoi sert chaque variable. |

---

## `lib/` — logique partagée, sans JSX

C'est le cœur à lire en premier pour comprendre une règle métier : tout ce qui n'est pas de l'affichage vit ici.

| Fichier | Rôle |
|---|---|
| `lib/supabase/client.ts` | Client Supabase pour le navigateur (`'use client'` components). Utilise la clé anonyme. |
| `lib/supabase/server.ts` | Client Supabase pour Server Components / Server Actions. Lit/écrit les cookies de session via `next/headers`. **C'est celui qu'utilisent presque tous les fichiers `page.tsx` et `actions.ts`.** |
| `lib/types.ts` | Types TypeScript miroir du schéma SQL (`Module`, `Lesson`, `VocabItem`, `QuizQuestion`, `ModuleStatus`). Si une colonne change en base, c'est ici qu'il faut la répercuter. |
| `lib/auth.ts` | `getUser()` (session brute), `getProfile()` (session + ligne `profiles`), `requireProfile()` (redirige vers `/auth/login` si non connecté — utilisé par toute page protégée : profil, dashboard, quiz, leçon du jour). |
| `lib/progress.ts` | `getAllProgress(userId)` calcule le statut de chaque module (`not_started` / `in_progress` / `completed`) à partir des leçons lues et du meilleur score. `deriveStatus()` contient la règle : **terminé = toutes les leçons lues ET quiz réussi**, pas l'un ou l'autre. |
| `lib/quiz-scoring.ts` | `scorePercent()`, `assignLevel()` (logique du test de positionnement : palier validé à 60 %, arrêt au premier échec), `PASS_THRESHOLD` (70 %, seuil de réussite d'un quiz de module — vit ici et pas dans `actions.ts` car un fichier `'use server'` ne peut exporter que des fonctions async). |
| `lib/shuffle.ts` | `seededShuffle(items, seed)` : mélange déterministe (même graine → même ordre). Utilisé par les quiz de module (graine dans l'URL, régénérée au clic sur « Refaire ») et par la leçon du jour (graine = utilisateur + date). Évite `Math.random()` pendant le rendu, qui casserait l'hydratation React. |
| `lib/daily.ts` | `getDailyLesson(userId)` : construit la leçon du jour à partir du vocabulaire des leçons lues. `todayKey()` ancre le découpage des journées sur `Europe/Paris` (pas UTC, sinon la leçon changerait à 2h du matin). |
| `lib/arabizi.ts` | `judgeAnswer()` compare une réponse **tapée** à la forme attendue. L'Arabizi n'ayant pas d'orthographe officielle, le verdict a trois valeurs : `exact` (à la casse, la ponctuation et les traits d'union près — « maro7tsh » = « Ma-ro7t-sh »), `close` (variantes connues : 7/h, 3, voyelles doublées, u↔o, i↔e) et `wrong`. `close` est compté juste, mais l'écran affiche la graphie du cours. |
| `lib/exercises.ts` | Modèle des exercices d'entraînement + `drawSeries()` (tirage déterministe par graine). Lit `data/exercises.generated.json`, **jamais Supabase** : l'entraînement ne produit aucune donnée utilisateur. `DRILL_SETS` est le catalogue des huit jeux ; `listSets()` masque ceux qu'aucun exercice n'alimente. |

---

## `components/` — blocs réutilisables

| Fichier | Rôle |
|---|---|
| `Navbar.tsx` | Server Component (lit la session via `getProfile()`). Sticky en haut (`sticky top-0 z-40`). Affiche les liens différemment selon connecté/non connecté. Le nom du site disparaît sous 640 px, seule la marque ع reste. |
| `NavLink.tsx` | Client Component minimal : le seul rôle de `usePathname()` est de poser `aria-current="page"`. C'est cet attribut — et non une classe — qui déclenche le soulignement doré de l'onglet courant, pour que style et sémantique ne puissent pas diverger. |
| `ThemeToggle.tsx` | Bascule papyrus / nuit. Lit le thème via `useSyncExternalStore` (le thème vit dans le DOM, pas dans React) et l'écrit dans `localStorage`. Voir aussi le script inline de `layout.tsx` et la section RGPD de `/confidentialite`. |
| `HorizonPlate.tsx` | La planche gravée de l'accueil : dunes, pyramides, soleil, caravane. 100 % SVG, thémée par variables CSS, zéro requête réseau. |
| `SoundSampler.tsx` | Les quatre sons de l'Arabizi (3، 7، 5، 2) jouables au clic sur l'accueil. Réutilise les mp3 de `public/audio/alphabet/` déjà présents pour le module 01 : rien n'est téléchargé tant qu'on n'a pas cliqué. |
| `ScoreDial.tsx` | Cadran de score circulaire des écrans de résultat (quiz, positionnement, révision du jour). L'anneau se remplit en CSS pur (`@keyframes dial-fill` lit `--dash-start`/`--dash-end`), donc le composant reste rendu côté serveur. |
| `LevelBadge.tsx` | Le badge « A1 »/« B2 »/etc. en cartouche, une couleur par palier. |
| `ModuleCard.tsx` | Carte d'un module dans `/modules`. Le filet doré à gauche encode le statut (plein = terminé, atténué = en cours). |
| `LessonPath.tsx` | Le chemin de dunes. `offsetAt()` calcule la position sur le serpentin (8 positions qui se répètent), `Trail` dessine les traces de pas entre deux dunes. La variable CSS `--wave` réduit l'amplitude du serpentin sous 480px pour ne pas déborder sur mobile. |
| `DuneIcon.tsx` | Les SVG bruts (dune, pyramide). Les couleurs viennent de classes CSS posées par le parent (`.dune-near`, `.pyr-sky`...), pas de `<defs>` dupliqués. |
| `LessonViewer.tsx` | Rendu markdown d'une leçon (`react-markdown` + `remark-gfm`) + table de vocabulaire. |
| `LessonReadToggle.tsx` | Bouton « Marquer comme lue ». Utilise `useOptimistic` : la coche apparaît immédiatement, avant même la confirmation du serveur. |
| `QuizEngine.tsx` | Moteur générique de QCM, réutilisé par le quiz de module, le test de positionnement et la leçon du jour. Une question à la fois, feedback immédiat, `renderResult` est fourni par l'appelant pour personnaliser l'écran final. Raccourcis clavier : les chiffres **1 à 9** choisissent une réponse, **Entrée** enchaîne (les numéros sont affichés sur chaque bouton — un raccourci invisible n'existe pas). Le résultat est annoncé dans une zone `aria-live`, sans quoi un lecteur d'écran ne signalerait qu'un changement de couleur. |
| `DrillEngine.tsx` | Moteur des exercices à trou. Frère de `QuizEngine`, avec une différence de fond : **on tape la réponse**, on ne la choisit pas — reconnaître « Baroo7 » parmi quatre formes n'apprend pas à la produire. Le QCM n'apparaît qu'après un clic sur « je sèche », et l'écran final compte à part ce qui a été trouvé sans aide. Le jugement est délégué à `lib/arabizi.ts`. Rien n'est envoyé au serveur. |
| `ProgressBar.tsx` | Barre de progression générique (dégradé or → carmin). |
| `AuthForm.tsx` | Formulaire login/signup partagé, piloté par `useActionState` (React 19). |

---

## `app/` — une route par dossier

### Pages publiques

| Fichier | Route | Rôle |
|---|---|---|
| `app/page.tsx` | `/` | Landing page. Compte les modules/leçons en direct depuis Supabase. |
| `app/modules/page.tsx` | `/modules` | Liste des modules avec statut de progression si connecté. |
| `app/modules/[id]/page.tsx` | `/modules/module-01` | Le chemin de dunes d'un module : groupe les leçons par section, calcule quelle dune est « vous êtes ici » (première non lue). |
| `app/modules/[id]/[lessonId]/page.tsx` | `/modules/module-01/uuid` | Contenu d'une leçon + bouton lue/pas lue + navigation précédent/suivant. |
| `app/modules/[id]/actions.ts` | — | `toggleLessonRead()` (coche/décoche une leçon) et `refreshModuleStatus()` (recalcule le statut du module après tout changement — leçon cochée OU quiz repassé). |

### Quiz de module

| Fichier | Rôle |
|---|---|
| `app/modules/[id]/quiz/page.tsx` | Server Component. Lit `?seed=` dans l'URL pour l'ordre des questions (`seededShuffle`), sinon ordre d'origine. |
| `app/modules/[id]/quiz/ModuleQuiz.tsx` | Client Component. Enrobe `QuizEngine`, gère l'écran de résultat et le bouton « Refaire » (génère une nouvelle graine, navigue vers `?seed=X`). |
| `app/modules/[id]/quiz/actions.ts` | `saveAttempt()` : enregistre la tentative, met à jour `best_score`, déclenche `refreshModuleStatus()`. |

### Test de positionnement

| Fichier | Rôle |
|---|---|
| `app/placement-test/page.tsx` | Charge les 12 questions de positionnement (`module_id is null`), triées A1→B2. |
| `app/placement-test/PlacementTest.tsx` | Affiche le résultat avec le détail par palier. |
| `app/placement-test/actions.ts` | `savePlacement()` : calcule le niveau via `assignLevel()`, met à jour `profiles.current_level`. |
| `scripts/placement-questions.ts` | Les 12 questions elles-mêmes, écrites à la main (pas générées) — un test de positionnement mal calibré fausse tout le parcours. |

### Entraînement libre

| Fichier | Rôle |
|---|---|
| `app/entrainement/page.tsx` | Le sommaire : une carte par jeu d'exercices, avec son compte et un exemple. Ne lit ni session ni Supabase. |
| `app/entrainement/[set]/page.tsx` | Tire une série de 10 exercices via `drawSeries()`. `?seed=` fixe le tirage (même graine → même série, donc rendu serveur et hydratation concordent) et `?theme=` le restreint à un module. Le filtre par thème est un `<details>` replié : le vocabulaire compte 29 thèmes, dépliés ils repousseraient l'exercice hors de l'écran. |
| `app/entrainement/[set]/DrillSession.tsx` | Enrobe `DrillEngine` : écran de résultat, récapitulatif des formes ratées, bouton « Nouvelle série » (nouvelle graine tirée **dans le gestionnaire de clic**, jamais pendant le rendu). |

**Ce que l'entraînement ne fait pas**, et c'est délibéré : aucune écriture en base, aucun XP, aucun effet sur le statut d'un module. C'est le brouillon ; le quiz de module reste la copie. Aucune table, aucune migration n'a donc été ajoutée.

**Pourquoi aucun lien dans la Navbar** : la barre est pleine. Mesuré à 768 px — sa largeur maximale, quel que soit l'écran, puisqu'elle est en `max-w-3xl` — un lien de plus la fait passer de 70 à 83 px de haut, parce que le nom du site se casse en deux. Les entrées sont donc l'accueil, `/modules` (carte sous le glossaire), le tableau de bord et le pied de page.

### Leçon du jour

| Fichier | Rôle |
|---|---|
| `app/daily/page.tsx` | Trois états : rien à réviser (pas assez de leçons lues), déjà faite aujourd'hui, ou la révision à faire. |
| `app/daily/DailyReview.tsx` | Enrobe `QuizEngine`, affiche un récap des mots ratés en fin de révision. |
| `app/daily/actions.ts` | `saveDailyReview()` : insertion protégée par contrainte unique `(user_id, review_date)` — un doublon (code `23505`) signifie que la leçon du jour est déjà faite, ce n'est pas une erreur. |

### Compte

| Fichier | Rôle |
|---|---|
| `app/auth/login/page.tsx`, `app/auth/signup/page.tsx` | Utilisent `<AuthForm>`. |
| `app/auth/actions.ts` | `login()`, `signup()`, `logout()`. Traduit les messages d'erreur Supabase les plus courants en français. |
| `app/auth/callback/route.ts` | Cible du lien de confirmation email : échange le `code` contre une session. |
| `app/profile/page.tsx` | Stats du compte (protégée par `requireProfile()`). |
| `app/dashboard/page.tsx` | Vue d'ensemble : XP, modules terminés, encart leçon du jour, « reprendre où j'en étais » (premier module en cours, sinon premier jamais commencé — exclut `conjugations-core`, qui n'a pas de niveau et se consulte plutôt qu'il ne se termine). |

---

## `supabase/migrations/` — le schéma, dans l'ordre d'exécution

Chaque fichier est numéroté et doit être exécuté une seule fois, dans l'ordre, via Supabase → SQL Editor.

| Fichier | Ce qu'il fait |
|---|---|
| `001_initial_schema.sql` | Les 7 tables de base + RLS sur `profiles`, `user_progress`, `quiz_attempts` (chacun ne voit que ses propres lignes). |
| `002_lock_content_writes.sql` | Révoque l'écriture anonyme sur le contenu (`modules`, `lessons`, `vocab_items`, `quiz_questions`) — seul `SUPABASE_SECRET_KEY` (scripts locaux) peut y écrire. |
| `003_public_read_policies.sql` | Active RLS sur les tables de contenu avec une policy de lecture publique explicite. **Nécessaire** : sans elle, si RLS est activé sans policy (ce qui peut arriver via le dashboard), les lectures anonymes renvoient un tableau vide avec un statut `200` — pas une erreur, un piège silencieux. |
| `004_profiles_on_signup.sql` | Trigger `security definer` qui crée la ligne `profiles` à l'inscription (la table n'a pas de policy INSERT, un utilisateur ne peut pas créer sa propre ligne autrement). |
| `005_lesson_completions.sql` | Table des leçons lues. Clé sur `(module_id, lesson_order_index)` et **pas** `lessons.id` : `npm run import` régénère les UUID des leçons à chaque réimport, une clé étrangère vers `lessons.id` effacerait toute la progression en cascade. |
| `006_daily_reviews.sql` | Historique de la leçon du jour, contrainte unique `(user_id, review_date)`. |

---

## `scripts/` — outils locaux, jamais exécutés en production

| Fichier | Rôle |
|---|---|
| `import-data.ts` | Charge `data/*.json` dans Supabase. Rejouable : purge puis réinsère par module. Utilise `SUPABASE_SECRET_KEY`. |
| `normalize-arabizi.ts` | Convertit la translittération académique (`ʿ`, `ḥ`, `ʾ`...) en Arabizi (`3`, `7`, `2`...) directement dans `data/*.json` — les modules B1/B2 avaient été rédigés dans un système différent des A1/A2. |
| `generate-quiz.ts` | Génère les QCM de module à partir du vocabulaire importé. Déterministe (mêmes questions à chaque exécution). Ne supprime que les questions `type = 'mcq'` — préserve les questions écrites à la main d'un autre type. |
| `generate-drills.ts` | Construit les ~1 450 exercices d'entraînement depuis `data/` et les écrit dans `data/exercises.generated.json`. **N'écrit pas en base** : l'app lit le fichier. Déterministe au caractère près — un `git diff` vide après exécution veut dire « le contenu n'a pas bougé », pas « le script n'a pas tourné ». Sources : les 19 paradigmes de `conjugations-core.json` (présent, futur, passé, négation, impératif, changement de temps), les 554 `vocab_items`, et les phrases des tableaux de leçon au gabarit `arabe — romanisation \| traduction`. Un exercice sans trois leurres crédibles est écarté plutôt que servi avec un QCM truqué. |
| `placement-questions.ts` | Les 12 questions du test de positionnement (voir plus haut). |

**Ordre d'exécution après tout ajout de contenu** : `normalize` → `import` → `generate:quiz` → `generate:drills`.

`data/exercises.generated.json` est **commité**. C'est un artefact, mais un artefact relu : une forme fausse s'y voit dans le diff, et l'app n'a rien à générer à l'exécution. Le revers est qu'il peut devenir obsolète en silence si on oublie l'étape — d'où sa place dans la liste ci-dessus. Pour compléter le corpus à la main sans toucher au générateur, créer `data/exercises-manual.json` (`{ "exercises": [ … ] }`, même forme qu'un brouillon) : il est fusionné à la fin et l'emporte sur un généré de même identifiant.

---

## Pour déboguer un problème courant

- **Une page protégée n'affiche rien / redirige** → elle appelle `requireProfile()` (`lib/auth.ts`), qui redirige vers `/auth/login` si `getUser()` ne trouve pas de session. Vérifier les cookies / le middleware avant de chercher plus loin.
- **Une donnée écrite ne s'affiche pas** → chaque page a `export const dynamic = 'force-dynamic'` pour éviter le cache statique de Next. Si absent sur une nouvelle page, c'est la première chose à ajouter.
- **Un module ne passe jamais à « terminé »** → vérifier `deriveStatus()` dans `lib/progress.ts` : il faut *toutes* les leçons lues *et* le quiz réussi, l'un des deux ne suffit pas.
- **Le quiz redonne le même ordre après « Refaire »** → vérifier que le bouton génère bien une nouvelle graine (`Math.random()` dans le gestionnaire de clic de `ModuleQuiz.tsx`, jamais pendant le rendu) et que l'URL contient `?seed=`.
- **Erreur 500 vague sur une page avec Server Action inline** → chercher une `const` exportée dans un fichier `'use server'` : seules les fonctions `async` peuvent y être exportées, une constante fait planter la compilation.
- **Lecture anonyme qui renvoie un tableau vide sans erreur** → RLS activé sans policy sur une table de contenu (voir `003_public_read_policies.sql`). Comparer une lecture avec la clé publique vs `SUPABASE_SECRET_KEY` pour confirmer.
- **Une couleur reste claire en thème sombre** → la variable a été ajoutée au bloc `:root` mais pas aux DEUX blocs sombres de `globals.css` (`@media (prefers-color-scheme: dark)` **et** `:root[data-theme="dark"]`). Les trois blocs doivent lister les mêmes variables.
- **La page défile horizontalement sur mobile** → un élément incompressible (presque toujours un tableau large) élargit le `<main>`. Envelopper le tableau dans `<div className="table-scroll" tabIndex={0}>` ; la règle `#contenu > * { min-width: 0 }` fait le reste. Ne pas passer le tableau en `display: block` : Chrome lui retire alors son rôle « table » dans l'arbre d'accessibilité.
- **Un exercice d'entraînement affiche une forme fausse** → elle est fausse dans `data/`. Le générateur ne réécrit rien, il recopie : chercher la case du tableau dans `conjugations-core.json` ou la ligne de leçon, corriger, puis relancer `npm run generate:drills`.
- **Un nouveau module n'apparaît pas dans l'entraînement** → `npm run generate:drills` n'a pas été relancé. L'app lit un fichier, pas la base : un `npm run import` seul ne change rien aux exercices.
- **Une réponse juste est refusée** → regarder `judgeAnswer()` dans `lib/arabizi.ts` avant d'incriminer le corpus. Le verdict `close` couvre déjà 7/h, 3, 2, les voyelles doublées et u↔o / i↔e ; au-delà, ajouter la variante dans le champ `accepted` de l'exercice plutôt que d'élargir la normalisation, qui finirait par accepter deux mots différents.
- **Vérifier un contraste** → le mesurer, pas l'estimer : lire `getComputedStyle().color` et composer les fonds successifs jusqu'au premier opaque. Attention, Chrome sérialise les `color-mix()` en `color(srgb 0.94 …)`, avec des composantes de 0 à 1 — les passer par un canvas 1×1 (`fillStyle` puis `getImageData`) normalise tous les formats en 0–255.
