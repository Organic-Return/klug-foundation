import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOffMarketListingBySlug, getOffMarketListings, formatPrice, getTotalBathrooms, type OffMarketListing } from '@/lib/offMarketListings';
import OffMarketListingDetail from '@/components/OffMarketListingDetail';
import StructuredData from '@/components/StructuredData';

interface OffMarketListingPageProps {
  params: Promise<{ slug: string }>;
}

// Helper to get the base URL
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

// Generate Schema.org structured data for off-market listing
function generateOffMarketSchema(listing: OffMarketListing) {
  const baseUrl = getBaseUrl();
  const listingUrl = `${baseUrl}/off-market/${listing.slug}`;
  const totalBathrooms = getTotalBathrooms(listing);

  // RealEstateListing schema
  const realEstateSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': listingUrl,
    url: listingUrl,
    name: listing.address || listing.title,
    description: listing.description || `${listing.propertyType || 'Property'} in ${listing.city}, ${listing.state}`,
    datePosted: listing.listingDate || listing.publishedAt,
    ...(listing.soldDate && { dateModified: listing.soldDate }),
    ...(listing.listPrice && {
      offers: {
        '@type': 'Offer',
        price: listing.listPrice,
        priceCurrency: 'USD',
        availability: listing.status === 'Active'
          ? 'https://schema.org/InStock'
          : listing.status === 'Pending'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/SoldOut',
      },
    }),
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
      primaryImageOfPage: listing.photos[0],
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zipCode,
      addressCountry: 'US',
    },
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),
  };

  // Residence schema
  const propertySchema = {
    '@context': 'https://schema.org',
    '@type': listing.propertyType === 'Condo' || listing.propertyType === 'Townhouse'
      ? 'Apartment'
      : listing.propertyType === 'Land'
      ? 'LandmarksOrHistoricalBuildings'
      : 'SingleFamilyResidence',
    '@id': `${listingUrl}#property`,
    name: listing.address || listing.title,
    description: listing.description,
    url: listingUrl,
    ...(listing.bedrooms !== null && { numberOfRooms: listing.bedrooms }),
    ...(totalBathrooms > 0 && { numberOfBathroomsTotal: totalBathrooms }),
    ...(listing.squareFeet && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: listing.squareFeet,
        unitCode: 'FTK',
      },
    }),
    ...(listing.lotSize && {
      lotSize: {
        '@type': 'QuantitativeValue',
        value: listing.lotSize,
        unitCode: 'ACR',
      },
    }),
    ...(listing.yearBuilt && { yearBuilt: listing.yearBuilt }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zipCode,
      addressCountry: 'US',
    },
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),
    ...(listing.photos && listing.photos.length > 0 && { image: listing.photos }),
  };

  // Product schema for rich results
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${listingUrl}#product`,
    name: `${listing.address || 'Property'} - ${listing.city}, ${listing.state}`,
    description: listing.description || `${listing.bedrooms || 0} bed, ${totalBathrooms} bath ${listing.propertyType || 'property'} in ${listing.city}, ${listing.state}`,
    ...(listing.photos && listing.photos.length > 0 && { image: listing.photos }),
    sku: listing.slug,
    category: listing.propertyType || 'Real Estate',
    ...(listing.listPrice && {
      offers: {
        '@type': 'Offer',
        price: listing.listPrice,
        priceCurrency: 'USD',
        availability: listing.status === 'Active'
          ? 'https://schema.org/InStock'
          : listing.status === 'Pending'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/SoldOut',
        url: listingUrl,
        ...(listing.agentName && {
          seller: {
            '@type': 'RealEstateAgent',
            name: listing.agentName,
            ...(listing.agentEmail && { email: listing.agentEmail }),
          },
        }),
      },
    }),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Off-Market Listings',
        item: `${baseUrl}/off-market`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: listing.address || listing.title,
        item: listingUrl,
      },
    ],
  };

  return [realEstateSchema, propertySchema, productSchema, breadcrumbSchema];
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
  const listing = await getOffMarketListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const schemas = generateOffMarketSchema(listing);

  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
      <OffMarketListingDetail listing={listing} />
    </>
  );
}
