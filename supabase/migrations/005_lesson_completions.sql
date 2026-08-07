-- Suivi des leçons lues, pour savoir quand un module est réellement terminé
-- (toutes les leçons lues ET le quiz réussi), et pas seulement quand le quiz est passé.
--
-- Choix de clé : on repère la leçon par (module_id, lesson_order_index) et NON par
-- lessons.id. `npm run import` supprime puis réinsère les leçons, ce qui régénère leurs
-- UUID — un lesson_id en clé étrangère serait effacé en cascade à chaque réimport et
-- l'apprenant perdrait toute sa progression. Le couple module + rang, lui, est stable.
create table if not exists lesson_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null references modules(id) on delete cascade,
  lesson_order_index int not null,
  completed_at timestamp with time zone default now(),
  unique (user_id, module_id, lesson_order_index)
);

create index if not exists lesson_completions_user_module_idx
  on lesson_completions (user_id, module_id);

alter table lesson_completions enable row level security;

drop policy if exists "Users can view own lesson completions" on lesson_completions;
drop policy if exists "Users can insert own lesson completions" on lesson_completions;
drop policy if exists "Users can delete own lesson completions" on lesson_completions;

create policy "Users can view own lesson completions" on lesson_completions
  for select using (auth.uid() = user_id);
create policy "Users can insert own lesson completions" on lesson_completions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own lesson completions" on lesson_completions
  for delete using (auth.uid() = user_id);
