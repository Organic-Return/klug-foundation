import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLandListings, getLandCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub from '@/components/PropertyTypeHub';

export const revalidate = 300;

// ?page=N, clamped to a sane integer. Page 1 is the bare path.
function pageFrom(value?: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = parseInt(raw || '1', 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

function citySlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

async function resolveCity(slug: string): Promise<string | null> {
  const cities = await getLandCities();
  const target = slug.toLowerCase();
  return cities.find((c) => citySlug(c) === target) ?? null;
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const page = pageFrom((await searchParams).page);
  // Page 2+ gets its own title so a paginated series isn't a wall of identical
  // results in the SERP.
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : '';
  const { city: slug } = await params;
  const [baseUrl, siteName, city] = await Promise.all([getBaseUrl(), getSiteName(), resolveCity(slug)]);
  if (!city) return { title: 'Land for Sale' };
  return {
    title: `Land for Sale in ${city}, Colorado | ${siteName}${pageSuffix}`,
    description: `Vacant lots, ranches, and acreage for sale in ${city}, Colorado. Updated continuously from the Aspen Glenwood MLS.`,
    alternates: { canonical: page > 1 ? `${baseUrl}/land/${slug}?page=${page}` : `${baseUrl}/land/${slug}` },
    openGraph: {
      title: `Land for Sale in ${city}, Colorado | ${siteName}`,
      description: `Vacant land, ranches, and acreage in ${city}.`,
      url: `${baseUrl}/land/${slug}`,
    },
  };
}

export default async function LandCityPage(
  { params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [{ listings, total }, cities] = await Promise.all([getLandListings(city, page), getLandCities()]);
  return (
    <PropertyTypeHub
      type="land"
      title={`Land for Sale in ${city}, Colorado`}
      intro={[
        `Vacant land in ${city} is scarce, scrutinized, and high-leverage — the parcels that come to market here often shape the next generation of mountain real estate in the Roaring Fork Valley. Whether you are evaluating a buildable lot, a recreational acreage, a ranch, or a long-term legacy hold, Klug Properties has the local context and the historical sales data to help you understand what every parcel is really worth.`,
        `The listings below include every vacant residential lot, agricultural parcel, and acreage property in ${city} currently on the Aspen Glenwood MLS. Reach out for off-market opportunities, easement and water-rights questions, or any specific parcel — we have walked most of the buildable land in this valley.`,
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath={`/land/${slug}`}
      cities={cities}
      currentCity={city}
      emptyText={`No land listings showing for ${city} right now. We frequently know about parcels before they list — drop us a line.`}
    />
  );
}
