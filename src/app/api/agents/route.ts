import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RemarkItem {
  type?: string;
  remark?: string;
  htmlRemark?: string;
  languageCode?: string;
}

function parseRemarks(remarks: RemarkItem[] | string | null): string {
  if (!remarks) return '';

  // If it's a string, try to parse it as JSON
  if (typeof remarks === 'string') {
    try {
      const parsed = JSON.parse(remarks);
      if (Array.isArray(parsed)) {
        // Find the Personal Profile remark or use the first one
        const personalProfile = parsed.find((r: RemarkItem) => r.type === 'Personal Profile');
        const remarkItem = personalProfile || parsed[0];
        return remarkItem?.remark || remarkItem?.htmlRemark || '';
      }
      return parsed.remark || parsed.Remark || '';
    } catch {
      return remarks;
    }
  }

  // If it's an array, extract the remark
  if (Array.isArray(remarks)) {
    // Find the Personal Profile remark or use the first one
    const personalProfile = remarks.find((r: RemarkItem) => r.type === 'Personal Profile');
    const remarkItem = personalProfile || remarks[0];
    return remarkItem?.remark || remarkItem?.htmlRemark || '';
  }

  return '';
}

function normalizePhotoUrl(url: string | null): string | null {
  if (!url) return null;

  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // If URL doesn't start with http, add https://
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }

  return url;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentStaffId = searchParams.get('agentStaffId');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const list = searchParams.get('list');
    const search = searchParams.get('search');
    const count = searchParams.get('count');

    // If count=true, return the total count of agents in the database
    if (count === 'true') {
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

      // Also get count of agents with valid names (that would appear in search)
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

    // If list=true, search for agents (requires search parameter for performance)
    if (list === 'true') {
      // Require a search term to avoid loading thousands of records
      if (!search || search.trim().length < 2) {
        return NextResponse.json({
          agents: [],
          message: 'Please enter at least 2 characters to search'
        });
      }

      // Check if search contains a space (likely "first last" name search)
      const searchParts = search.trim().split(/\s+/);

      let query = supabase
        .from('anywhere_agents')
        .select('first_name, last_name, agent_summary_default_photo_u_r_l, summary_r_f_g_staff_id, agent_summary_r_f_g_staff_id, id, office_name')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null);

      if (searchParts.length >= 2) {
        // Search for first name AND last name separately
        const firstName = searchParts[0];
        const lastName = searchParts.slice(1).join(' ');
        query = query
          .ilike('first_name', `%${firstName}%`)
          .ilike('last_name', `%${lastName}%`);
      } else {
        // Single term - search across first name, last name, or office
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

    // Query the anywhere_agents table - try multiple ID fields
    // The agent staff ID could be in summary_r_f_g_staff_id or agent_summary_r_f_g_staff_id
    let query = supabase
      .from('anywhere_agents')
      .select('first_name, last_name, agent_summary_default_photo_u_r_l, remarks, summary_r_f_g_staff_id, agent_summary_r_f_g_staff_id, id')
      .or(`summary_r_f_g_staff_id.eq.${agentStaffId},agent_summary_r_f_g_staff_id.eq.${agentStaffId},id.eq.${agentStaffId}`);

    // Add name filters if provided (for additional verification)
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

    // Parse the remarks to extract the bio
    const bio = parseRemarks(data.remarks);

    // Normalize the photo URL (add https: if needed)
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
