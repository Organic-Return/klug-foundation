-- Saved Properties: per-user favourites for MLS + off-market listings.
-- Run once in Supabase SQL Editor.

create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null,
  listing_type text not null check (listing_type in ('mls', 'off_market')),
  created_at timestamptz not null default now(),
  unique (user_id, listing_id, listing_type)
);

create index if not exists saved_properties_user_id_idx
  on public.saved_properties (user_id);

alter table public.saved_properties enable row level security;

-- Users can read only their own saves
drop policy if exists "Users read own saved properties" on public.saved_properties;
create policy "Users read own saved properties"
  on public.saved_properties for select
  using (auth.uid() = user_id);

-- Users can insert saves only for themselves
drop policy if exists "Users insert own saved properties" on public.saved_properties;
create policy "Users insert own saved properties"
  on public.saved_properties for insert
  with check (auth.uid() = user_id);

-- Users can delete only their own saves
drop policy if exists "Users delete own saved properties" on public.saved_properties;
create policy "Users delete own saved properties"
  on public.saved_properties for delete
  using (auth.uid() = user_id);
