-- Add paid-click attribution columns to the leads table.
--
-- Why: UTMCapture (client side) already records gclid (Google Ads), fbclid
-- (Facebook/Meta), msclkid (Microsoft/Bing), and landing_page on first visit.
-- These flow to GTM's dataLayer for conversion tracking, but until this
-- migration runs the API drops them on insert and the dashboard has no way
-- to display per-lead paid attribution.
--
-- After running this:
--   1. /api/contact + /api/leads will persist these fields.
--   2. The agent dashboard expanded row shows them next to UTM.
--   3. The Sources summary widget can roll them up.
--
-- Safe to re-run: every ADD uses IF NOT EXISTS.

alter table public.leads
  add column if not exists gclid        text,
  add column if not exists fbclid       text,
  add column if not exists msclkid      text,
  add column if not exists landing_page text;

-- Helpful indexes for the Sources rollup queries. Partial indexes (WHERE
-- ... is not null) keep them small since most leads come from direct/organic.
create index if not exists leads_utm_source_created_idx
  on public.leads (utm_source, created_at desc)
  where utm_source is not null;

create index if not exists leads_utm_campaign_created_idx
  on public.leads (utm_campaign, created_at desc)
  where utm_campaign is not null;

create index if not exists leads_gclid_idx
  on public.leads (gclid)
  where gclid is not null;

-- Verify (optional):
--   select column_name, data_type
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'leads'
--      and column_name in ('gclid','fbclid','msclkid','landing_page');
