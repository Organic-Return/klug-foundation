import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getMLSConfiguration, getAllowedCities, getExcludedStatuses } from '@/lib/mlsConfiguration';

export async function GET() {
  const diagnostics: Record<string, any> = {};

  // 1. Check Supabase config
  diagnostics.supabaseConfigured = isSupabaseConfigured();
  if (!diagnostics.supabaseConfigured) {
    return NextResponse.json({ ...diagnostics, error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ...diagnostics, error: 'Supabase client is null' });
  }

  // 2. Check if graphql_listings table exists and has data
  const { data: countData, error: countError, count } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true });

  diagnostics.tableExists = !countError;
  diagnostics.tableError = countError?.message || null;
  diagnostics.totalRows = count;

  if (countError) {
    return NextResponse.json(diagnostics);
  }

  // 3. Sample a few rows to check column structure
  const { data: sampleData, error: sampleError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, city, property_type, property_sub_type, list_price')
    .limit(5);

  diagnostics.sampleError = sampleError?.message || null;
  diagnostics.sampleRows = sampleData;
  diagnostics.columns = sampleData?.[0] ? Object.keys(sampleData[0]) : [];

  // 4. Get distinct statuses
  const { data: statusData } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .limit(1000);

  diagnostics.distinctStatuses = [...new Set(statusData?.map(d => d.status).filter(Boolean))];

  // 5. Get distinct cities
  const { data: cityData } = await supabase
    .from('graphql_listings')
    .select('city')
    .not('city', 'is', null)
    .limit(1000);

  diagnostics.distinctCities = [...new Set(cityData?.map(d => d.city).filter(Boolean))];

  // 6. Get distinct property types
  const { data: typeData } = await supabase
    .from('graphql_listings')
    .select('property_type')
    .not('property_type', 'is', null)
    .limit(1000);

  diagnostics.distinctPropertyTypes = [...new Set(typeData?.map(d => d.property_type).filter(Boolean))];

  // 7. Check MLS Configuration from Sanity
  const mlsConfig = await getMLSConfiguration();
  diagnostics.mlsConfigExists = !!mlsConfig;
  diagnostics.allowedCities = getAllowedCities(mlsConfig);
  diagnostics.excludedStatuses = getExcludedStatuses(mlsConfig);

  // 8. Check if allowedCities match any data
  if (diagnostics.allowedCities.length > 0) {
    const { count: matchCount } = await supabase
      .from('graphql_listings')
      .select('*', { count: 'exact', head: true })
      .in('city', diagnostics.allowedCities);

    diagnostics.allowedCitiesMatchCount = matchCount;
    diagnostics.mismatchWarning = matchCount === 0
      ? 'PROBLEM: allowedCities in Sanity MLS config do not match any cities in Supabase!'
      : null;
  }

  // 9. Count non-Closed listings (what the page shows by default)
  const { count: activeCount } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .not('status', 'eq', 'Closed');

  diagnostics.nonClosedCount = activeCount;

  return NextResponse.json(diagnostics);
}
