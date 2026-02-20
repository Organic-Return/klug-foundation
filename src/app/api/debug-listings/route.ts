import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getMLSConfiguration, getAllowedCities, getExcludedStatuses } from '@/lib/mlsConfiguration';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

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

  // 2. Total row count
  const { error: countError, count } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true });

  diagnostics.totalRows = count;
  diagnostics.tableError = countError?.message || null;

  // 3. MLS Configuration
  const mlsConfig = await getMLSConfiguration();
  diagnostics.mlsConfigExists = !!mlsConfig;
  diagnostics.allowedCities = getAllowedCities(mlsConfig);
  diagnostics.excludedStatuses = getExcludedStatuses(mlsConfig);

  // 4. Run the exact getListings query (default - no filters)
  const allExcludedStatuses = [...new Set([...getExcludedStatuses(mlsConfig), 'Closed', 'Sold'])];
  diagnostics.allExcludedStatuses = allExcludedStatuses;

  try {
    const startTime = Date.now();
    const result = await getListings(1, 24, {
      excludedPropertyTypes: [],
      excludedPropertySubTypes: [],
      allowedCities: getAllowedCities(mlsConfig),
      excludedStatuses: allExcludedStatuses,
      sort: 'newest',
    });
    diagnostics.getListingsTime = `${Date.now() - startTime}ms`;
    diagnostics.getListingsTotal = result.total;
    diagnostics.getListingsCount = result.listings.length;
    diagnostics.getListingsFirstListing = result.listings[0] ? {
      id: result.listings[0].id,
      address: result.listings[0].address,
      status: result.listings[0].status,
      city: result.listings[0].city,
    } : null;
  } catch (e: any) {
    diagnostics.getListingsError = e.message;
  }

  // 5. Raw Supabase query matching getListings logic
  try {
    const startTime = Date.now();
    const { data, error, count: rawCount } = await supabase
      .from('graphql_listings')
      .select('id, listing_id, status, city, list_price, listing_date', { count: 'exact' })
      .or(`status.not.in.(${allExcludedStatuses.join(',')}),status.is.null`)
      .order('listing_date', { ascending: false, nullsFirst: false })
      .range(0, 4);

    diagnostics.rawQueryTime = `${Date.now() - startTime}ms`;
    diagnostics.rawQueryCount = rawCount;
    diagnostics.rawQueryError = error?.message || null;
    diagnostics.rawQueryData = data;
  } catch (e: any) {
    diagnostics.rawQueryError = e.message;
  }

  // 6. Manual status count
  for (const status of ['Active', 'Pending', 'Closed', 'Sold']) {
    const { count: sc } = await supabase
      .from('graphql_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    diagnostics[`status_${status}_count`] = sc;
  }

  // NULL status count
  const { count: nullStatusCount } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .is('status', null);
  diagnostics.status_null_count = nullStatusCount;

  // 7. Check photo/media columns for active listings
  const { data: photoSample } = await supabase
    .from('graphql_listings')
    .select('listing_id, preferred_photo, media')
    .eq('status', 'Active')
    .not('list_price', 'is', null)
    .order('list_price', { ascending: false })
    .limit(3);

  diagnostics.photoSample = photoSample?.map((r: any) => ({
    listing_id: r.listing_id,
    preferred_photo: r.preferred_photo ? r.preferred_photo.substring(0, 120) : null,
    media_type: r.media === null ? 'null' : Array.isArray(r.media) ? `array[${r.media.length}]` : typeof r.media,
    media_preview: r.media ? JSON.stringify(r.media).substring(0, 200) : null,
  }));

  // 8. Count active listings with/without photos
  const { count: activeWithMedia } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .not('media', 'is', null);
  diagnostics.activeWithMedia = activeWithMedia;

  const { count: activeWithPhoto } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .not('preferred_photo', 'is', null);
  diagnostics.activeWithPreferredPhoto = activeWithPhoto;

  diagnostics.activeTotal = diagnostics.status_Active_count;

  // 9. Sample an active listing that HAS media
  const { data: withMediaSample } = await supabase
    .from('graphql_listings')
    .select('listing_id, address, city, preferred_photo, media')
    .eq('status', 'Active')
    .not('media', 'is', null)
    .limit(1);

  if (withMediaSample?.[0]) {
    const r = withMediaSample[0];
    const mediaArr = Array.isArray(r.media) ? r.media : [];
    diagnostics.sampleWithMedia = {
      listing_id: r.listing_id,
      address: r.address,
      preferred_photo: r.preferred_photo,
      media_count: mediaArr.length,
      first_media_item: mediaArr[0] ? JSON.stringify(mediaArr[0]).substring(0, 300) : null,
    };
  }

  return NextResponse.json(diagnostics);
}
