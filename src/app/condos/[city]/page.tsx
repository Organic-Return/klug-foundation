import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCondoListings, getCondoCities } from '@/lib/listings';
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

// Resolves against the cities that actually hold condo inventory, so a city
// page only exists where there is something to show.
async function resolveCity(slug: string): Promise<string | null> {
  const cities = await getCondoCities();
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
  if (!city) return { title: 'Condos for Sale' };
  const title = `Condos for Sale in ${city}, Colorado | ${siteName}`;
  const description = `Condominiums for sale in ${city}, Colorado. Current listings from the Aspen Glenwood MLS, updated continuously — with local guidance on HOA dues, short-term rental rules, and which buildings hold their value.`;
  return {
    title: `${title}${pageSuffix}`,
    description,
    alternates: { canonical: page > 1 ? `${baseUrl}/condos/${slug}?page=${page}` : `${baseUrl}/condos/${slug}` },
    openGraph: {
      title,
      description: `Condominiums for sale in ${city}, Colorado.`,
      url: `${baseUrl}/condos/${slug}`,
    },
  };
}

export default async function CondosCityPage(
  { params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [{ listings, total }, cities] = await Promise.all([getCondoListings(city, page), getCondoCities()]);
  return (
    <PropertyTypeHub
      type="condos"
      title={`Condos for Sale in ${city}, Colorado`}
      intro={[
        `Every condominium currently listed in ${city} on the Aspen Glenwood MLS, updated continuously. Condo inventory in ${city} turns over faster than single-family homes, and the best units in the strongest buildings are often under contract within days of hitting the market.`,
        `What separates two units at the same price in ${city} is rarely square footage — it is the building. Short-term rental rules, HOA reserves and assessment history, deeded versus fractional ownership, parking, and storage all move value more than the floor plan does. Klug Properties has sold across these buildings for decades; reach out for the history behind any listing below, or to hear about units before they reach the MLS.`,
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath={`/condos/${slug}`}
      cities={cities}
      currentCity={city}
      emptyText={`No condominiums showing in ${city} right now. We often know about units before they list — drop us a line.`}
    />
  );
}
