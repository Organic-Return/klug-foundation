import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOffMarketListingBySlug, getOffMarketListings, formatPrice, getTotalBathrooms, type OffMarketListing } from '@/lib/offMarketListings';
import OffMarketListingDetail from '@/components/OffMarketListingDetail';
import SchemaGraph from '@/components/SchemaGraph';
import { getTenant, ids, listingNodes, webPageNode, breadcrumbNode, truncate, type Tenant } from '@/lib/schema';
import { getGoogleMapsApiKey } from '@/lib/settings';

interface OffMarketListingPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Structured data for an off-market listing: WebPage, breadcrumb, the
 * RealEstateListing with its offer (always sold by the business, since
 * off-market listings are the tenant's own), the home itself and the Mux
 * video when one was uploaded.
 */
function offMarketSchemaNodes(listing: OffMarketListing, tenant: Tenant) {
  const listingUrl = `${tenant.baseUrl}/off-market/${listing.slug}`;
  const name = listing.address || listing.title || 'Off-Market Property';
  const description =
    truncate(listing.description) || `Exclusive off-market ${listing.propertyType || 'property'} in ${listing.city}, ${listing.state}`;
  const photos = [listing.featuredImageUrl, ...listing.photos].filter((p): p is string => !!p);
  return [
    webPageNode({
      tenant,
      url: listingUrl,
      name,
      description,
      type: 'ItemPage',
      image: photos[0],
      hasBreadcrumb: true,
      mainEntityId: ids.mainEntity(listingUrl),
      datePublished: listing.publishedAt,
    }),
    breadcrumbNode(listingUrl, [
      { name: 'Home', url: `${tenant.baseUrl}/` },
      { name: 'Off-Market Listings', url: `${tenant.baseUrl}/off-market` },
      { name, url: listingUrl },
    ]),
    ...listingNodes({
      url: listingUrl,
      name,
      description,
      mlsNumber: undefined,
      photos: [...new Set(photos)],
      address: { street: listing.address, city: listing.city, state: listing.state, postalCode: listing.zipCode },
      geo: { lat: listing.latitude, lng: listing.longitude },
      propertyType: listing.propertyType,
      bedrooms: listing.bedrooms,
      bathrooms: getTotalBathrooms(listing) || null,
      squareFeet: listing.squareFeet,
      lotSizeAcres: listing.lotSize,
      yearBuilt: listing.yearBuilt,
      listPrice: listing.listPrice,
      status: listing.status,
      listingDate: listing.listingDate || listing.publishedAt,
      soldDate: listing.soldDate,
      sellerId: ids.organization(tenant.baseUrl),
      video: listing.videoMuxPlaybackId
        ? {
            url: listingUrl,
            name: `${name} video tour`,
            thumbnailUrl: `https://image.mux.com/${listing.videoMuxPlaybackId}/thumbnail.jpg`,
            uploadDate: listing.publishedAt,
            contentUrl: `https://stream.mux.com/${listing.videoMuxPlaybackId}.m3u8`,
          }
        : null,
    }),
  ];
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
  const rawDescription = listing.description || `Exclusive off-market ${listing.propertyType || 'property'} in ${listing.city}, ${listing.state}`;
  const description = rawDescription.length > 300 ? rawDescription.slice(0, 297) + '...' : rawDescription;
  const images = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const primaryImage = images[0] || listing.featuredImageUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      listing.city,
      listing.state,
      listing.propertyType,
      'off-market',
      'exclusive listing',
      'real estate',
      'property',
      listing.subdivisionName,
    ].filter(Boolean) as string[],
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonicalUrl,
      images: images.length > 0
        ? images.slice(0, 4).map((img, index) => ({
            url: img,
            width: 1200,
            height: 630,
            alt: index === 0
              ? `${listing.address} - Main Photo`
              : `${listing.address} - Photo ${index + 1}`,
          }))
        : primaryImage
        ? [{ url: primaryImage, width: 1200, height: 630, alt: listing.address || 'Property Photo' }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.address || 'Off-Market Property'} - ${formatPrice(listing.listPrice)}`,
      description: `${listing.bedrooms || 0} bd | ${getTotalBathrooms(listing)} ba | ${listing.squareFeet?.toLocaleString() || 'N/A'} sqft in ${listing.city}, ${listing.state}`,
      images: primaryImage ? [primaryImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'og:price:amount': listing.listPrice?.toString() || '',
      'og:price:currency': 'USD',
      ...(listing.latitude && listing.longitude && {
        'geo.position': `${listing.latitude};${listing.longitude}`,
        'ICBM': `${listing.latitude}, ${listing.longitude}`,
        'geo.placename': `${listing.city}, ${listing.state}`,
        'geo.region': `US-${listing.state}`,
      }),
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
  const [listing, googleMapsApiKey] = await Promise.all([
    getOffMarketListingBySlug(slug),
    // Same env-var fallback as the other map-bearing routes, so the loader
    // singleton's options stay identical across every map on the page.
    getGoogleMapsApiKey().catch(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''),
  ]);

  if (!listing) {
    notFound();
  }

  const tenant = await getTenant();
  const schemaNodes = offMarketSchemaNodes(listing, tenant);

  return (
    <>
      <SchemaGraph nodes={schemaNodes} />
      <OffMarketListingDetail listing={listing} googleMapsApiKey={googleMapsApiKey} />
    </>
  );
}
