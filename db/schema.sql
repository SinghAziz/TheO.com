-- O — schema for your own Supabase project.
-- Run this ONCE in Supabase → SQL editor (it is safe to re-run).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  linkedin_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.startup_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  startup_name text not null default '',
  one_liner text not null default '',
  sector text not null default '',
  stage text not null default '',
  city text not null default '',
  location text not null default '',
  business_model text not null default '',
  funding_required numeric not null default 0,
  revenue numeric not null default 0,
  monthly_growth numeric not null default 0,
  employees integer not null default 1,
  dpiit_registered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.startup_profiles to authenticated;
grant all on public.startup_profiles to service_role;

alter table public.startup_profiles enable row level security;

drop policy if exists "startup_select_own" on public.startup_profiles;
create policy "startup_select_own" on public.startup_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "startup_insert_own" on public.startup_profiles;
create policy "startup_insert_own" on public.startup_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "startup_update_own" on public.startup_profiles;
create policy "startup_update_own" on public.startup_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- KPI profile: one row per startup profile (auth.users → profiles → startup_profiles → startup_kpis).
-- Every column is nullable: NULL means "not provided", which is NOT the same as 0.
create table if not exists public.startup_kpis (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null unique references public.startup_profiles(id) on delete cascade,
  monthly_revenue numeric,
  previous_month_revenue numeric,
  cash_balance numeric,
  monthly_burn numeric,
  total_customers numeric,
  cac numeric,
  average_revenue_per_customer numeric,
  gross_margin numeric,
  monthly_churn numeric,
  nrr numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.startup_kpis to authenticated;
grant all on public.startup_kpis to service_role;

alter table public.startup_kpis enable row level security;

drop policy if exists "kpis_select_own" on public.startup_kpis;
create policy "kpis_select_own" on public.startup_kpis
  for select to authenticated using (
    exists (
      select 1 from public.startup_profiles sp
      where sp.id = startup_kpis.startup_id and sp.user_id = auth.uid()
    )
  );

drop policy if exists "kpis_insert_own" on public.startup_kpis;
create policy "kpis_insert_own" on public.startup_kpis
  for insert to authenticated with check (
    exists (
      select 1 from public.startup_profiles sp
      where sp.id = startup_kpis.startup_id and sp.user_id = auth.uid()
    )
  );

drop policy if exists "kpis_update_own" on public.startup_kpis;
create policy "kpis_update_own" on public.startup_kpis
  for update to authenticated using (
    exists (
      select 1 from public.startup_profiles sp
      where sp.id = startup_kpis.startup_id and sp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.startup_profiles sp
      where sp.id = startup_kpis.startup_id and sp.user_id = auth.uid()
    )
  );

-- keep updated_at fresh

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists startup_touch on public.startup_profiles;
create trigger startup_touch before update on public.startup_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists kpis_touch on public.startup_kpis;
create trigger kpis_touch before update on public.startup_kpis
  for each row execute function public.touch_updated_at();



-- create a profile row automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
