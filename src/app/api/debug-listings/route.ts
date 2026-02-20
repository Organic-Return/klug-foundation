import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    __version: 'v6-property-types',
    __timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Get distinct property_type values from active listings in the view
  const { data: typeSample } = await supabase
    .from('graphql_listings')
    .select('property_type')
    .in('status', ['Active', 'Active Under Contract', 'Active U/C W/ Bump'])
    .not('property_type', 'is', null)
    .limit(1000);

  const typeCounts: Record<string, number> = {};
  (typeSample || []).forEach((r: any) => {
    typeCounts[r.property_type] = (typeCounts[r.property_type] || 0) + 1;
  });
  diagnostics.propertyTypes = typeCounts;

  // 2. Get distinct property_sub_type values from active listings
  const { data: subTypeSample } = await supabase
    .from('graphql_listings')
    .select('property_sub_type')
    .in('status', ['Active', 'Active Under Contract', 'Active U/C W/ Bump'])
    .not('property_sub_type', 'is', null)
    .limit(1000);

  const subTypeCounts: Record<string, number> = {};
  (subTypeSample || []).forEach((r: any) => {
    subTypeCounts[r.property_sub_type] = (subTypeCounts[r.property_sub_type] || 0) + 1;
  });
  diagnostics.propertySubTypes = subTypeCounts;

  // 3. Get distinct status values
  const { data: statusSample } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .limit(1000);

  const statusCounts: Record<string, number> = {};
  (statusSample || []).forEach((r: any) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  diagnostics.statuses = statusCounts;

  // 4. Show what the hardcoded lists currently have
  diagnostics.hardcodedTypes = [
    'Commercial Land', 'Commercial Lease', 'Commercial Sale',
    'Fractional', 'RES Vacant Land', 'Residential', 'Residential Lease',
  ];
  diagnostics.hardcodedSubTypes = [
    'Agricultural', 'Agriculture', 'Business with Real Estate', 'Business with/RE',
    'Commercial', 'Commercial Land', 'Condominium', 'Development', 'Duplex',
    'Half Duplex', 'Leasehold', 'Mobile Home', 'Multi-Family Lot', 'Other',
    'Residential Income', 'Seasonal & Remote', 'Single Family Lot',
    'Single Family Residence', 'Townhouse',
  ];

  return NextResponse.json(diagnostics);
}
