import type { Metadata } from 'next';
import { getRentals, getDistinctCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub from '@/components/PropertyTypeHub';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Rentals in Aspen Snowmass | ${siteName}`,
    description:
      'Browse the latest rental listings across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley. Long-term and short-term rentals updated continuously from the MLS.',
    alternates: { canonical: `${baseUrl}/rentals` },
    openGraph: {
      title: `Rentals in Aspen Snowmass | ${siteName}`,
      description:
        'Browse current rental listings across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley.',
      url: `${baseUrl}/rentals`,
    },
  };
}

export default async function RentalsHubPage() {
  const [listings, cities] = await Promise.all([getRentals(), getDistinctCities()]);
  return (
    <PropertyTypeHub
      type="rentals"
      title="Rentals in Aspen Snowmass"
      intro={[
        'From slope-side condos in Snowmass Village to historic Victorians in the Aspen West End, the Roaring Fork Valley offers some of the most sought-after rental properties in Colorado. Whether you are relocating for a season, evaluating a move to the valley, or planning an extended stay, our continuously updated MLS feed surfaces every available rental from Aspen through Basalt and Carbondale.',
        'Klug Properties represents tenants and landlords across the full spectrum of Aspen Snowmass rentals — luxury furnished homes, ski-in/ski-out condos, downtown lock-offs, multi-bedroom estates, and long-term unfurnished residences. Use the filters below to drill into a specific community, or contact our team directly to discuss off-market opportunities and our network of trusted local property managers.',
      ]}
      listings={listings}
      cities={cities}
      emptyText="No rental listings on the MLS right now. Reach out — we frequently know about availability before it hits the open market."
    />
  );
}
