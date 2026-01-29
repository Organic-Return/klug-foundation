import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getListingById,
  formatPrice,
  formatSqft,
  formatLotSize,
  type MLSProperty,
} from '@/lib/listings';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyDetailsTabs from '@/components/PropertyDetailsTabs';
import SavePropertyButton from '@/components/SavePropertyButton';
import ScheduleTourButton from '@/components/ScheduleTourButton';
import RequestInfoButton from '@/components/RequestInfoButton';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

// Helper to get the base URL
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

// Generate Schema.org RealEstateListing structured data
function generateRealEstateSchema(listing: MLSProperty) {
  const baseUrl = getBaseUrl();
  const listingUrl = `${baseUrl}/listings/${listing.id}`;

  // Main RealEstateListing schema
  const realEstateSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': listingUrl,
    url: listingUrl,
    name: listing.address || `Property ${listing.mls_number}`,
    description: listing.description || `${listing.property_type || 'Property'} in ${listing.city}, ${listing.state}`,
    datePosted: listing.listing_date,
    ...(listing.sold_date && { dateModified: listing.sold_date }),

    // Property details
    ...(listing.list_price && {
      offers: {
        '@type': 'Offer',
        price: listing.list_price,
        priceCurrency: 'USD',
        availability: listing.status === 'Active'
          ? 'https://schema.org/InStock'
          : listing.status === 'Pending'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/SoldOut',
        ...(listing.sold_price && listing.status === 'Closed' && {
          priceValidUntil: listing.sold_date,
        }),
      },
    }),

    // Images
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
      primaryImageOfPage: listing.photos[0],
    }),

    // Location
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip_code,
      addressCountry: 'US',
    },

    // Geo coordinates
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),

    // Additional identifiers
    identifier: {
      '@type': 'PropertyValue',
      name: 'MLS Number',
      value: listing.mls_number,
    },
  };

  // Residence/SingleFamilyResidence schema for the property itself
  const propertySchema = {
    '@context': 'https://schema.org',
    '@type': listing.property_type === 'Condo' || listing.property_type === 'Townhouse'
      ? 'Apartment'
      : listing.property_type === 'Land'
      ? 'LandmarksOrHistoricalBuildings'
      : 'SingleFamilyResidence',
    '@id': `${listingUrl}#property`,
    name: listing.address || `Property ${listing.mls_number}`,
    description: listing.description,
    url: listingUrl,

    // Property characteristics
    ...(listing.bedrooms !== null && { numberOfRooms: listing.bedrooms }),
    ...(listing.bathrooms !== null && { numberOfBathroomsTotal: listing.bathrooms }),
    ...(listing.square_feet && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: listing.square_feet,
        unitCode: 'FTK', // Square feet
      },
    }),
    ...(listing.lot_size && {
      lotSize: {
        '@type': 'QuantitativeValue',
        value: listing.lot_size,
        unitCode: 'ACR', // Acres
      },
    }),
    ...(listing.year_built && { yearBuilt: listing.year_built }),

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip_code,
      addressCountry: 'US',
    },

    // Geo
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),

    // Images
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
    }),
  };

  // Product schema (for Google rich results)
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${listingUrl}#product`,
    name: `${listing.address || 'Property'} - ${listing.city}, ${listing.state}`,
    description: listing.description || `${listing.bedrooms || 0} bed, ${listing.bathrooms || 0} bath ${listing.property_type || 'property'} in ${listing.city}, ${listing.state}`,
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
    }),
    sku: listing.mls_number,
    category: listing.property_type || 'Real Estate',
    ...(listing.list_price && {
      offers: {
        '@type': 'Offer',
        price: listing.list_price,
        priceCurrency: 'USD',
        availability: listing.status === 'Active'
          ? 'https://schema.org/InStock'
          : listing.status === 'Pending'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/SoldOut',
        url: listingUrl,
        seller: {
          '@type': 'RealEstateAgent',
          name: listing.agent_name || 'Listing Agent',
          ...(listing.agent_email && { email: listing.agent_email }),
        },
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
        name: 'Listings',
        item: `${baseUrl}/listings`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: listing.address || listing.mls_number,
        item: listingUrl,
      },
    ],
  };

  return [realEstateSchema, propertySchema, productSchema, breadcrumbSchema];
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  const baseUrl = getBaseUrl();
  const listingUrl = `${baseUrl}/listings/${listing.id}`;
  const title = `${listing.address || 'Property'} | ${formatPrice(listing.list_price)} | ${listing.city}, ${listing.state}`;
  const description = listing.description
    || `${listing.bedrooms || 0} bed, ${listing.bathrooms || 0} bath ${listing.property_type || 'property'} for ${listing.status === 'Closed' ? 'sale (sold)' : 'sale'} in ${listing.city}, ${listing.state}. ${listing.square_feet ? `${listing.square_feet.toLocaleString()} sq ft.` : ''} MLS# ${listing.mls_number}`;
  const images = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const primaryImage = images[0] || `${baseUrl}/og-default.jpg`;

  return {
    title,
    description,

    // Canonical URL
    alternates: {
      canonical: listingUrl,
    },

    // Keywords
    keywords: [
      listing.city,
      listing.state,
      listing.property_type,
      'real estate',
      'property',
      'home for sale',
      listing.neighborhood,
      `${listing.bedrooms} bedroom`,
      `${listing.bathrooms} bathroom`,
    ].filter(Boolean) as string[],

    // Open Graph
    openGraph: {
      type: 'website',
      url: listingUrl,
      title,
      description,
      siteName: 'Real Estate Listings',
      locale: 'en_US',
      images: images.length > 0
        ? images.slice(0, 4).map((img, index) => ({
            url: img,
            width: 1200,
            height: 630,
            alt: index === 0
              ? `${listing.address} - Main Photo`
              : `${listing.address} - Photo ${index + 1}`,
          }))
        : [{
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: listing.address || 'Property Photo',
          }],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${listing.address || 'Property'} - ${formatPrice(listing.list_price)}`,
      description: `${listing.bedrooms || 0} bd | ${listing.bathrooms || 0} ba | ${listing.square_feet?.toLocaleString() || 'N/A'} sqft in ${listing.city}, ${listing.state}`,
      images: [primaryImage],
      creator: '@yourtwitterhandle',
      site: '@yourtwitterhandle',
    },

    // Robots
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

    // Other meta
    other: {
      // Real estate specific meta tags
      'og:price:amount': listing.list_price?.toString() || '',
      'og:price:currency': 'USD',
      'product:price:amount': listing.list_price?.toString() || '',
      'product:price:currency': 'USD',
      'product:availability': listing.status === 'Active' ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:category': listing.property_type || 'Real Estate',

      // Property specific
      'property:bedrooms': listing.bedrooms?.toString() || '',
      'property:bathrooms': listing.bathrooms?.toString() || '',
      'property:sqft': listing.square_feet?.toString() || '',
      'property:type': listing.property_type || '',
      'property:mls': listing.mls_number,
      'property:status': listing.status,

      // Geo tags
      ...(listing.latitude && listing.longitude && {
        'geo.position': `${listing.latitude};${listing.longitude}`,
        'ICBM': `${listing.latitude}, ${listing.longitude}`,
        'geo.placename': `${listing.city}, ${listing.state}`,
        'geo.region': `US-${listing.state}`,
      }),
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const hasPhotos = listing.photos && listing.photos.length > 0;
  const schemas = generateRealEstateSchema(listing);

  return (
    <>
      {/* Schema.org JSON-LD */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-[#f8f7f5]" itemScope itemType="https://schema.org/RealEstateListing">
        {/* Hidden microformat data */}
        <meta itemProp="url" content={`${getBaseUrl()}/listings/${listing.id}`} />
        <meta itemProp="datePosted" content={listing.listing_date || ''} />

        {/* Back Link */}
        <div className="bg-[var(--color-sothebys-blue)]">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
                </li>
                <li className="text-white/50">/</li>
                <li>
                  <Link href="/listings" className="text-white/70 hover:text-white transition-colors">Listings</Link>
                </li>
                <li className="text-white/50">/</li>
                <li className="text-white font-medium" aria-current="page">
                  {listing.address || listing.mls_number}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Photo Gallery */}
        <PropertyGallery photos={listing.photos || []} address={listing.address ?? undefined} />

        {/* Property Header Section */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left: Address and Status */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className={`px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] ${
                      listing.status === 'Active'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : listing.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : listing.status === 'Closed'
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {listing.status}
                  </span>
                  {listing.property_type && (
                    <span className="px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] bg-[#f8f7f5] text-gray-600 border border-gray-200">
                      {listing.property_type}
                    </span>
                  )}
                  <SavePropertyButton listingId={listing.id} listingType="mls" variant="button" />
                </div>

                <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <h1 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a]">
                    <span itemProp="streetAddress" className="block">
                      {listing.address?.split(',')[0] || listing.address}
                    </span>
                    <span className="block text-xl md:text-2xl text-gray-500 mt-1">
                      <span itemProp="addressLocality">{listing.city}</span>,{' '}
                      <span itemProp="addressRegion">{listing.state}</span>{' '}
                      <span itemProp="postalCode">{listing.zip_code}</span>
                    </span>
                  </h1>
                  <meta itemProp="addressCountry" content="US" />
                </div>

                {/* Price below address */}
                <div className="mt-4" itemProp="name">
                  <div className="text-3xl md:text-4xl font-serif font-light text-[var(--color-sothebys-blue)]">
                    <span itemProp="price" content={listing.list_price?.toString()}>
                      {formatPrice(listing.list_price)}
                    </span>
                    <meta itemProp="priceCurrency" content="USD" />
                  </div>
                  {listing.status === 'Closed' && listing.sold_price && (
                    <p className="text-sm text-gray-500 mt-1">
                      Sold for {formatPrice(listing.sold_price)}
                      {listing.sold_date && (
                        <span className="ml-1">
                          on <time dateTime={listing.sold_date}>{new Date(listing.sold_date).toLocaleDateString()}</time>
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Hidden geo data */}
                {listing.latitude && listing.longitude && (
                  <div itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates" className="hidden">
                    <meta itemProp="latitude" content={listing.latitude.toString()} />
                    <meta itemProp="longitude" content={listing.longitude.toString()} />
                  </div>
                )}
              </div>

              {/* Right: CTA */}
              <div className="flex items-start">
                <ScheduleTourButton propertyAddress={listing.address || `Property ${listing.mls_number}`} />
              </div>
            </div>

            {/* Key Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 md:gap-10 mt-8 pt-8 border-t border-gray-100">
              {listing.bedrooms !== null && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div>
                    <span className="text-2xl font-light text-[#1a1a1a]" itemProp="numberOfRooms">{listing.bedrooms}</span>
                    <span className="text-sm text-gray-500 ml-2">Bedrooms</span>
                  </div>
                </div>
              )}
              {listing.bathrooms !== null && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 12m4-4v12" />
                  </svg>
                  <div>
                    <span className="text-2xl font-light text-[#1a1a1a]">{listing.bathrooms}</span>
                    <span className="text-sm text-gray-500 ml-2">Bathrooms</span>
                  </div>
                </div>
              )}
              {listing.square_feet && (
                <div className="flex items-center gap-3" itemProp="floorSize" itemScope itemType="https://schema.org/QuantitativeValue">
                  <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <div>
                    <span className="text-2xl font-light text-[#1a1a1a]" itemProp="value">{listing.square_feet.toLocaleString()}</span>
                    <span className="text-sm text-gray-500 ml-2" itemProp="unitText">Sq Ft</span>
                  </div>
                </div>
              )}
              {listing.lot_size && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <span className="text-2xl font-light text-[#1a1a1a]">
                      {listing.lot_size >= 1 ? listing.lot_size.toFixed(2) : (listing.lot_size * 43560).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {listing.lot_size >= 1 ? 'Acres' : 'Sq Ft Lot'}
                    </span>
                  </div>
                </div>
              )}
              {listing.year_built && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-2xl font-light text-[#1a1a1a]" itemProp="yearBuilt">{listing.year_built}</span>
                    <span className="text-sm text-gray-500 ml-2">Year Built</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Tabbed Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tabbed Content */}
              <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                <PropertyDetailsTabs
                  description={listing.description}
                  overview={{
                    bedrooms: listing.bedrooms,
                    bathrooms: listing.bathrooms,
                    bathroomsFull: listing.bathrooms_full,
                    bathroomsThreeQuarter: listing.bathrooms_three_quarter,
                    bathroomsHalf: listing.bathrooms_half,
                    squareFeet: listing.square_feet,
                    lotSize: listing.lot_size,
                    yearBuilt: listing.year_built,
                    propertyType: listing.property_type,
                    subdivisionName: listing.subdivision_name,
                    mlsAreaMinor: listing.mls_area_minor,
                    mlsNumber: listing.mls_number,
                    listingDate: listing.listing_date,
                    daysOnMarket: listing.days_on_market,
                    furnished: listing.furnished,
                  }}
                  features={{
                    fireplaceYn: listing.fireplace_yn,
                    fireplaceTotal: listing.fireplace_total,
                    fireplaceFeatures: listing.fireplace_features,
                    cooling: listing.cooling,
                    heating: listing.heating,
                    laundryFeatures: listing.laundry_features,
                    attachedGarageYn: listing.attached_garage_yn,
                    parkingFeatures: listing.parking_features,
                    associationAmenities: listing.association_amenities,
                    otherFeatures: listing.features,
                  }}
                />
              </div>

              {/* Virtual Tour - Matterport only */}
              {listing.virtual_tour_url && listing.virtual_tour_url.includes('matterport') && (
                <div className="bg-white p-6 rounded-sm shadow-sm">
                  <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-6">
                    Virtual Tour
                  </h2>
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={listing.virtual_tour_url}
                      title={`Virtual tour of ${listing.address}`}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Request Info CTA */}
              <div className="bg-[var(--color-sothebys-blue)] p-6 rounded-sm">
                <h3 className="font-serif text-xl font-light text-white mb-2">Request Information</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Have questions about this property? We're here to help.
                </p>
                <RequestInfoButton propertyAddress={listing.address || `Property ${listing.mls_number}`} />
              </div>

              {/* MLS Disclaimer */}
              <div className="text-xs text-gray-400 leading-relaxed">
                <p>MLS# {listing.mls_number}</p>
                <p className="mt-2">
                  Listing information is deemed reliable but not guaranteed. All measurements and square footage are approximate.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Full Width Map Section */}
        {listing.latitude && listing.longitude && (
          <section className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)]">
                  Location
                </h2>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--color-sothebys-blue)] hover:underline flex items-center gap-1"
                >
                  Get Directions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="w-full h-[600px] grayscale">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${listing.latitude},${listing.longitude}&zoom=15`}
                title={`Map of ${listing.address}`}
              />
            </div>
          </section>
        )}

        {/* Contact Form Section */}
        <section className="py-16 md:py-24 bg-[var(--color-sothebys-blue)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-light text-white mb-4">
                Learn More About {listing.address?.split(',')[0] || listing.address}
              </h2>
              <p className="text-white/70 font-light">
                Fill out the form below and we'll be in touch shortly.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm text-white/80 mb-2 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm text-white/80 mb-2 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm text-white/80 mb-2 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm text-white/80 mb-2 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-white/80 mb-2 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors resize-none"
                  placeholder={`I'm interested in learning more about ${listing.address?.split(',')[0] || listing.address}...`}
                />
              </div>

              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 px-12 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                >
                  Send Message
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
