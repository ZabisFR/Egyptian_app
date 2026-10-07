-- Quota du tuteur IA : une ligne par utilisateur et par jour (heure de Paris).
--
-- `count` : messages envoyés ce jour-là. `last_message_at` : date du dernier message.
-- `minute_started_at` / `minute_count` : la fenêtre d'une minute en cours, pour la limite
-- « N messages par minute » — `last_message_at` seul ne permet pas de compter les
-- messages d'une minute glissante.
create table chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  last_message_at timestamp with time zone,
  minute_started_at timestamp with time zone,
  minute_count int not null default 0,
  primary key (user_id, day)
);

alter table chat_usage enable row level security;

-- L'utilisateur peut LIRE son compteur (pour afficher les messages restants), jamais
-- l'écrire : aucune policy insert / update / delete. Seule la fonction ci-dessous, qui
-- s'exécute avec les droits de son propriétaire, le modifie.
create policy "Users can view own chat usage" on chat_usage
  for select using (auth.uid() = user_id);

-- Ceinture et bretelles : même si une policy d'écriture était ajoutée par erreur depuis
-- le dashboard, les rôles de l'API n'ont pas le droit d'écrire dans la table.
revoke insert, update, delete on chat_usage from anon, authenticated;


-- Vérifie ET consomme un message, en une seule opération atomique.
--
-- Pourquoi une fonction et pas « lire le compteur, puis l'incrémenter » depuis Next.js :
-- dix requêtes parallèles liraient toutes « 19 messages » avant que la première n'écrive
-- « 20 », et passeraient toutes. Ici, `for update` verrouille la ligne : les requêtes
-- concurrentes du même utilisateur attendent leur tour et voient chacune le compteur à jour.
--
-- L'utilisateur est toujours `auth.uid()`, jamais un paramètre : impossible de consommer
-- (ou de lire) le quota de quelqu'un d'autre. Les limites sont des paramètres pour rester
-- réglables dans `lib/chat-config.ts` ; appeler la fonction soi-même avec des limites
-- plus hautes ne donne rien, puisque seule la route `/api/chat` contacte l'IA, avec les
-- limites du fichier de config.
--
-- Le fuseau, lui, est écrit en dur : s'il était un paramètre, changer de fuseau changerait
-- de « jour », donc de ligne, et remettrait le compteur à zéro.
create or replace function consume_chat_message(daily_limit int, minute_limit int)
returns table (allowed boolean, reason text, remaining int, retry_after_seconds int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Europe/Paris')::date;
  row_usage public.chat_usage%rowtype;
  window_start timestamp with time zone;
  window_count int;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.chat_usage (user_id, day)
  values (uid, today)
  on conflict (user_id, day) do nothing;

  select * into row_usage
  from public.chat_usage
  where user_id = uid and day = today
  for update;

  -- Limite du jour. Reset : minuit, heure de Paris.
  if row_usage.count >= daily_limit then
    return query select
      false,
      'daily'::text,
      0,
      ceil(extract(epoch from (
        ((today + 1)::timestamp at time zone 'Europe/Paris') - now()
      )))::int;
    return;
  end if;

  -- Fenêtre d'une minute : on repart de zéro si la précédente est échue.
  if row_usage.minute_started_at is null
     or now() - row_usage.minute_started_at >= interval '1 minute' then
    window_start := now();
    window_count := 0;
  else
    window_start := row_usage.minute_started_at;
    window_count := row_usage.minute_count;
  end if;

  if window_count >= minute_limit then
    return query select
      false,
      'minute'::text,
      daily_limit - row_usage.count,
      greatest(1, ceil(extract(epoch from (
        window_start + interval '1 minute' - now()
      )))::int);
    return;
  end if;

  update public.chat_usage
  set count = count + 1,
      last_message_at = now(),
      minute_started_at = window_start,
      minute_count = window_count + 1
  where user_id = uid and day = today;

  return query select true, null::text, daily_limit - row_usage.count - 1, 0;
end;
$$;

-- Par défaut, Postgres autorise tout le monde (`public`) à exécuter une fonction.
-- On réserve celle-ci aux comptes connectés.
revoke execute on function consume_chat_message(int, int) from public, anon;
grant execute on function consume_chat_message(int, int) to authenticated;
