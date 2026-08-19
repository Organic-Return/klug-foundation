import type { Metadata } from 'next';
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

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const page = pageFrom((await searchParams).page);
  // Page 2+ gets its own title so a paginated series isn't a wall of identical
  // results in the SERP.
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : '';
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Land for Sale in Aspen Snowmass | ${siteName}${pageSuffix}`,
    description:
      'Vacant land, ranches, and acreage for sale across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley. Build your dream home or hold for legacy.',
    alternates: { canonical: page > 1 ? `${baseUrl}/land?page=${page}` : `${baseUrl}/land` },
    openGraph: {
      title: `Land for Sale in Aspen Snowmass | ${siteName}`,
      description:
        'Vacant land, ranches, and acreage opportunities across the Roaring Fork Valley.',
      url: `${baseUrl}/land`,
    },
  };
}

export default async function LandHubPage(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
) {
  const page = pageFrom((await searchParams).page);
  const [{ listings, total }, cities] = await Promise.all([getLandListings(undefined, page), getLandCities()]);
  return (
    <PropertyTypeHub
      type="land"
      title="Land for Sale in Aspen Snowmass"
      intro={[
        'Aspen Snowmass remains one of the most prized environments in North America to build — and one of the most constrained. With wilderness on three sides, federally protected land bordering most of the valley, and aggressive growth-management policies in Aspen, Snowmass Village, and Pitkin County, vacant developable land is genuinely scarce. The parcels that do come to market move quickly and are an outsized portion of the value of any portfolio that holds them.',
        'The listings below include every vacant residential lot, ranch, agricultural parcel, and large-acreage property currently on the Aspen Glenwood MLS — from buildable in-town lots in Aspen and Snowmass Village to cattle ranches and recreational land farther down-valley. Klug Properties has represented record-setting land sales across the valley; reach out to discuss building potential, easements, water rights, or any specific parcel.',
      ]}
      listings={listings}
      page={page}
      totalCount={total}
      basePath="/land"
      cities={cities}
      emptyText="No land listings on the MLS right now. Reach out — we frequently know about parcels before they list."
    />
  );
}
