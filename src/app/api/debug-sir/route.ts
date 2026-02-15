import { NextResponse } from 'next/server';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getListingById } from '@/lib/listings';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mls = searchParams.get('mls') || '285075';
  const id = searchParams.get('id');

  // If id is provided with raw=true, show raw database row
  if (id && searchParams.get('raw')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' });

    const client = createClient(url, key);
    const { data, error } = await client
      .from('graphql_listings')
      .select('id, listing_id, status, address, city, preferred_photo, media')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message });

    // Show column names and key values (truncate media)
    return NextResponse.json({
      id: data.id,
      listing_id: data.listing_id,
      status: data.status,
      address: data.address,
      city: data.city,
      preferred_photo: data.preferred_photo?.substring(0, 100),
      media_type: typeof data.media,
      media_is_array: Array.isArray(data.media),
      media_count: Array.isArray(data.media) ? data.media.length : 0,
      media_sample: Array.isArray(data.media) && data.media[0]
        ? JSON.stringify(data.media[0]).substring(0, 200)
        : null,
      all_columns: Object.keys(data),
    });
  }

  // If id is provided, test the full getListingById flow
  if (id) {
    try {
      const listing = await getListingById(id);
      if (!listing) {
        return NextResponse.json({ id, listing: null, message: 'getListingById returned null' });
      }
      return NextResponse.json({
        id,
        mls_number: listing.mls_number,
        photos_count: listing.photos?.length || 0,
        photos_source: listing.photos?.[0]?.substring(0, 80) || 'none',
        video_urls: listing.video_urls || [],
        virtual_tour_url: listing.virtual_tour_url || null,
        has_sir_photos: listing.photos?.[0]?.includes('anywhere.re') || false,
      });
    } catch (err: any) {
      return NextResponse.json({ id, error: err.message, stack: err.stack?.substring(0, 500) });
    }
  }

  // Otherwise test direct SIR lookup
  const configured = isRealogyConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      env: {
        REALOGY_SUPABASE_URL: !!process.env.REALOGY_SUPABASE_URL,
        REALOGY_SUPABASE_ANON_KEY: !!process.env.REALOGY_SUPABASE_ANON_KEY,
      },
    });
  }

  const client = getRealogySupabase();
  if (!client) return NextResponse.json({ configured: true, client: false });

  const { data, error } = await client
    .from('realogy_listings')
    .select('rfg_listing_id, mls_numbers, default_photo_url, media')
    .contains('mls_numbers', JSON.stringify([mls]))
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ configured: true, error: error.message });
  if (!data) return NextResponse.json({ configured: true, match: false, mls });

  const media = Array.isArray(data.media) ? data.media : [];
  return NextResponse.json({
    configured: true,
    match: true,
    mls,
    rfg_listing_id: data.rfg_listing_id,
    images: media.filter((m: any) => m.format === 'Image').length,
    videos: media.filter((m: any) => m.format === 'Video').length,
    videoUrls: media.filter((m: any) => m.format === 'Video').map((v: any) => v.url),
  });
}
