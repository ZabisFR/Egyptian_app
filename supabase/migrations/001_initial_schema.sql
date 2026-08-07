-- ============================================
-- Schéma initial : app d'apprentissage arabe égyptien
-- À coller dans Supabase → SQL Editor → New query
-- ============================================

-- Profils utilisateurs (étend auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  current_level text default 'A1',
  xp_points int default 0,
  created_at timestamp with time zone default now()
);

-- Modules (un par fichier module-XX.json)
create table modules (
  id text primary key,              -- ex: 'module-01'
  number int not null,
  title text not null,
  subtitle text,
  level text not null,
  description text,
  order_index int not null
);

-- Leçons (les "Jours" à l'intérieur d'un module)
create table lessons (
  id uuid default gen_random_uuid() primary key,
  module_id text references modules(id) on delete cascade,
  day int,                          -- peut être null (ex: participes actifs sans jour dédié)
  section text,
  title text not null,
  content_markdown text not null,
  order_index int not null
);

-- Vocabulaire (extrait de chaque leçon, pour affichage + quiz)
create table vocab_items (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade,
  arabic text,                      -- peut être null si le doc source n'avait que la translittération
  transliteration text not null,
  french text not null,
  audio_url text
);

-- Questions de quiz (générées plus tard à partir du contenu)
create table quiz_questions (
  id uuid default gen_random_uuid() primary key,
  module_id text references modules(id) on delete cascade,
  question_text text not null,
  type text not null default 'mcq',  -- 'mcq' | 'fill_blank' | 'translation'
  options jsonb,
  correct_answer text not null,
  difficulty text
);

-- Progression de l'utilisateur par module
create table user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  module_id text references modules(id) on delete cascade,
  status text default 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  best_score int,
  completed_at timestamp with time zone,
  unique(user_id, module_id)
);

-- Historique des tentatives de quiz
create table quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  module_id text references modules(id) on delete cascade,
  score int not null,
  answers jsonb,
  attempted_at timestamp with time zone default now()
);

-- ============================================
-- Row Level Security (chaque utilisateur ne voit que ses propres données)
-- ============================================
alter table profiles enable row level security;
alter table user_progress enable row level security;
alter table quiz_attempts enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

create policy "Users can view own attempts" on quiz_attempts
  for select using (auth.uid() = user_id);
create policy "Users can insert own attempts" on quiz_attempts
  for insert with check (auth.uid() = user_id);

-- modules, lessons, vocab_items, quiz_questions restent publics en lecture (pas de RLS = accessible à tous)
