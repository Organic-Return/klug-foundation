import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getListingById } from '@/lib/listings';

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

  // Check for ?id= param to debug a specific listing
  const url = new URL(request.url);
  const listingId = url.searchParams.get('id');

  // 1. Basic stats
  const { count } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true });
  diagnostics.totalRows = count;

  // 2. Media diagnostic: check a specific listing or sample listings with media
  if (listingId) {
    // Debug specific listing by DB id or listing_id (MLS number)
    const { data } = await supabase
      .from('graphql_listings')
      .select('id, listing_id, address, city, status, preferred_photo, media')
      .or(`id.eq.${listingId},listing_id.eq.${listingId}`)
      .limit(1);

    if (data?.[0]) {
      const r = data[0];
      const rawMedia: any = r.media;
      diagnostics.listing = {
        id: r.id,
        listing_id: r.listing_id,
        address: r.address,
        city: r.city,
        status: r.status,
        preferred_photo: r.preferred_photo,
      };
      diagnostics.media = {
        is_null: rawMedia === null,
        typeof: typeof rawMedia,
        isArray: Array.isArray(rawMedia),
        length: Array.isArray(rawMedia) ? rawMedia.length : (typeof rawMedia === 'string' ? rawMedia.length : null),
        preview: rawMedia === null ? null : (typeof rawMedia === 'string' ? rawMedia.slice(0, 500) : JSON.stringify(rawMedia).slice(0, 500)),
      };

      // If it's a string, try JSON parse
      if (typeof rawMedia === 'string') {
        try {
          const parsed = JSON.parse(rawMedia);
          diagnostics.media.json_parse = {
            success: true,
            result_type: typeof parsed,
            result_isArray: Array.isArray(parsed),
            result_length: Array.isArray(parsed) ? parsed.length : null,
          };
          if (Array.isArray(parsed) && parsed[0]) {
            diagnostics.media.first_item = {
              type: typeof parsed[0],
              keys: typeof parsed[0] === 'object' ? Object.keys(parsed[0]) : null,
              value: JSON.stringify(parsed[0]).slice(0, 300),
            };
          }
        } catch (e: any) {
          diagnostics.media.json_parse = { success: false, error: e.message };
        }
      }

      // If it's already an array, inspect first item
      if (Array.isArray(rawMedia) && rawMedia[0]) {
        diagnostics.media.first_item = {
          type: typeof rawMedia[0],
          keys: typeof rawMedia[0] === 'object' ? Object.keys(rawMedia[0]) : null,
          value: typeof rawMedia[0] === 'string' ? rawMedia[0].slice(0, 300) : JSON.stringify(rawMedia[0]).slice(0, 300),
        };
      }

      // Also run the full pipeline to see what photos come out
      const listing = await getListingById(String(r.id));
      diagnostics.pipeline = {
        photos_count: listing?.photos?.length ?? 0,
        first_3_photos: listing?.photos?.slice(0, 3) ?? [],
      };
    } else {
      diagnostics.listing = 'NOT FOUND';
    }
  } else {
    // Sample 5 listings and show their media status
    const { data: samples } = await supabase
      .from('graphql_listings')
      .select('id, listing_id, address, preferred_photo, media')
      .not('status', 'in', '(Closed,Sold)')
      .order('listing_date', { ascending: false })
      .limit(5);

    diagnostics.sample = (samples || []).map((r: any) => {
      const rawMedia: any = r.media;
      return {
        id: r.id,
        listing_id: r.listing_id,
        address: r.address,
        has_preferred_photo: !!r.preferred_photo,
        media_is_null: rawMedia === null,
        media_typeof: typeof rawMedia,
        media_isArray: Array.isArray(rawMedia),
        media_preview: rawMedia === null ? null : (typeof rawMedia === 'string' ? rawMedia.slice(0, 150) : JSON.stringify(rawMedia).slice(0, 150)),
      };
    });
  }

  return NextResponse.json(diagnostics);
}
