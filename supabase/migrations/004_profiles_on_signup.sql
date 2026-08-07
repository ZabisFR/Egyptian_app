-- `profiles` n'a pas de policy INSERT (schéma 001) : un utilisateur ne peut donc pas créer
-- sa propre ligne. On la crée côté base à l'inscription, via un trigger `security definer`
-- qui s'exécute avec les droits du propriétaire de la fonction et contourne donc RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrape les comptes éventuellement créés avant l'installation du trigger.
insert into public.profiles (id, display_name)
select u.id, split_part(u.email, '@', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
