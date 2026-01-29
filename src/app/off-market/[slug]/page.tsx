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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const canonicalUrl = `${baseUrl}/off-market/${slug}`;
  const title = `${listing.address || 'Off-Market Property'} | ${formatPrice(listing.listPrice)}`;
  const description = listing.description || `Exclusive off-market ${listing.propertyType || 'property'} in ${listing.city}, ${listing.state}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
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
