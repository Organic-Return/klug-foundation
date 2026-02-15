import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { realogySupabase, isRealogyConfigured } from '@/lib/realogySupabase';
import {
  parseRemarks,
  parseRemarksHtml,
  normalizePhotoUrl,
  formatOfficeAddress,
  parseMlsNumbers,
} from '@/lib/realogyHelpers';

// Search agents from the Realogy database (realogy_agents table)
async function searchRealogyAgents(search: string) {
  const searchParts = search.trim().split(/\s+/);

  let query = realogySupabase
    .from('realogy_agents')
    .select('first_name, last_name, photo_url, rfg_staff_id, entity_id, id, office_name, email, specialty')
    .not('first_name', 'is', null)
    .not('last_name', 'is', null);

  if (searchParts.length >= 2) {
    const first = searchParts[0];
    const last = searchParts.slice(1).join(' ');
    query = query
      .ilike('first_name', `%${first}%`)
      .ilike('last_name', `%${last}%`);
  } else {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,office_name.ilike.%${search}%`);
  }

  query = query
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(200);

  const { data, error } = await query;

  if (error) {
    console.error('Error searching realogy agents:', error);
    return [];
  }

  return (data || [])
    .filter(agent => agent.first_name && agent.last_name)
    .map(agent => ({
      agentStaffId: String(agent.rfg_staff_id || agent.entity_id || agent.id),
      databaseId: String(agent.id),
      firstName: agent.first_name,
      lastName: agent.last_name,
      office: agent.office_name || '',
      photoUrl: normalizePhotoUrl(agent.photo_url),
    }));
}

// Fetch a single agent from the Realogy database by ID
async function getRealogyAgent(agentStaffId: string, firstName?: string | null, lastName?: string | null) {
  let query = realogySupabase
    .from('realogy_agents')
    .select('first_name, last_name, photo_url, rfg_staff_id, entity_id, id, remarks, office_name');

  // id and entity_id are UUID columns — only compare against them if the value looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(agentStaffId);
  if (isUUID) {
    query = query.or(`rfg_staff_id.eq.${agentStaffId},entity_id.eq.${agentStaffId},id.eq.${agentStaffId}`);
  } else {
    query = query.eq('rfg_staff_id', agentStaffId);
  }

  if (firstName) query = query.ilike('first_name', firstName);
  if (lastName) query = query.ilike('last_name', lastName);

  const { data, error } = await query.limit(1).single();

  if (error || !data) return null;

  return {
    agentStaffId: data.rfg_staff_id || data.entity_id || data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    photoUrl: normalizePhotoUrl(data.photo_url),
    bio: parseRemarks(data.remarks),
  };
}

// Fetch full agent details from Realogy database (for SIR import)
// Uses the unique database UUID (id column) for exact lookup
async function getRealogyAgentFull(databaseId: string) {
  const query = realogySupabase
    .from('realogy_agents')
    .select(`
      first_name, last_name, photo_url, rfg_staff_id, entity_id, id,
      remarks, office_name, email, lead_email,
      business_phone, mobile_phone, office_phone,
      office_address, mls_numbers, specialty
    `)
    .eq('id', databaseId);

  const { data, error } = await query.limit(1).single();
  if (error || !data) return null;

  return {
    agentStaffId: data.rfg_staff_id || data.entity_id || data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    photoUrl: normalizePhotoUrl(data.photo_url),
    bio: parseRemarksHtml(data.remarks),
    email: data.email || data.lead_email || '',
    businessPhone: data.business_phone || '',
    mobilePhone: data.mobile_phone || '',
    officePhone: data.office_phone || '',
    officeName: data.office_name || '',
    officeAddress: formatOfficeAddress(data.office_address),
    mlsNumbers: parseMlsNumbers(data.mls_numbers),
    specialty: data.specialty || '',
  };
}

export async function GET(request: Request) {
  const useRealogy = isRealogyConfigured();
  if (!useRealogy && !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentStaffId = searchParams.get('agentStaffId');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const list = searchParams.get('list');
    const search = searchParams.get('search');
    const count = searchParams.get('count');
    const full = searchParams.get('full');

    // If count=true, return the total count of agents
    if (count === 'true') {
      if (useRealogy) {
        const { count: totalCount } = await realogySupabase
          .from('realogy_agents')
          .select('*', { count: 'exact', head: true });
        const { count: validNameCount } = await realogySupabase
          .from('realogy_agents')
          .select('*', { count: 'exact', head: true })
          .not('first_name', 'is', null)
          .not('last_name', 'is', null);
        return NextResponse.json({ totalRecords: totalCount, recordsWithValidNames: validNameCount });
      }

      const { count: totalCount, error } = await supabase
        .from('anywhere_agents')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting agents:', error);
        return NextResponse.json(
          { error: 'Failed to count agents', details: error.message },
          { status: 500 }
        );
      }

      const { count: validNameCount } = await supabase
        .from('anywhere_agents')
        .select('*', { count: 'exact', head: true })
        .not('first_name', 'is', null)
        .not('last_name', 'is', null);

      return NextResponse.json({
        totalRecords: totalCount,
        recordsWithValidNames: validNameCount,
      });
    }

    // If list=true, search for agents
    if (list === 'true') {
      if (!search || search.trim().length < 2) {
        return NextResponse.json({
          agents: [],
          message: 'Please enter at least 2 characters to search'
        });
      }

      // Search Realogy database if configured
      if (useRealogy) {
        const agents = await searchRealogyAgents(search);
        return NextResponse.json({ agents, total: agents.length });
      }

      // Fall back to legacy anywhere_agents table
      const searchParts = search.trim().split(/\s+/);

      let query = supabase
        .from('anywhere_agents')
        .select('first_name, last_name, agent_summary_default_photo_u_r_l, summary_r_f_g_staff_id, agent_summary_r_f_g_staff_id, id, office_name')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null);

      if (searchParts.length >= 2) {
        const first = searchParts[0];
        const last = searchParts.slice(1).join(' ');
        query = query
          .ilike('first_name', `%${first}%`)
          .ilike('last_name', `%${last}%`);
      } else {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,office_name.ilike.%${search}%`);
      }

      query = query
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(200);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching agents list:', error);
        return NextResponse.json(
          { error: 'Failed to fetch agents', details: error.message },
          { status: 500 }
        );
      }

      const agents = (data || [])
        .filter(agent => agent.first_name && agent.last_name)
        .map(agent => ({
          agentStaffId: String(agent.summary_r_f_g_staff_id || agent.agent_summary_r_f_g_staff_id || agent.id),
          firstName: agent.first_name,
          lastName: agent.last_name,
          office: agent.office_name || '',
          photoUrl: normalizePhotoUrl(agent.agent_summary_default_photo_u_r_l),
        }));

      return NextResponse.json({ agents, total: agents.length });
    }

    if (!agentStaffId) {
      return NextResponse.json(
        { error: 'agentStaffId is required' },
        { status: 400 }
      );
    }

    // Fetch single agent — try Realogy first if configured
    if (useRealogy) {
      if (full === 'true') {
        const rawDbId = searchParams.get('databaseId');
        const databaseId = (rawDbId && rawDbId !== 'undefined') ? rawDbId : null;
        if (databaseId) {
          const agent = await getRealogyAgentFull(databaseId);
          if (agent) return NextResponse.json(agent);
        }
        // Fall back to name-filtered lookup if no valid databaseId
        const fallbackAgent = await getRealogyAgent(agentStaffId, firstName, lastName);
        if (fallbackAgent) return NextResponse.json(fallbackAgent);
      } else {
        const agent = await getRealogyAgent(agentStaffId, firstName, lastName);
        if (agent) return NextResponse.json(agent);
      }
    }

    // Fall back to legacy anywhere_agents table
    let query = supabase
      .from('anywhere_agents')
      .select('first_name, last_name, agent_summary_default_photo_u_r_l, remarks, summary_r_f_g_staff_id, agent_summary_r_f_g_staff_id, id')
      .or(`summary_r_f_g_staff_id.eq.${agentStaffId},agent_summary_r_f_g_staff_id.eq.${agentStaffId},id.eq.${agentStaffId}`);

    if (firstName) {
      query = query.ilike('first_name', firstName);
    }
    if (lastName) {
      query = query.ilike('last_name', lastName);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      console.error('Error fetching agent:', error);
      return NextResponse.json(
        { error: 'Agent not found', details: error.message },
        { status: 404 }
      );
    }

    const bio = parseRemarks(data.remarks);
    const photoUrl = normalizePhotoUrl(data.agent_summary_default_photo_u_r_l);

    return NextResponse.json({
      agentStaffId: data.summary_r_f_g_staff_id || data.agent_summary_r_f_g_staff_id || data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      photoUrl: photoUrl,
      bio: bio,
    });
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
