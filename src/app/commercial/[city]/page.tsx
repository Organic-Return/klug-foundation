import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCommercialListings, getDistinctCities } from '@/lib/listings';
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
  if (!city) return { title: 'Commercial Real Estate' };
  return {
    title: `${city} Commercial Real Estate | ${siteName}`,
    description: `Commercial, multi-family, and income-producing properties in ${city}, Colorado. Updated continuously from the Aspen Glenwood MLS.`,
    alternates: { canonical: `${baseUrl}/commercial/${slug}` },
    openGraph: {
      title: `${city} Commercial Real Estate | ${siteName}`,
      description: `Commercial real estate listings in ${city}, Colorado.`,
      url: `${baseUrl}/commercial/${slug}`,
    },
  };
}

export default async function CommercialCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const [listings, cities] = await Promise.all([getCommercialListings(city), getDistinctCities()]);
  return (
    <PropertyTypeHub
      type="commercial"
      title={`${city} Commercial Real Estate`}
      intro={[
        `${city} commercial property is shaped by limited zoned inventory, persistent demand from a year-round resort economy, and exceptionally strong fundamentals across retail, hospitality, and mixed-use real estate. Klug Properties represents buyers, sellers, and 1031 investors across the full spectrum of commercial opportunities here.`,
        `The listings below include multi-family income property, mixed-use buildings, and dedicated commercial spaces in ${city} currently visible on the Aspen Glenwood MLS. For off-market opportunities, development-site evaluations, or any deal that needs discretion, our team is the right starting point — we know the building owners and can often surface inventory before it lists.`,
      ]}
      listings={listings}
      cities={cities}
      currentCity={city}
      emptyText={`No commercial listings showing for ${city} right now. Off-market opportunities surface frequently — get in touch.`}
    />
  );
}
