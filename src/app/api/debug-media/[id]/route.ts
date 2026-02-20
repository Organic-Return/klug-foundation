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
  const diagnostics: Record<string, any> = { __version: 'v3-raw-columns' };

  // 1. Check the view (graphql_listings)
  const { data: viewData, error: viewError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, preferred_photo, media')
    .or(`id.eq.${id},listing_id.eq.${id}`)
    .limit(1);

  if (viewError) {
    diagnostics.viewError = viewError.message;
  } else if (viewData?.[0]) {
    const r = viewData[0];
    const rawMedia: any = r.media;
    diagnostics.view = {
      id: r.id,
      listing_id: r.listing_id,
      preferred_photo: r.preferred_photo,
      media_is_null: rawMedia === null,
      media_typeof: typeof rawMedia,
      media_preview: rawMedia === null ? null : (typeof rawMedia === 'string' ? rawMedia.slice(0, 300) : JSON.stringify(rawMedia).slice(0, 300)),
    };
  } else {
    diagnostics.view = 'NOT FOUND';
  }

  // 2. Query raw rc-listings table by numeric id
  const { data: rawById, error: rawByIdError } = await supabase
    .from('rc-listings')
    .select('*')
    .eq('id', parseInt(id))
    .limit(1);

  if (rawByIdError) {
    diagnostics.rawByIdError = rawByIdError.message;
  } else if (rawById?.[0]) {
    const r = rawById[0];
    // Show all column names that have non-null values
    const nonNullColumns = Object.entries(r)
      .filter(([, v]) => v !== null)
      .map(([k]) => k);
    // Find any photo/media related columns
    const photoColumns = Object.entries(r)
      .filter(([k]) => /photo|media|image|picture|thumb/i.test(k))
      .map(([k, v]) => ({
        column: k,
        is_null: v === null,
        typeof: typeof v,
        preview: v === null ? null : (typeof v === 'string' ? v.slice(0, 200) : JSON.stringify(v).slice(0, 200)),
      }));
    diagnostics.rawById = {
      id: r.id,
      ListingId: r.ListingId,
      totalColumns: Object.keys(r).length,
      nonNullColumns: nonNullColumns.length,
      photoMediaColumns: photoColumns,
      status: r.StandardStatus || r.MlsStatus || r.Status,
      address: r.UnparsedAddress,
    };
  } else {
    diagnostics.rawById = 'NOT FOUND by id=' + id;
  }

  // 3. Also try by ListingId
  const listingId = viewData?.[0]?.listing_id || id;
  const { data: rawByLid, error: rawByLidError } = await supabase
    .from('rc-listings')
    .select('*')
    .eq('ListingId', listingId)
    .limit(3);

  if (rawByLidError) {
    diagnostics.rawByListingIdError = rawByLidError.message;
  } else {
    diagnostics.rawByListingId = (rawByLid || []).map((r: any) => {
      const photoColumns = Object.entries(r)
        .filter(([k]) => /photo|media|image|picture|thumb/i.test(k))
        .map(([k, v]) => ({
          column: k,
          is_null: v === null,
          typeof: typeof v,
          preview: v === null ? null : (typeof v === 'string' ? v.slice(0, 200) : JSON.stringify(v).slice(0, 200)),
        }));
      return {
        id: r.id,
        ListingId: r.ListingId,
        status: r.StandardStatus || r.MlsStatus || r.Status,
        address: r.UnparsedAddress,
        photoMediaColumns: photoColumns,
      };
    });
  }

  // 4. Find a sample row that HAS Media data (to understand the format)
  const { data: sampleWithMedia, error: sampleError } = await supabase
    .from('rc-listings')
    .select('id, "ListingId", "Media", "UnparsedAddress"')
    .not('Media', 'is', null)
    .limit(1);

  if (sampleError) {
    diagnostics.sampleWithMediaError = sampleError.message;
  } else if (sampleWithMedia?.[0]) {
    const r = sampleWithMedia[0];
    const m: any = r.Media;
    diagnostics.sampleWithMedia = {
      id: r.id,
      ListingId: r.ListingId,
      address: r.UnparsedAddress,
      media_typeof: typeof m,
      media_isArray: Array.isArray(m),
      media_preview: typeof m === 'string' ? m.slice(0, 300) : JSON.stringify(m).slice(0, 300),
    };
  } else {
    diagnostics.sampleWithMedia = 'NO ROWS WITH MEDIA FOUND';
  }

  // 5. Check media_lookup table
  const { data: lookupData, error: lookupError } = await supabase
    .from('media_lookup')
    .select('listing_id, media')
    .eq('listing_id', listingId)
    .limit(1);

  if (lookupError) {
    diagnostics.mediaLookupError = lookupError.message;
  } else {
    diagnostics.mediaLookup = (lookupData || []).length > 0 ? 'FOUND' : 'NOT FOUND';
  }

  return NextResponse.json(diagnostics);
}
