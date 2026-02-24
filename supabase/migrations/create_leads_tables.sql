-- Lead Management System: leads + agent_profiles tables

-- ============================================================
-- Table: leads
-- Stores all form submissions with source/UTM tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,

  -- Lead classification
  lead_type TEXT NOT NULL DEFAULT 'general',  -- 'property_inquiry', 'schedule_tour', 'general', 'contact'
  inquiry_type TEXT,                           -- 'general', 'pricing', 'financing', 'neighborhood'

  -- Property context (nullable for non-listing forms)
  property_address TEXT,
  property_mls_id TEXT,
  property_price NUMERIC,

  -- Agent routing
  assigned_agent_email TEXT,      -- email of agent who received the lead
  assigned_agent_name TEXT,
  is_company_listing BOOLEAN DEFAULT false,

  -- Source tracking
  source TEXT DEFAULT 'website',
  source_url TEXT,                -- full page URL where form was submitted
  referrer TEXT,                  -- document.referrer

  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Status
  status TEXT DEFAULT 'new',      -- 'new', 'contacted', 'qualified', 'closed'
  notes TEXT,

  -- CRM sync
  cloze_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads (assigned_agent_email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_property_mls ON leads (property_mls_id);

-- ============================================================
-- Table: agent_profiles
-- Links Supabase auth users to their agent identity and role
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',   -- 'agent' or 'admin'
  sanity_team_member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_agent_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT role FROM agent_profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION get_my_agent_email()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT email FROM agent_profiles WHERE id = auth.uid() $$;

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Agents see only their own leads
CREATE POLICY "Agents see own leads" ON leads FOR SELECT
  USING (assigned_agent_email = get_my_agent_email());

-- Admins see all leads
CREATE POLICY "Admins see all leads" ON leads FOR SELECT
  USING (get_my_agent_role() = 'admin');

-- Agents can update status/notes on their own leads
CREATE POLICY "Agents update own leads" ON leads FOR UPDATE
  USING (assigned_agent_email = get_my_agent_email())
  WITH CHECK (assigned_agent_email = get_my_agent_email());

-- Admins can update any lead
CREATE POLICY "Admins update all leads" ON leads FOR UPDATE
  USING (get_my_agent_role() = 'admin');

-- Service role (API) can insert leads (no auth required for inserts from server)
CREATE POLICY "Service role inserts leads" ON leads FOR INSERT
  WITH CHECK (true);

-- Agent profiles: users see their own profile
CREATE POLICY "Users see own profile" ON agent_profiles FOR SELECT
  USING (id = auth.uid());

-- Admins see all profiles
CREATE POLICY "Admins see all profiles" ON agent_profiles FOR SELECT
  USING (get_my_agent_role() = 'admin');
