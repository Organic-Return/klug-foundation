import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOffMarketListingBySlug, getOffMarketListings, formatPrice } from '@/lib/offMarketListings';
import OffMarketListingDetail from '@/components/OffMarketListingDetail';

interface OffMarketListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OffMarketListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getOffMarketListingBySlug(slug);

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  return {
    title: `${listing.address || 'Off-Market Property'} | ${formatPrice(listing.listPrice)}`,
    description: listing.description || `Exclusive off-market ${listing.propertyType || 'property'} in ${listing.city}, ${listing.state}`,
  };
}

export async function generateStaticParams() {
  const listings = await getOffMarketListings();
  return listings.map((listing) => ({
    slug: listing.slug,
  }));
}

export default async function OffMarketListingPage({ params }: OffMarketListingPageProps) {
  const { slug } = await params;
  const listing = await getOffMarketListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  return <OffMarketListingDetail listing={listing} />;
}
