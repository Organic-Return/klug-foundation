import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getMLSConfiguration, getAllowedCities } from '@/lib/mlsConfiguration';

// Cache duration: 1 hour (3600 seconds)
const CACHE_DURATION = 3600;

interface Listing {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  status: string;
  property_type: string | null;
  listing_date: string | null;
  photos: string[];
}

async function fetchRecentListings(city: string, limit: number, mlsAreas?: string[]): Promise<Listing[]> {
  // Get MLS configuration to filter by allowed cities. Skipped when the
  // caller passes explicit mlsAreas — those listings might span multiple
  // cities and the area-minor signal is more specific than the city gate.
  if (!mlsAreas || mlsAreas.length === 0) {
    const mlsConfig = await getMLSConfiguration();
    const allowedCities = getAllowedCities(mlsConfig);
    if (allowedCities.length > 0 && !allowedCities.includes(city)) {
      return [];
    }
  }

  let query = supabase
    .from('mls_properties')
    .select(`
      id,
      address,
      city,
      state,
      zip_code,
      list_price,
      bedrooms,
      bathrooms_total,
      square_feet,
      status,
      property_type,
      listing_date,
      photos,
      media
    `)
    .eq('status', 'Active')
    .not('property_type', 'eq', 'Residential Lease')
    .not('property_type', 'eq', 'Commercial Lease')
    .not('property_type', 'eq', 'Fractional')
    .not('property_type', 'eq', 'Res Vacant Land')
    .order('listing_date', { ascending: false })
    .limit(limit);

  // Prefer mls_area_minor filter when provided — it's the more specific
  // signal a Sanity editor configured for this community. Otherwise
  // fall back to filtering by city.
  if (mlsAreas && mlsAreas.length > 0) {
    query = query.in('mls_area_minor', mlsAreas);
  } else {
    query = query.eq('city', city);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recent listings:', error);
    throw new Error('Failed to fetch recent listings');
  }

  // Transform the data to match the Listing interface
  return (data || []).map((listing) => {
    // Build photos array. `photos` (text[]) is the primary source on
    // mls_properties; fall back to `media` (jsonb of RESO Media objects).
    const photos: string[] = [];
    const rawPhotos: any = listing.photos;
    if (Array.isArray(rawPhotos)) {
      for (let url of rawPhotos) {
        if (typeof url !== 'string') continue;
        if (url.startsWith('//')) url = `https:${url}`;
        if (!photos.includes(url)) photos.push(url);
      }
    }
    if (photos.length === 0) {
      let mediaItems: any[] = [];
      const rawMedia: any = listing.media;
      if (rawMedia) {
        let parsed = rawMedia;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch { /* not JSON */ }
        }
        if (Array.isArray(parsed)) {
          mediaItems = parsed;
        }
      }
      for (const item of mediaItems) {
        let url: string | undefined;
        if (typeof item === 'string') {
          url = item;
        } else if (item && typeof item === 'object') {
          url = item.MediaURL || item.MediaUrl || item.mediaUrl || item.mediaURL || item.url;
        }
        if (url && typeof url === 'string') {
          if (url.startsWith('//')) url = `https:${url}`;
          if (!photos.includes(url)) photos.push(url);
        }
      }
    }

    return {
      id: listing.id,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip_code: listing.zip_code,
      list_price: listing.list_price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms_total,
      square_feet: listing.square_feet,
      status: listing.status,
      property_type: listing.property_type,
      listing_date: listing.listing_date,
      photos,
    };
  });
}

// Create cached version of the fetch function
const getCachedRecentListings = (city: string, limit: number, mlsAreas?: string[]) => {
  const areasKey = mlsAreas && mlsAreas.length > 0
    ? mlsAreas.slice().sort().join('|')
    : 'none';
  return unstable_cache(
    async () => fetchRecentListings(city, limit, mlsAreas),
    [`recent-listings-${city}-${limit}-${areasKey}`],
    {
      revalidate: CACHE_DURATION,
      tags: [`recent-listings`, `recent-listings-${city}`],
    }
  );
};

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ listings: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    // mlsAreas: comma-separated list of mls_area_minor values to filter by.
    // When provided, takes precedence over the city filter.
    const mlsAreasParam = searchParams.get('mlsAreas');
    const mlsAreas = mlsAreasParam
      ? mlsAreasParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (!city && (!mlsAreas || mlsAreas.length === 0)) {
      return NextResponse.json({ error: 'city or mlsAreas parameter is required' }, { status: 400 });
    }

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 50);

    // Use cached function to get listings
    const cachedFn = getCachedRecentListings(city || '', validLimit, mlsAreas);
    const listings = await cachedFn();

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error in recent-listings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
