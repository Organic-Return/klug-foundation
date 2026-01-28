import { Metadata } from 'next';
import { getOffMarketListings } from '@/lib/offMarketListings';
import OffMarketListingsContent from '@/components/OffMarketListingsContent';

export const metadata: Metadata = {
  title: 'Off-Market Listings | Exclusive Properties',
  description: 'Access exclusive off-market properties not available to the general public. Register to view our private collection of premium real estate listings.',
};

export const dynamic = 'force-dynamic';

export default async function OffMarketPage() {
  const listings = await getOffMarketListings();

  return <OffMarketListingsContent listings={listings} />;
}
