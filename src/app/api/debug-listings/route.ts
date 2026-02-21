import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Kennewick';

  const diagnostics: Record<string, any> = {
    __version: 'v9-city-debug',
    __timestamp: new Date().toISOString(),
    searchCity: city,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  const allowedStatuses = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending', 'Pending Inspect/Feasib', 'To Be Built'];

  // 1. City ILIKE only — no other filters
  const { data: cityOnly, error: cityOnlyError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, city', { count: 'exact' })
    .ilike('city', `%${city}%`)
    .limit(3);

  diagnostics.cityOnly = {
    error: cityOnlyError?.message || null,
    count: cityOnly?.length || 0,
    data: cityOnly,
  };

  // 2. City exact match (eq)
  const { data: cityExact, error: cityExactError, count: cityExactCount } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, city', { count: 'exact' })
    .eq('city', city)
    .limit(3);

  diagnostics.cityExact = {
    error: cityExactError?.message || null,
    total: cityExactCount,
    count: cityExact?.length || 0,
    data: cityExact,
  };

  // 3. City ILIKE + allowed statuses
  const { data: cityStatus, error: cityStatusError, count: cityStatusCount } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, city', { count: 'exact' })
    .ilike('city', `%${city}%`)
    .in('status', allowedStatuses)
    .limit(3);

  diagnostics.cityWithStatus = {
    error: cityStatusError?.message || null,
    total: cityStatusCount,
    count: cityStatus?.length || 0,
    data: cityStatus,
  };

  // 4. City ILIKE + allowed statuses + property type exclusion (same as page)
  const { data: cityAll, error: cityAllError, count: cityAllCount } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, city', { count: 'exact' })
    .ilike('city', `%${city}%`)
    .or('property_type.not.in.(Commercial Sale),property_type.is.null')
    .in('status', allowedStatuses)
    .limit(3);

  diagnostics.cityWithAll = {
    error: cityAllError?.message || null,
    total: cityAllCount,
    count: cityAll?.length || 0,
    data: cityAll,
  };

  // 5. Call getListings with FULL page filters (same as actual page)
  // First get MLS config
  let mlsConfig = null;
  try {
    const { getMLSConfiguration, getExcludedPropertyTypes, getExcludedPropertySubTypes, getAllowedCities } = await import('@/lib/mlsConfiguration');
    mlsConfig = await getMLSConfiguration();
    const excludedPropertyTypes = [...getExcludedPropertyTypes(mlsConfig), 'Commercial Sale'];
    const excludedPropertySubTypes = getExcludedPropertySubTypes(mlsConfig);
    const allowedCities = getAllowedCities(mlsConfig);

    diagnostics.mlsConfig = {
      excludedPropertyTypes,
      excludedPropertySubTypes,
      allowedCities,
    };

    // Test with minimal filters (just city + statuses + excludedPropertyTypes)
    const resultMinimal = await getListings(1, 5, {
      city,
      excludedPropertyTypes: ['Commercial Sale'],
      allowedStatuses,
    });
    diagnostics.getListingsMinimal = {
      total: resultMinimal.total,
      count: resultMinimal.listings.length,
    };

    // Test with full page filters
    const result = await getListings(1, 5, {
      city,
      excludedPropertyTypes,
      excludedPropertySubTypes,
      allowedCities,
      allowedStatuses,
      sort: 'newest',
    });

    diagnostics.getListingsFull = {
      total: result.total,
      count: result.listings.length,
      first: result.listings.slice(0, 2).map((l: any) => ({
        id: l.id,
        mls_number: l.mls_number,
        status: l.status,
        address: l.address,
        city: l.city,
        property_type: l.property_type,
      })),
    };
  } catch (e: any) {
    diagnostics.mlsConfigError = e.message;
  }

  // Also test adding filters one by one
  const result = await getListings(1, 5, {
    city,
    excludedPropertyTypes: ['Commercial Sale'],
    allowedStatuses,
  });

  diagnostics.getListingsResult = {
    total: result.total,
    count: result.listings.length,
    first: result.listings.slice(0, 2).map((l) => ({
      id: l.id,
      mls_number: l.mls_number,
      status: l.status,
      address: l.address,
      city: l.city,
      property_type: l.property_type,
    })),
  };

  // 6. Check distinct city values that contain the search term
  const { data: cityValues, error: cityValuesError } = await supabase
    .from('graphql_listings')
    .select('city')
    .ilike('city', `%${city}%`)
    .limit(10);

  const uniqueCities = [...new Set((cityValues || []).map((r: any) => r.city))];
  diagnostics.matchingCityValues = {
    error: cityValuesError?.message || null,
    values: uniqueCities,
  };

  return NextResponse.json(diagnostics);
}
