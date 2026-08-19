import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRentals, getRentalCities } from '@/lib/listings';
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
  const cities = await getRentalCities();
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
  if (!city) return { title: 'Rentals' };
  return {
    title: `${city} Rentals | ${siteName}${pageSuffix}`,
    description: `Available rental properties in ${city}, Colorado. Updated continuously from the Aspen Glenwood MLS.`,
    alternates: { canonical: page > 1 ? `${baseUrl}/rentals/${slug}?page=${page}` : `${baseUrl}/rentals/${slug}` },
    openGraph: {
      title: `${city} Rentals | ${siteName}`,
      description: `Available rental properties in ${city}, Colorado.`,
      url: `${baseUrl}/rentals/${slug}`,
    },
  };
}

export default async function RentalsCityPage(
  { params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [{ listings, total }, cities] = await Promise.all([getRentals(city, page), getRentalCities()]);
  return (
    <PropertyTypeHub
      type="rentals"
      title={`${city} Rentals`}
      intro={[
        `Looking for a rental in ${city}? Klug Properties tracks every available unit on the Aspen Glenwood MLS, plus a network of off-market opportunities our team learns about before they hit the public listings.`,
        `${city} renters typically come for the lifestyle as much as the location — proximity to the slopes, the Roaring Fork River, the John Denver Sanctuary, and the year-round Aspen calendar of festivals, music, and outdoor sport. Whether you need a short-term ski-season rental, a furnished corporate placement, or a long-term unfurnished home for a family relocation, the listings below represent the freshest data the MLS exposes. Filter further or reach out to our team directly to discuss timing and pricing.`,
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath={`/rentals/${slug}`}
      cities={cities}
      currentCity={city}
      emptyText={`No rentals in ${city} are showing on the MLS right now. We often hear about availability before it hits the public listings — drop us a line.`}
    />
  );
}
