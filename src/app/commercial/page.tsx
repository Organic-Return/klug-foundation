import type { Metadata } from 'next';
import { getCommercialListings, getDistinctCities } from '@/lib/listings';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import PropertyTypeHub from '@/components/PropertyTypeHub';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Commercial Real Estate in Aspen Snowmass | ${siteName}`,
    description:
      'Commercial real estate, multi-family income property, and mixed-use opportunities across Aspen, Snowmass Village, Basalt, and the Roaring Fork Valley.',
    alternates: { canonical: `${baseUrl}/commercial` },
    openGraph: {
      title: `Commercial Real Estate in Aspen Snowmass | ${siteName}`,
      description:
        'Commercial, multi-family, and mixed-use real estate across the Roaring Fork Valley.',
      url: `${baseUrl}/commercial`,
    },
  };
}

export default async function CommercialHubPage() {
  const [listings, cities] = await Promise.all([getCommercialListings(), getDistinctCities()]);
  return (
    <PropertyTypeHub
      type="commercial"
      title="Commercial Real Estate"
      intro={[
        'Aspen Snowmass commercial real estate is among the most valuable on a per-square-foot basis in North America. Limited zoning, scarce buildable land, and persistent demand from a global resort economy support unusually strong fundamentals across retail, office, restaurant, hospitality, and mixed-use product. Klug Properties represents buyers, sellers, and investors evaluating the full spectrum of commercial opportunities across Aspen, Snowmass Village, Basalt, and the surrounding Roaring Fork Valley.',
        'The listings below include multi-family income properties (duplex, triplex, apartment buildings), mixed-use buildings, and dedicated commercial spaces currently surfaced on the Aspen Glenwood MLS. For off-market commercial opportunities, 1031 exchange targets, or development-site evaluations, contact our team — we maintain relationships with valley building owners that often surface inventory long before it lists publicly.',
      ]}
      listings={listings}
      cities={cities}
      emptyText="No commercial listings on the MLS right now. Off-market opportunities surface frequently — get in touch."
    />
  );
}
