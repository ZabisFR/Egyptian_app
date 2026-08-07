# Arabe égyptien — app d'apprentissage

Next.js 16 (App Router, TypeScript, Tailwind) + Supabase.

## Avancement (roadmap de `Architecture_Projet_Arabe_Egyptien.md`)

| Phase | État |
|---|---|
| 1 — Setup Next.js + Supabase | ✅ (déploiement Vercel non fait) |
| 2 — Authentification | ✅ signup / login / logout / profil protégé |
| 3 — Migration du contenu | ✅ 15 modules, 106 leçons, 354 vocab |
| 4 — Pages de leçons | ✅ |
| 5 — Moteur de quiz | ✅ test de positionnement + quiz par module (seuil 70 %) |
| 6 — Progression / dashboard | ✅ leçons lues, complétion de module, XP, `/dashboard` |
| 7 — Design mobile-first | ✅ vérifié à 375 px, aucun débordement horizontal |
| 8 — PWA, audio | ⬜ |

### Écarts assumés par rapport au document d'architecture

Le document décrit `modules.id` en `uuid` et `lessons.content` ; le SQL réellement appliqué
utilise `modules.id text` (`'module-01'`, lisible dans les URL) et `lessons.content_markdown`.
**C'est le SQL qui fait foi** — la base est construite ainsi et les données importées.

Le document prévoit `/modules/[id]` comme « contenu de la leçon », en supposant un module =
une page. Les modules réels comptent 2 à 19 leçons (des « Jours »), d'où le niveau
supplémentaire `/modules/[id]/[lessonId]`.

`tailwind.config.js` n'existe pas : Tailwind v4 se configure dans `app/globals.css`.
Les fichiers sont en `.tsx` et non `.jsx`.

Le document prévoit une route `/modules/[id]/quiz/results`. Le résultat s'affiche en place à
la fin du quiz : une route séparée obligerait à faire transiter les réponses entre deux pages
sans rien apporter à l'apprenant.

Le verrouillage des modules selon la progression n'est pas implémenté. `ModuleCard` sait
afficher l'état `locked`, mais aucune règle ne le déclenche : il reste à décider du sort du
module de référence (`conjugations-core`, sans niveau) et de ce que voit un visiteur non
connecté.

## Mise en route

### 0. Scripts

```bash
npm run normalize       # uniformise la translittération de data/*.json en Arabizi
npm run import          # charge data/*.json dans Supabase (rejouable)
npm run generate:quiz   # génère les QCM depuis le vocabulaire + le test de positionnement
```

À lancer dans cet ordre après tout ajout de contenu : `normalize` corrige la source,
`import` la charge, `generate:quiz` reconstruit les questions à partir du vocabulaire chargé.

Les modules B1/B2 avaient été rédigés en translittération académique (`ʿarabi`, `ḥaawel`,
`maʾfuul`) alors que les A1/A2 étaient en Arabizi (`3arabi`, `7akol`). Deux systèmes dans un
même parcours obligent l'apprenant à réapprendre à lire à mi-chemin. `normalize` convertit
`ʿ→3`, `ʾ→2`, `ḥ→7` et retire les points emphatiques. Aucun de ces caractères n'existe en
français, la substitution est donc sans risque pour les traductions.

`generate:quiz` supprime et régénère uniquement les questions de `type = 'mcq'`. Les
questions écrites à la main d'un autre type (les 3 questions de compréhension du module-14)
sont préservées. La génération est déterministe : deux exécutions donnent le même résultat.

### 1. Appliquer le schéma

Dans Supabase → SQL Editor → New query, exécuter dans l'ordre :

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_lock_content_writes.sql`
3. `supabase/migrations/003_public_read_policies.sql`
4. `supabase/migrations/004_profiles_on_signup.sql`
5. `supabase/migrations/005_lesson_completions.sql`

> Le `005` suit les leçons lues. Il repère la leçon par `(module_id, lesson_order_index)` et
> non par `lessons.id` : `npm run import` régénère les UUID des leçons, une clé étrangère
> vers `lessons.id` effacerait en cascade toute la progression à chaque réimport.

> Le `004` est indispensable à l'authentification : `profiles` n'a pas de policy INSERT, un
> utilisateur ne peut donc pas créer sa propre ligne. Le trigger `security definer` s'en
> charge à l'inscription. Sans lui, le compte est créé mais `/profile` renvoie au login.

> Le `003` n'est pas cosmétique. Le schéma initial comptait sur l'*absence* de RLS pour
> rendre le contenu public ; si RLS est activé (bandeau du dashboard, réglage projet), les
> lectures anonymes renvoient un tableau vide **avec un statut 200**, sans erreur. Le `003`
> rend l'intention explicite et supprime ce mode de panne silencieux.

### 2. Renseigner la clé secrète

`.env.local` contient déjà l'URL et la clé publishable. Ajouter la clé secrète
(Supabase → Project Settings → API keys → secret key) :

```
SUPABASE_SECRET_KEY=sb_secret_...
```

Elle n'est utilisée que par le script d'import et n'est jamais exposée au navigateur.

### 3. Importer les données

```bash
npm run import
```

Le script est idempotent : il purge les leçons et questions d'un module avant de les
réinsérer, donc on peut le relancer après avoir modifié un JSON.

### 4. Lancer l'app

```bash
npm run dev
```

## Données

`data/` contient 15 fichiers :

- `module-01.json` … `module-14.json` — un module par fichier, avec ses leçons
  (`day` peut être `null`), son vocabulaire, et pour `module-14` des questions de
  compréhension.
- `conjugations-core.json` — référence grammaticale transversale. N'ayant pas la forme
  d'un module par jours, l'import la convertit en module `conjugations-core`
  (`order_index` 99) dont les leçons sont les règles temporelles, le tableau
  récapitulatif, puis un paradigme complet par verbe.

### Correspondances non triviales

| Source JSON | Base | Note |
|---|---|---|
| `module.generation_note` (module-05) | — | Pas de colonne, ignoré à l'import |
| `quiz_questions[].question_fr` (module-14) | `quiz_questions.options` | Stocké en `{"question_fr": "..."}` |
| `quiz_questions[].answer` | `quiz_questions.correct_answer` | `type` vaut `comprehension` |
| `vocab_items[].arabic` absent | `vocab_items.arabic = null` | Attendu : certains docs sources n'avaient que la translittération |
