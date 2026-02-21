import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const diagnostics: Record<string, any> = { __version: 'v4-column-check' };

  // 1. Check the view (graphql_listings) - works even with RLS
  const { data: viewData, error: viewError } = await supabase
    .from('graphql_listings')
    .select('*')
    .or(`id.eq.${id},listing_id.eq.${id}`)
    .limit(1);

  if (viewError) {
    diagnostics.viewError = viewError.message;
  } else if (viewData?.[0]) {
    const r: any = viewData[0];
    diagnostics.view = {
      id: r.id,
      listing_id: r.listing_id,
      status: r.status,
      address: r.address,
      city: r.city,
      property_type: r.property_type,
      media_is_null: r.media === null,
      media_typeof: typeof r.media,
      media_isArray: Array.isArray(r.media),
      media_length: Array.isArray(r.media) ? r.media.length : null,
      media_preview: r.media === null ? null : (typeof r.media === 'string' ? r.media.slice(0, 500) : JSON.stringify(r.media).slice(0, 500)),
      preferred_photo: r.preferred_photo,
    };
  } else {
    diagnostics.view = 'NOT FOUND';
  }

  // 2. Try rc-listings with specific columns (not select *)
  const listingId = viewData?.[0]?.listing_id || id;
  const { data: rawSpecific, error: rawSpecificError } = await supabase
    .from('rc-listings')
    .select('id, "ListingId", "StandardStatus", "MlsStatus", "Media", "UnparsedAddress"')
    .or(`id.eq.${parseInt(id)},"ListingId".eq.${listingId}`)
    .limit(3);

  diagnostics.rawSpecific = {
    error: rawSpecificError?.message || null,
    count: rawSpecific?.length || 0,
    rows: (rawSpecific || []).map((r: any) => ({
      id: r.id,
      ListingId: r.ListingId,
      status: r.StandardStatus || r.MlsStatus,
      address: r.UnparsedAddress,
      Media_is_null: r.Media === null,
      Media_typeof: typeof r.Media,
      Media_preview: r.Media === null ? null : (typeof r.Media === 'string' ? r.Media.slice(0, 300) : JSON.stringify(r.Media).slice(0, 300)),
    })),
  };

  // 3. Count rows in rc-listings (check if RLS is blocking)
  const { count: rcCount, error: rcCountError } = await supabase
    .from('rc-listings')
    .select('*', { count: 'exact', head: true });

  diagnostics.rcListingsAccess = {
    totalCount: rcCount,
    error: rcCountError?.message || null,
  };

  // 4. Check media_lookup
  const { data: lookupData, error: lookupError } = await supabase
    .from('media_lookup')
    .select('listing_id, media')
    .eq('listing_id', listingId)
    .limit(1);

  if (lookupError) {
    diagnostics.mediaLookupError = lookupError.message;
  } else if (lookupData && lookupData.length > 0) {
    const m: any = lookupData[0].media;
    diagnostics.mediaLookup = {
      found: true,
      media_typeof: typeof m,
      media_preview: m === null ? null : (typeof m === 'string' ? m.slice(0, 300) : JSON.stringify(m).slice(0, 300)),
    };
  } else {
    diagnostics.mediaLookup = { found: false };
  }

  return NextResponse.json(diagnostics);
}
