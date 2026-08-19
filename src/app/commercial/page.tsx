import type { Metadata } from 'next';
import { getCommercialListings, getCommercialCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub from '@/components/PropertyTypeHub';

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
    title: `Commercial Real Estate in Aspen Snowmass | ${siteName}${pageSuffix}`,
    description:
      'Commercial real estate, multi-family income property, and mixed-use opportunities across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley.',
    alternates: { canonical: page > 1 ? `${baseUrl}/commercial?page=${page}` : `${baseUrl}/commercial` },
    openGraph: {
      title: `Commercial Real Estate in Aspen Snowmass | ${siteName}`,
      description:
        'Commercial, multi-family, and mixed-use real estate across the Roaring Fork Valley.',
      url: `${baseUrl}/commercial`,
    },
  };
}

export default async function CommercialHubPage(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const [{ listings, total }, cities] = await Promise.all([getCommercialListings(undefined, page), getCommercialCities()]);
  return (
    <PropertyTypeHub
      type="commercial"
      title="Commercial Real Estate"
      intro={[
        'Aspen Snowmass commercial real estate is among the most valuable on a per-square-foot basis in North America. Limited zoning, scarce buildable land, and persistent demand from a global resort economy support unusually strong fundamentals across retail, office, restaurant, hospitality, and mixed-use product. Klug Properties represents buyers, sellers, and investors evaluating the full spectrum of commercial opportunities across Aspen, Snowmass Village, Basalt, and the surrounding Roaring Fork Valley.',
        'The listings below include multi-family income properties (duplex, triplex, apartment buildings), mixed-use buildings, and dedicated commercial spaces currently surfaced on the Aspen Glenwood MLS. For off-market commercial opportunities, 1031 exchange targets, or development-site evaluations, contact our team — we maintain relationships with valley building owners that often surface inventory long before it lists publicly.',
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath="/commercial"
      cities={cities}
      emptyText="No commercial listings on the MLS right now. Off-market opportunities surface frequently — get in touch."
    />
  );
}
