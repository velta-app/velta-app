-- Allow a second (separate, private) Velta account.
create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) <> all (array['esparev@hotmail.com', 'adairolegario10agosto@gmail.com']) then
    raise exception 'Sign-ups are disabled for this app';
  end if;
  return new;
end;
$$;
