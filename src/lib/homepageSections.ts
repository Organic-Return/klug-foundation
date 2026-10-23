/**
 * Server-side data for the classic homepage sections that used to fetch in
 * the browser (the featured-property rotator, Market Insights, and the
 * newest-listings carousel).
 *
 * Each helper mirrors the API route its section calls on the client, so the
 * server render and a later client fetch produce the same cards. Each returns
 * `undefined` on failure: the section then renders as before and fetches
 * after load, rather than taking the whole homepage down.
 *
 * Types are imported from the client components as types only, which TypeScript
 * erases; importing their functions from a 'use client' module would hand this
 * server code a client reference instead.
 */
import {
  getListingByMlsNumber,
  getListingById,
  getNewestHighPricedByCity,
  getNewestHighPricedByCities,
  type MLSProperty,
} from '@/lib/listings';
import { getCachedCityStats, type CityStats } from '@/lib/cityStats';
import type { FeaturedListing } from '@/components/ClassicFeaturedProperty';
import type { CarouselListing } from '@/components/FeaturedAspenProperties';

/** Mirrors ClassicFeaturedProperty's fetch of /api/listings/{id} per id:
 *  MLS number first, then database id; listings without an address are
 *  dropped. */
export async function getFeaturedListings(ids: string[]): Promise<FeaturedListing[] | undefined> {
  if (ids.length === 0) return [];
  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return (await getListingByMlsNumber(id)) || (await getListingById(id));
        } catch {
          return null;
        }
      })
    );
    return results
      .filter((l): l is MLSProperty => l !== null && !!l.address)
      .map((l) => ({
        id: l.id,
        address: l.address ?? '',
        city: l.city ?? '',
        state: l.state ?? '',
        list_price: l.list_price ?? 0,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        square_feet: l.square_feet,
        // MLSProperty.lot_size is already in acres (see the row mapper in
        // src/lib/listings.ts).
        lot_size_acres: l.lot_size,
        photos: l.photos || [],
        mls_number: l.mls_number,
        status: l.status,
        property_type: l.property_type ?? '',
      }));
  } catch (error) {
    console.error('Error pre-fetching featured listings:', error);
    return undefined;
  }
}

// Same title-casing the /api/city-stats route applies to incoming city
// names, so a stray "snowmass village" from a CMS field still matches
// mls_properties.city.
const toTitle = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

/** Mirrors /api/city-stats?propertyType=all, the filter the section opens on. */
export async function getHomepageCityStats(
  cities?: string[]
): Promise<{ cities: string[]; stats: CityStats[] } | undefined> {
  try {
    const requested = cities && cities.length > 0 ? cities.map(toTitle) : undefined;
    return await getCachedCityStats('all', requested)();
  } catch (error) {
    console.error('Error pre-fetching city stats:', error);
    return undefined;
  }
}

/** Mirrors FeaturedAspenProperties' fetch of /api/featured-properties. */
export async function getNewestListings(
  cities: string[] | undefined,
  limit: number
): Promise<CarouselListing[] | undefined> {
  try {
    const list = cities && cities.length > 0 ? cities : ['Aspen'];
    const pool: MLSProperty[] =
      list.length > 1
        ? await getNewestHighPricedByCities(list, limit)
        : await getNewestHighPricedByCity(list[0], limit);
    return pool.map((l) => ({
      id: l.id,
      address: l.address ?? '',
      city: l.city ?? '',
      list_price: l.list_price ?? 0,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      square_feet: l.square_feet,
      photos: l.photos,
      mls_number: l.mls_number,
    }));
  } catch (error) {
    console.error('Error pre-fetching newest listings:', error);
    return undefined;
  }
}
