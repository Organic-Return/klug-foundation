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

async function fetchRecentListings(city: string, limit: number): Promise<Listing[]> {
  // Get MLS configuration to filter by allowed cities
  const mlsConfig = await getMLSConfiguration();
  const allowedCities = getAllowedCities(mlsConfig);

  // If the requested city is not in allowed cities, return empty
  if (!allowedCities.includes(city)) {
    return [];
  }

  const { data, error } = await supabase
    .from('graphql_listings')
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
      preferred_photo,
      media
    `)
    .eq('city', city)
    .eq('status', 'Active')
    .not('property_type', 'eq', 'Residential Lease')
    .not('property_type', 'eq', 'Commercial Lease')
    .not('property_type', 'eq', 'Fractional')
    .not('property_type', 'eq', 'Res Vacant Land')
    .order('listing_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent listings:', error);
    throw new Error('Failed to fetch recent listings');
  }

  // Transform the data to match the Listing interface
  return (data || []).map((listing) => {
    // Build photos array from preferred_photo and media
    const photos: string[] = [];
    if (listing.preferred_photo) {
      let pp = listing.preferred_photo;
      if (pp.startsWith('//')) pp = `https:${pp}`;
      photos.push(pp);
    }
    // Parse media — may be a JSON string, array of URL strings, or array of objects
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
const getCachedRecentListings = (city: string, limit: number) => {
  return unstable_cache(
    async () => fetchRecentListings(city, limit),
    [`recent-listings-${city}-${limit}`],
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

    if (!city) {
      return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
    }

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 50);

    // Use cached function to get listings
    const cachedFn = getCachedRecentListings(city, validLimit);
    const listings = await cachedFn();

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error in recent-listings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
