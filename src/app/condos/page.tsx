import type { Metadata } from 'next';
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

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const page = pageFrom((await searchParams).page);
  // Page 2+ gets its own title so a paginated series isn't a wall of identical
  // results in the SERP.
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : '';
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  const title = `Aspen & Snowmass Condos for Sale | ${siteName}`;
  const description =
    'Condos and condominiums for sale in Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley — ski-in/ski-out residences, Aspen Core lock-offs, and downvalley condominiums, updated continuously from the Aspen Glenwood MLS.';
  return {
    title: `${title}${pageSuffix}`,
    description,
    alternates: { canonical: page > 1 ? `${baseUrl}/condos?page=${page}` : `${baseUrl}/condos` },
    openGraph: {
      title,
      description: 'Condos for sale across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley.',
      url: `${baseUrl}/condos`,
    },
  };
}

export default async function CondosHubPage(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const [{ listings, total }, cities] = await Promise.all([getCondoListings(undefined, page), getCondoCities()]);
  return (
    <PropertyTypeHub
      type="condos"
      title="Aspen & Snowmass Condos for Sale"
      intro={[
        'A condominium is how most buyers get their footing in Aspen Snowmass. It is the shortest path to a ski-in/ski-out address, the most practical way to own a lock-and-leave residence you use six weeks a year, and — in a valley where single-family inventory is scarce and land is scarcer — often the only way to buy into a specific building, block, or mountain.',
        'The listings below include every condominium currently on the Aspen Glenwood MLS, from Aspen Core walk-to-gondola residences and Snowmass Village slopeside buildings to Basalt, El Jebel, and Glenwood Springs. Condo buying here turns on details the listing sheet rarely shows: short-term rental rules, HOA reserves and assessment history, whether a unit is deeded or fractional, and which buildings hold value through a soft market. Reach out before you write an offer — those answers are the difference between a good address and a good investment.',
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath="/condos"
      cities={cities}
      emptyText="No condominiums showing on the MLS right now. Reach out — we often hear about units before they list."
    />
  );
}
