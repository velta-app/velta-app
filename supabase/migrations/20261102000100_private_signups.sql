-- Velta is a private, single-user app: reject any new auth user whose email
-- is not on the allowlist. Edit the array to allow additional emails.
create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) <> all (array['esparev@hotmail.com']) then
    raise exception 'Sign-ups are disabled for this app';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_signup_allowlist() from public, anon, authenticated;

drop trigger if exists enforce_signup_allowlist on auth.users;
create trigger enforce_signup_allowlist
  before insert on auth.users
  for each row execute function public.enforce_signup_allowlist();

-- Starter 50/30/20 split for existing users that have no buckets yet.
insert into public.buckets (user_id, name, percent, color, icon, sort_order)
select u.id, b.name, b.percent, b.color, b.icon, b.sort_order
from auth.users u
cross join (values
  ('Needs', 50, '#3b82f6', 'home', 0),
  ('Wishes', 30, '#db2777', 'sparkles', 1),
  ('Savings', 20, '#00a63e', 'piggy-bank', 2)
) as b(name, percent, color, icon, sort_order)
where not exists (select 1 from public.buckets x where x.user_id = u.id);
