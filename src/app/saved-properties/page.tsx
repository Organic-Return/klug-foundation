import { Metadata } from 'next';
import { getListings } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';
import SavedPropertiesContent from '@/components/SavedPropertiesContent';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Saved Properties | Your Favorites',
    description: 'View and manage your saved properties.',
    alternates: {
      canonical: `${baseUrl}/saved-properties`,
    },
    openGraph: {
      title: 'Saved Properties | Your Favorites',
      description: 'View and manage your saved properties.',
      url: `${baseUrl}/saved-properties`,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function SavedPropertiesPage() {
  // Fetch all listings that could potentially be saved
  // In a real app, you might want to fetch only the saved IDs first,
  // then fetch the specific listings
  const [mlsResult, offMarketListings] = await Promise.all([
    getListings(1, 1000, {}), // Fetch MLS listings
    getOffMarketListings(),   // Fetch off-market listings
  ]);

  return (
    <SavedPropertiesContent
      mlsListings={mlsResult.listings}
      offMarketListings={offMarketListings}
    />
  );
}
