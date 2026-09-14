import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSiteKey } from './site';

export interface AgentProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  site: string | null;
  sanity_team_member_id: string | null;
  created_at: string;
}

/**
 * Verify the request has a valid Supabase auth session and return the agent profile.
 */
export async function getAuthenticatedAgent(request: NextRequest): Promise<AgentProfile | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  const supabase = createClient(url, serviceKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('id', user.id)
    // A login only counts on the site its profile belongs to; the same
    // Supabase project serves several websites.
    .eq('site', getSiteKey())
    .single();

  return profile as AgentProfile | null;
}

/**
 * Require admin role. Returns the profile if admin, or null.
 */
export async function requireAdmin(request: NextRequest): Promise<AgentProfile | null> {
  const profile = await getAuthenticatedAgent(request);
  if (!profile || profile.role !== 'admin') return null;
  return profile;
}
