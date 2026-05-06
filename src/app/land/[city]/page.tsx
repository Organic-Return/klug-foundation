import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLandListings, getDistinctCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub from '@/components/PropertyTypeHub';

export const revalidate = 300;

function citySlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

async function resolveCity(slug: string): Promise<string | null> {
  const cities = await getDistinctCities();
  const target = slug.toLowerCase();
  return cities.find((c) => citySlug(c) === target) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const [baseUrl, siteName, city] = await Promise.all([getBaseUrl(), getSiteName(), resolveCity(slug)]);
  if (!city) return { title: 'Land for Sale' };
  return {
    title: `Land for Sale in ${city}, Colorado | ${siteName}`,
    description: `Vacant lots, ranches, and acreage for sale in ${city}, Colorado. Updated continuously from the Aspen Glenwood MLS.`,
    alternates: { canonical: `${baseUrl}/land/${slug}` },
    openGraph: {
      title: `Land for Sale in ${city}, Colorado | ${siteName}`,
      description: `Vacant land, ranches, and acreage in ${city}.`,
      url: `${baseUrl}/land/${slug}`,
    },
  };
}

export default async function LandCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [listings, cities] = await Promise.all([getLandListings(city), getDistinctCities()]);
  return (
    <PropertyTypeHub
      type="land"
      title={`Land for Sale in ${city}, Colorado`}
      intro={[
        `Vacant land in ${city} is scarce, scrutinized, and high-leverage — the parcels that come to market here often shape the next generation of mountain real estate in the Roaring Fork Valley. Whether you are evaluating a buildable lot, a recreational acreage, a ranch, or a long-term legacy hold, Klug Properties has the local context and the historical sales data to help you understand what every parcel is really worth.`,
        `The listings below include every vacant residential lot, agricultural parcel, and acreage property in ${city} currently on the Aspen Glenwood MLS. Reach out for off-market opportunities, easement and water-rights questions, or any specific parcel — we have walked most of the buildable land in this valley.`,
      ]}
      listings={listings}
      cities={cities}
      currentCity={city}
      emptyText={`No land listings showing for ${city} right now. We frequently know about parcels before they list — drop us a line.`}
    />
  );
}
