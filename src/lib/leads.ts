import { getSupabaseServer } from './supabase-server';
import { supabase } from './supabase';
import { client } from '@/sanity/client';

// ─── Types ──────────────────────────────────────────────────────────

export interface LeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  leadType: 'property_inquiry' | 'schedule_tour' | 'general' | 'contact';
  inquiryType?: string;
  propertyAddress?: string;
  propertyMlsId?: string;
  propertyPrice?: number;
  source?: string;
  sourceUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface Lead {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  lead_type: string;
  inquiry_type: string | null;
  property_address: string | null;
  property_mls_id: string | null;
  property_price: number | null;
  assigned_agent_email: string | null;
  assigned_agent_name: string | null;
  is_company_listing: boolean;
  source: string | null;
  source_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  status: string;
  notes: string | null;
  cloze_id: string | null;
}

export interface AgentRouting {
  agentEmail: string;
  agentName: string;
  isCompanyListing: boolean;
}

export interface LeadsFilter {
  status?: string;
  leadType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── Lead routing ───────────────────────────────────────────────────

/**
 * Determine which agent should receive the lead email.
 * For property inquiries: look up the listing agent in the MLS data,
 * then match to a Sanity team member to get their email.
 * Falls back to LEAD_FALLBACK_EMAIL.
 */
export async function determineLeadRouting(
  propertyMlsId?: string
): Promise<AgentRouting> {
  const fallbackEmail = process.env.LEAD_FALLBACK_EMAIL || '';

  if (!propertyMlsId) {
    return { agentEmail: fallbackEmail, agentName: '', isCompanyListing: false };
  }

  try {
    // Look up listing to get agent MLS IDs
    const { data: listing } = await supabase
      .from('graphql_listings')
      .select('list_agent_mls_id, co_list_agent_mls_id')
      .eq('listing_id', propertyMlsId)
      .limit(1)
      .single();

    if (!listing) {
      return { agentEmail: fallbackEmail, agentName: '', isCompanyListing: false };
    }

    const agentMlsIds = [
      listing.list_agent_mls_id,
      listing.co_list_agent_mls_id,
    ].filter(Boolean);

    if (agentMlsIds.length === 0) {
      return { agentEmail: fallbackEmail, agentName: '', isCompanyListing: false };
    }

    // Match MLS IDs to Sanity team members
    const teamMembers = await client.fetch<{ name: string; email?: string; mlsAgentId?: string }[]>(
      `*[_type == "teamMember" && inactive != true && (mlsAgentId in $ids || mlsAgentIdSold in $ids)]{
        name, email, mlsAgentId
      }`,
      { ids: agentMlsIds },
      { next: { revalidate: 300 } }
    );

    if (teamMembers.length === 0) {
      return { agentEmail: fallbackEmail, agentName: '', isCompanyListing: false };
    }

    // Prefer the listing agent (not co-listing)
    const listAgentId = listing.list_agent_mls_id;
    const primary = teamMembers.find(m => m.mlsAgentId === listAgentId) || teamMembers[0];

    if (primary.email) {
      return {
        agentEmail: primary.email,
        agentName: primary.name,
        isCompanyListing: true,
      };
    }

    return { agentEmail: fallbackEmail, agentName: primary.name, isCompanyListing: true };
  } catch (error) {
    console.error('Error determining lead routing:', error);
    return { agentEmail: fallbackEmail, agentName: '', isCompanyListing: false };
  }
}

// ─── Lead CRUD ──────────────────────────────────────────────────────

/**
 * Create a lead in Supabase. Uses service role key to bypass RLS.
 */
export async function createLead(
  input: LeadInput,
  routing: AgentRouting
): Promise<Lead | null> {
  const sb = getSupabaseServer();
  if (!sb) {
    console.warn('Supabase server client not configured — cannot store lead');
    return null;
  }

  const { data, error } = await sb
    .from('leads')
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone || null,
      message: input.message || null,
      lead_type: input.leadType,
      inquiry_type: input.inquiryType || null,
      property_address: input.propertyAddress || null,
      property_mls_id: input.propertyMlsId || null,
      property_price: input.propertyPrice || null,
      assigned_agent_email: routing.agentEmail || null,
      assigned_agent_name: routing.agentName || null,
      is_company_listing: routing.isCompanyListing,
      source: input.source || 'website',
      source_url: input.sourceUrl || null,
      referrer: input.referrer || null,
      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      utm_content: input.utmContent || null,
      utm_term: input.utmTerm || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }

  return data as Lead;
}

/**
 * Update a lead's cloze_id after CRM sync.
 */
export async function updateLeadClozeId(leadId: string, clozeId: string): Promise<void> {
  const sb = getSupabaseServer();
  if (!sb) return;

  await sb.from('leads').update({ cloze_id: clozeId }).eq('id', leadId);
}

/**
 * Get leads for a specific agent (via RLS — uses the agent's session).
 */
export async function getLeadsForAgent(
  agentEmail: string,
  filters: LeadsFilter = {}
): Promise<{ leads: Lead[]; total: number }> {
  const sb = getSupabaseServer();
  if (!sb) return { leads: [], total: 0 };

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('assigned_agent_email', agentEmail)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.leadType) query = query.eq('lead_type', filters.leadType);
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching leads for agent:', error);
    return { leads: [], total: 0 };
  }

  return { leads: (data || []) as Lead[], total: count || 0 };
}

/**
 * Get all leads (admin view).
 */
export async function getAllLeads(
  filters: LeadsFilter = {}
): Promise<{ leads: Lead[]; total: number }> {
  const sb = getSupabaseServer();
  if (!sb) return { leads: [], total: 0 };

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.leadType) query = query.eq('lead_type', filters.leadType);
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching all leads:', error);
    return { leads: [], total: 0 };
  }

  return { leads: (data || []) as Lead[], total: count || 0 };
}

/**
 * Update lead status and optional notes.
 */
export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string
): Promise<boolean> {
  const sb = getSupabaseServer();
  if (!sb) return false;

  const update: Record<string, string> = { status };
  if (notes !== undefined) update.notes = notes;

  const { error } = await sb.from('leads').update(update).eq('id', leadId);

  if (error) {
    console.error('Error updating lead status:', error);
    return false;
  }

  return true;
}
