import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCommercialListings, getCommercialCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub, { HUB_PAGE_SIZE } from '@/components/PropertyTypeHub';

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
  const cities = await getCommercialCities();
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
  if (!city) return { title: 'Commercial Real Estate' };
  return {
    title: `${city} Commercial Real Estate | ${siteName}${pageSuffix}`,
    description: `Commercial, multi-family, and income-producing properties in ${city}, Colorado. Updated continuously from the Aspen Glenwood MLS.`,
    alternates: { canonical: page > 1 ? `${baseUrl}/commercial/${slug}?page=${page}` : `${baseUrl}/commercial/${slug}` },
    openGraph: {
      title: `${city} Commercial Real Estate | ${siteName}`,
      description: `Commercial real estate listings in ${city}, Colorado.`,
      url: `${baseUrl}/commercial/${slug}`,
    },
  };
}

export default async function CommercialCityPage(
  { params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [allListings, cities] = await Promise.all([getCommercialListings(city), getCommercialCities()]);
  return (
    <PropertyTypeHub
      type="commercial"
      title={`${city} Commercial Real Estate`}
      intro={[
        `${city} commercial property is shaped by limited zoned inventory, persistent demand from a year-round resort economy, and exceptionally strong fundamentals across retail, hospitality, and mixed-use real estate. Klug Properties represents buyers, sellers, and 1031 investors across the full spectrum of commercial opportunities here.`,
        `The listings below include multi-family income property, mixed-use buildings, and dedicated commercial spaces in ${city} currently visible on the Aspen Glenwood MLS. For off-market opportunities, development-site evaluations, or any deal that needs discretion, our team is the right starting point — we know the building owners and can often surface inventory before it lists.`,
      ]}
      listings={allListings.slice((page - 1) * HUB_PAGE_SIZE, page * HUB_PAGE_SIZE)}
      page={page}
      totalCount={allListings.length}
      basePath={`/commercial/${slug}`}
      cities={cities}
      currentCity={city}
      emptyText={`No commercial listings showing for ${city} right now. Off-market opportunities surface frequently — get in touch.`}
    />
  );
}
