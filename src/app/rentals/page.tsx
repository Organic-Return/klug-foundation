import type { Metadata } from 'next';
import { getRentals, getRentalCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub, { HUB_PAGE_SIZE } from '@/components/PropertyTypeHub';

export const revalidate = 300;

// ?page=N, clamped to a sane integer. Page 1 is the bare path.
function pageFrom(value?: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = parseInt(raw || '1', 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const page = pageFrom((await searchParams).page);
  // Page 2+ gets its own title so a paginated series isn't a wall of identical
  // results in the SERP.
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : '';
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Rentals in Aspen Snowmass | ${siteName}${pageSuffix}`,
    description:
      'Browse the latest rental listings across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley. Long-term and short-term rentals updated continuously from the MLS.',
    alternates: { canonical: page > 1 ? `${baseUrl}/rentals?page=${page}` : `${baseUrl}/rentals` },
    openGraph: {
      title: `Rentals in Aspen Snowmass | ${siteName}`,
      description:
        'Browse current rental listings across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley.',
      url: `${baseUrl}/rentals`,
    },
  };
}

export default async function RentalsHubPage(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const [allListings, cities] = await Promise.all([getRentals(), getRentalCities()]);
  return (
    <PropertyTypeHub
      type="rentals"
      title="Rentals in Aspen Snowmass"
      intro={[
        'From slope-side condos in Snowmass Village to historic Victorians in the Aspen West End, the Roaring Fork Valley offers some of the most sought-after rental properties in Colorado. Whether you are relocating for a season, evaluating a move to the valley, or planning an extended stay, our continuously updated MLS feed surfaces every available rental from Aspen through Basalt and Carbondale.',
        'Klug Properties represents tenants and landlords across the full spectrum of Aspen Snowmass rentals — luxury furnished homes, ski-in/ski-out condos, downtown lock-offs, multi-bedroom estates, and long-term unfurnished residences. Use the filters below to drill into a specific community, or contact our team directly to discuss off-market opportunities and our network of trusted local property managers.',
      ]}
      listings={allListings.slice((page - 1) * HUB_PAGE_SIZE, page * HUB_PAGE_SIZE)}
      page={page}
      totalCount={allListings.length}
      basePath="/rentals"
      cities={cities}
      emptyText="No rental listings on the MLS right now. Reach out — we frequently know about availability before it hits the open market."
    />
  );
}
