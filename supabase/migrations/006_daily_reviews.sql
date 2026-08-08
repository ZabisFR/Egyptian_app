-- Historique de la leçon du jour : une ligne par utilisateur et par date calendaire.
-- La contrainte unique fait à la fois office de garde-fou (une seule complétion comptée
-- par jour, donc pas d'XP à répéter) et de mémoire (permettra plus tard d'afficher une
-- série de jours consécutifs sans recalcul).
create table daily_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  score int not null,
  item_count int not null,
  created_at timestamp with time zone default now(),
  unique (user_id, review_date)
);

create index daily_reviews_user_idx on daily_reviews (user_id, review_date desc);

alter table daily_reviews enable row level security;

create policy "Users can view own daily reviews" on daily_reviews
  for select using (auth.uid() = user_id);
create policy "Users can insert own daily reviews" on daily_reviews
  for insert with check (auth.uid() = user_id);

-- Pas de policy update/delete : comme quiz_attempts, une tentative du jour est un fait
-- acquis, pas un brouillon qu'on corrige après coup.
