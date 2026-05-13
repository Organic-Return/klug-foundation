-- Multi-site support: stamp every site-generated row with which deployment
-- created it, so a shared Supabase project can back N sister sites without
-- the data cross-bleeding.
--
-- Run once in Supabase SQL Editor.

-- ── leads ──────────────────────────────────────────────────────
alter table public.leads
  add column if not exists site text not null default 'klug';

create index if not exists leads_site_idx on public.leads (site);

-- Backfill any pre-existing rows to 'klug' (the default already does this
-- for new rows, but we set explicitly to keep history searchable).
update public.leads set site = 'klug' where site is null;

-- ── saved_properties ──────────────────────────────────────────
alter table public.saved_properties
  add column if not exists site text not null default 'klug';

create index if not exists saved_properties_site_idx on public.saved_properties (site);

update public.saved_properties set site = 'klug' where site is null;

-- ── RLS update for saved_properties ──────────────────────────
-- Replace the existing read/insert/delete policies so they additionally
-- scope to the current site value (passed in by the client via the
-- inserted row, or matched at read time). This means a user who saved
-- a property on klug-foundation won't see it on skk-foundation, even
-- though both sites share auth.users.

drop policy if exists "Users read own saved properties" on public.saved_properties;
drop policy if exists "Users insert own saved properties" on public.saved_properties;
drop policy if exists "Users delete own saved properties" on public.saved_properties;

create policy "Users read own saved properties"
  on public.saved_properties for select
  using (auth.uid() = user_id);

create policy "Users insert own saved properties"
  on public.saved_properties for insert
  with check (auth.uid() = user_id);

create policy "Users delete own saved properties"
  on public.saved_properties for delete
  using (auth.uid() = user_id);

-- We deliberately keep RLS scoped to user_id only — the client filters by
-- site at query time via .eq('site', SITE_KEY). RLS by site would block
-- a future "merge my klug + skk favorites" feature.
