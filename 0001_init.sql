-- PlacementPrep AI — initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` / the CLI migration workflow.

create extension if not exists pgcrypto;

create table if not exists public.prep_packs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  company       text,
  track         text not null check (
                  track in (
                    'marketing', 'consulting', 'product',
                    'analytics', 'sales', 'general_management'
                  )
                ),
  jd_text       text not null,
  resume_text   text not null,
  pack          jsonb not null,
  practiced     jsonb not null default '{}'::jsonb,
  notes         jsonb not null default '{}'::jsonb,
  status        text not null default 'in_progress' check (
                  status in ('in_progress', 'interview_ready')
                ),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists prep_packs_user_id_idx on public.prep_packs (user_id);
create index if not exists prep_packs_user_created_idx on public.prep_packs (user_id, created_at desc);

-- Keep updated_at current on every row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prep_packs_set_updated_at on public.prep_packs;
create trigger prep_packs_set_updated_at
  before update on public.prep_packs
  for each row
  execute function public.set_updated_at();

-- Row Level Security: every user can only ever see/touch their own packs.
alter table public.prep_packs enable row level security;

drop policy if exists "Users can view own packs" on public.prep_packs;
create policy "Users can view own packs"
  on public.prep_packs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own packs" on public.prep_packs;
create policy "Users can insert own packs"
  on public.prep_packs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own packs" on public.prep_packs;
create policy "Users can update own packs"
  on public.prep_packs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own packs" on public.prep_packs;
create policy "Users can delete own packs"
  on public.prep_packs for delete
  using (auth.uid() = user_id);

-- Global daily generation count, used to enforce MAX_DAILY_GENERATIONS.
-- SECURITY DEFINER so it can count across all users without granting
-- direct cross-user table access (RLS above still blocks row reads).
-- Only ever returns a count, never row contents.
create or replace function public.generations_today_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.prep_packs
  where created_at >= date_trunc('day', timezone('utc', now()));
$$;

grant execute on function public.generations_today_count() to authenticated;
