import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getMLSConfiguration, getExcludedPropertyTypes, getExcludedPropertySubTypes, getAllowedCities, getExcludedStatuses } from '@/lib/mlsConfiguration';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const diagnostics: Record<string, any> = {};

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  const url = new URL(request.url);
  const listingId = url.searchParams.get('id');

  // 1. Total count (no filters)
  const { count: totalCount, error: countError } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true });

  diagnostics.totalRows = totalCount;
  diagnostics.countError = countError?.message || null;

  // 2. Distinct statuses
  const { data: statusData } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .limit(500);

  const statusCounts: Record<string, number> = {};
  (statusData || []).forEach((r: any) => {
    const s = r.status || '(null)';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  diagnostics.statusValues = statusCounts;

  // 3. Distinct cities (top 20)
  const { data: cityData } = await supabase
    .from('graphql_listings')
    .select('city')
    .not('city', 'is', null)
    .limit(500);

  const cityCounts: Record<string, number> = {};
  (cityData || []).forEach((r: any) => {
    const c = r.city || '(null)';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  diagnostics.cityValues = cityCounts;

  // 4. MLS Configuration from Sanity
  const mlsConfig = await getMLSConfiguration();
  diagnostics.mlsConfig = {
    exists: !!mlsConfig,
    allowedCities: getAllowedCities(mlsConfig),
    excludedStatuses: getExcludedStatuses(mlsConfig),
    excludedPropertyTypes: getExcludedPropertyTypes(mlsConfig),
    excludedPropertySubTypes: getExcludedPropertySubTypes(mlsConfig),
  };

  // 5. Compute the actual excluded statuses (same as listings page)
  const excludedStatuses = getExcludedStatuses(mlsConfig);
  const allExcludedStatuses = [...new Set([...excludedStatuses, 'Closed', 'Sold'])];
  diagnostics.appliedExcludedStatuses = allExcludedStatuses;

  // 6. Count with only status exclusion applied
  const allowedCities = getAllowedCities(mlsConfig);
  let statusQuery = supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .or(`status.not.in.(${allExcludedStatuses.join(',')}),status.is.null`);

  const { count: afterStatusCount, error: statusFilterError } = await statusQuery;
  diagnostics.countAfterStatusFilter = afterStatusCount;
  diagnostics.statusFilterError = statusFilterError?.message || null;

  // 7. Count with status + city filters
  if (allowedCities.length > 0) {
    let cityQuery = supabase
      .from('graphql_listings')
      .select('*', { count: 'exact', head: true })
      .or(`status.not.in.(${allExcludedStatuses.join(',')}),status.is.null`)
      .in('city', allowedCities);

    const { count: afterCityCount, error: cityFilterError } = await cityQuery;
    diagnostics.countAfterCityFilter = afterCityCount;
    diagnostics.cityFilterError = cityFilterError?.message || null;
  } else {
    diagnostics.countAfterCityFilter = 'N/A (no allowedCities configured)';
  }

  // 8. Debug specific listing if requested
  if (listingId) {
    const { data } = await supabase
      .from('graphql_listings')
      .select('id, listing_id, address, city, status, preferred_photo, media')
      .or(`id.eq.${listingId},listing_id.eq.${listingId}`)
      .limit(1);

    if (data?.[0]) {
      const r = data[0];
      diagnostics.listing = {
        id: r.id,
        listing_id: r.listing_id,
        address: r.address,
        city: r.city,
        status: r.status,
      };
    }
  } else {
    // Sample 5 active listings
    const { data: samples } = await supabase
      .from('graphql_listings')
      .select('id, listing_id, address, city, status, preferred_photo')
      .or(`status.not.in.(${allExcludedStatuses.join(',')}),status.is.null`)
      .order('listing_date', { ascending: false })
      .limit(5);

    diagnostics.sampleActiveListings = (samples || []).map((r: any) => ({
      id: r.id,
      listing_id: r.listing_id,
      address: r.address,
      city: r.city,
      status: r.status,
      has_preferred_photo: !!r.preferred_photo,
    }));
  }

  return NextResponse.json(diagnostics);
}
