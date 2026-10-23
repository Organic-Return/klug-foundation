import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCachedCityStats } from '@/lib/cityStats';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ cities: [], stats: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const propertyFilter = searchParams.get('propertyType') || 'all';
    const cityFilter = searchParams.get('city');
    const citiesFilter = searchParams.get('cities');

    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    };

    // All paths now use the 24-hour server cache. Title-case incoming
    // city values so a stray "snowmass village" from a CMS field still
    // matches mls_properties.city ("Snowmass Village") — Supabase's
    // .in() is case-sensitive and a single mismatched character used to
    // silently zero the stats on the community page.
    const toTitle = (s: string) =>
      s
        .trim()
        .split(/\s+/)
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
        .join(' ');

    let requestedCities: string[] | undefined;
    if (cityFilter) {
      requestedCities = [toTitle(cityFilter)];
    } else if (citiesFilter) {
      requestedCities = citiesFilter.split(',').map((c) => toTitle(c));
    }

    const cachedFn = getCachedCityStats(propertyFilter, requestedCities);
    const result = await cachedFn();
    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error in city-stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
