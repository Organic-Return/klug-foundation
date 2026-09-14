-- ============================================================
-- Per-site isolation for leads and dashboard logins.
--
-- Several websites share this Supabase project. Each deployment stamps its
-- leads with its LEAD_SITE_KEY ("skk", "klug", "rc", …) and every dashboard
-- query filters on it. Row Level Security below enforces the same boundary
-- for anything talking to the database directly with a user session.
--
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS site TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_site_created ON leads (site, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_site_agent ON leads (site, assigned_agent_email);

-- Any rows that predate this migration belong to nobody in particular; tag
-- them explicitly so they can be reviewed, rather than leaving NULLs that
-- would be invisible to every site.
UPDATE leads SET site = 'unassigned' WHERE site IS NULL;
UPDATE agent_profiles SET site = 'unassigned' WHERE site IS NULL;

CREATE OR REPLACE FUNCTION get_my_agent_site()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT site FROM agent_profiles WHERE id = auth.uid() $$;

-- Replace the site-blind policies with site-aware ones.
DROP POLICY IF EXISTS "Agents see own leads" ON leads;
DROP POLICY IF EXISTS "Admins see all leads" ON leads;
DROP POLICY IF EXISTS "Agents update own leads" ON leads;
DROP POLICY IF EXISTS "Admins update all leads" ON leads;

CREATE POLICY "Agents see own leads" ON leads FOR SELECT
  USING (site = get_my_agent_site() AND assigned_agent_email = get_my_agent_email());

CREATE POLICY "Admins see all leads" ON leads FOR SELECT
  USING (site = get_my_agent_site() AND get_my_agent_role() = 'admin');

CREATE POLICY "Agents update own leads" ON leads FOR UPDATE
  USING (site = get_my_agent_site() AND assigned_agent_email = get_my_agent_email())
  WITH CHECK (site = get_my_agent_site() AND assigned_agent_email = get_my_agent_email());

CREATE POLICY "Admins update all leads" ON leads FOR UPDATE
  USING (site = get_my_agent_site() AND get_my_agent_role() = 'admin')
  WITH CHECK (site = get_my_agent_site());
