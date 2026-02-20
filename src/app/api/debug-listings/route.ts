import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    __version: 'v7-all-statuses',
    __timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Get ALL distinct non-Closed/non-Sold statuses with counts
  const { data: nonClosedSample } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .not('status', 'eq', 'Closed')
    .not('status', 'eq', 'Sold')
    .limit(1000);

  const nonClosedStatuses: Record<string, number> = {};
  (nonClosedSample || []).forEach((r: any) => {
    nonClosedStatuses[r.status] = (nonClosedStatuses[r.status] || 0) + 1;
  });
  diagnostics.nonClosedStatuses = nonClosedStatuses;

  // 2. Count residential listings per status
  const { data: resSample } = await supabase
    .from('graphql_listings')
    .select('status')
    .eq('property_type', 'Residential')
    .not('status', 'is', null)
    .not('status', 'eq', 'Closed')
    .not('status', 'eq', 'Sold')
    .limit(1000);

  const resStatuses: Record<string, number> = {};
  (resSample || []).forEach((r: any) => {
    resStatuses[r.status] = (resStatuses[r.status] || 0) + 1;
  });
  diagnostics.residentialByStatus = resStatuses;

  // 3. Count residential listings with NULL status
  const { count: resNullStatus } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('property_type', 'Residential')
    .is('status', null);

  diagnostics.residentialNullStatus = resNullStatus;

  // 4. Total counts per allowed status
  const allowedStatuses = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending'];
  for (const s of allowedStatuses) {
    const { count } = await supabase
      .from('graphql_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', s);
    diagnostics[`count_${s.replace(/\s+/g, '_')}`] = count;
  }

  return NextResponse.json(diagnostics);
}
