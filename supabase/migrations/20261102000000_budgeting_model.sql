-- Velta v2: budgeting model.
-- Money you have (funds) is split into buckets by percentage; planned items
-- (recurring or one-time expenses/income) are forecast against those buckets.

create type public.plan_frequency as enum (
  'one_time', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'
);
create type public.plan_kind as enum ('expense', 'income');

-- Profile preferences ---------------------------------------------------------
alter table public.profiles
  add column if not exists usd_mxn_rate numeric(12, 4) not null default 18.5,
  add column if not exists fx_auto boolean not null default true,
  add column if not exists fx_updated_at timestamptz,
  add column if not exists horizon_months integer not null default 12
    check (horizon_months between 1 and 24),
  add column if not exists include_income boolean not null default true,
  add column if not exists safety_buffer numeric(14, 2) not null default 0;

-- Shared updated_at trigger ---------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Funds: how much money you have (location doesn't matter) --------------------
create table public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null default 0,
  currency public.currency_code not null default 'MXN',
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Buckets: the budget split (needs, wishes, savings, ...) ---------------------
create table public.buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  percent numeric(5, 2) not null default 0 check (percent >= 0 and percent <= 100),
  color text not null default '#00a63e',
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Planned items: recurring / one-time expenses (and expected income) ---------
create table public.planned_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bucket_id uuid references public.buckets (id) on delete set null,
  kind public.plan_kind not null default 'expense',
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency public.currency_code not null default 'MXN',
  frequency public.plan_frequency not null default 'monthly',
  start_date date not null default current_date,
  end_date date,
  logo_domain text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index funds_user_id_idx on public.funds (user_id);
create index buckets_user_id_idx on public.buckets (user_id);
create index planned_items_user_id_idx on public.planned_items (user_id);
create index planned_items_bucket_id_idx on public.planned_items (bucket_id);

create trigger funds_touch before update on public.funds
  for each row execute function public.touch_updated_at();
create trigger buckets_touch before update on public.buckets
  for each row execute function public.touch_updated_at();
create trigger planned_items_touch before update on public.planned_items
  for each row execute function public.touch_updated_at();

-- Row level security ----------------------------------------------------------
alter table public.funds enable row level security;
alter table public.buckets enable row level security;
alter table public.planned_items enable row level security;

create policy "own funds" on public.funds for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own buckets" on public.buckets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own planned items" on public.planned_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Realtime --------------------------------------------------------------------
alter publication supabase_realtime add table public.funds, public.buckets, public.planned_items;
