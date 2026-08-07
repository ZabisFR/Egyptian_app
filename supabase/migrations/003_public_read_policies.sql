-- Le schéma initial comptait sur l'ABSENCE de RLS pour rendre le contenu lisible par tous.
-- C'est fragile : dès que RLS est activé (bandeau du dashboard, réglage projet), les
-- lectures anonymes renvoient un tableau vide sans erreur — silencieux et difficile à
-- diagnostiquer. On rend donc l'intention explicite : RLS activé + policy de lecture.
alter table modules enable row level security;
alter table lessons enable row level security;
alter table vocab_items enable row level security;
alter table quiz_questions enable row level security;

drop policy if exists "Public read modules" on modules;
drop policy if exists "Public read lessons" on lessons;
drop policy if exists "Public read vocab_items" on vocab_items;
drop policy if exists "Public read quiz_questions" on quiz_questions;

create policy "Public read modules" on modules
  for select to anon, authenticated using (true);
create policy "Public read lessons" on lessons
  for select to anon, authenticated using (true);
create policy "Public read vocab_items" on vocab_items
  for select to anon, authenticated using (true);
create policy "Public read quiz_questions" on quiz_questions
  for select to anon, authenticated using (true);

-- Aucune policy d'écriture : seule la clé secrète (role service_role, qui contourne RLS)
-- peut écrire. C'est ce qu'utilise scripts/import-data.ts.
