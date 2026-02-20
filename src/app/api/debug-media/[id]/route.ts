import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Temporary debug endpoint to inspect raw media data from Supabase
// DELETE THIS FILE after debugging

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, media, preferred_photo')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rawMedia = data.media;
  const mediaType = typeof rawMedia;
  const isArray = Array.isArray(rawMedia);

  // Try parsing if string
  let parsed: any = null;
  let parseError: string | null = null;
  if (typeof rawMedia === 'string') {
    try {
      parsed = JSON.parse(rawMedia);
    } catch (e: any) {
      parseError = e.message;
    }
  }

  // Extract first item details
  let firstItem: any = null;
  const items = isArray ? rawMedia : (Array.isArray(parsed) ? parsed : []);
  if (items.length > 0) {
    const item = items[0];
    firstItem = {
      type: typeof item,
      isString: typeof item === 'string',
      keys: item && typeof item === 'object' ? Object.keys(item) : null,
      value: typeof item === 'string' ? item.slice(0, 200) : item,
    };
  }

  return NextResponse.json({
    id: data.id,
    listing_id: data.listing_id,
    preferred_photo: data.preferred_photo,
    media: {
      type: mediaType,
      isArray,
      isNull: rawMedia === null,
      length: isArray ? rawMedia.length : (typeof rawMedia === 'string' ? rawMedia.length : null),
      preview: typeof rawMedia === 'string' ? rawMedia.slice(0, 500) : (isArray ? `Array(${rawMedia.length})` : String(rawMedia)),
      parseResult: parsed ? { type: typeof parsed, isArray: Array.isArray(parsed), length: Array.isArray(parsed) ? parsed.length : null } : null,
      parseError,
      firstItem,
    },
  });
}
