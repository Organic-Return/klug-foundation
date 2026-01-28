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
import SavePropertyButton from '@/components/SavePropertyButton';

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

      <div className="min-h-screen bg-gray-50" itemScope itemType="https://schema.org/RealEstateListing">
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

        {/* Photo Gallery - 16:9 Aspect Ratio with Navigation */}
        <PropertyGallery photos={listing.photos || []} address={listing.address} />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <header>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        listing.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : listing.status === 'Closed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {listing.status}
                    </span>
                    {listing.property_type && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                        {listing.property_type}
                      </span>
                    )}
                  </div>
                  <SavePropertyButton listingId={listing.id} listingType="mls" variant="button" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2" itemProp="name">
                  <span itemProp="price" content={listing.list_price?.toString()}>
                    {formatPrice(listing.list_price)}
                  </span>
                  <meta itemProp="priceCurrency" content="USD" />
                </h1>

                {listing.status === 'Closed' && listing.sold_price && (
                  <p className="text-lg text-gray-600 mb-2">
                    Sold for {formatPrice(listing.sold_price)}
                    {listing.sold_date && (
                      <span className="text-sm ml-2">
                        on <time dateTime={listing.sold_date}>{new Date(listing.sold_date).toLocaleDateString()}</time>
                      </span>
                    )}
                  </p>
                )}

                <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <p className="text-xl text-gray-600" itemProp="streetAddress">{listing.address}</p>
                  <p className="text-gray-500">
                    <span itemProp="addressLocality">{listing.city}</span>,
                    <span itemProp="addressRegion"> {listing.state}</span>
                    <span itemProp="postalCode"> {listing.zip_code}</span>
                  </p>
                  <meta itemProp="addressCountry" content="US" />
                </div>

                {/* Hidden geo data */}
                {listing.latitude && listing.longitude && (
                  <div itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates" className="hidden">
                    <meta itemProp="latitude" content={listing.latitude.toString()} />
                    <meta itemProp="longitude" content={listing.longitude.toString()} />
                  </div>
                )}
              </header>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {listing.bedrooms !== null && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-900" itemProp="numberOfRooms">{listing.bedrooms}</div>
                    <div className="text-sm text-gray-500">Bedrooms</div>
                  </div>
                )}
                {listing.bathrooms !== null && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{listing.bathrooms}</div>
                    <div className="text-sm text-gray-500">Bathrooms</div>
                    {(listing.bathrooms_full || listing.bathrooms_three_quarter || listing.bathrooms_half) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {[
                          listing.bathrooms_full && `${listing.bathrooms_full} full`,
                          listing.bathrooms_three_quarter && `${listing.bathrooms_three_quarter} ¾`,
                          listing.bathrooms_half && `${listing.bathrooms_half} half`,
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                )}
                {listing.square_feet && (
                  <div className="bg-white p-4 rounded-lg shadow-sm" itemProp="floorSize" itemScope itemType="https://schema.org/QuantitativeValue">
                    <div className="text-2xl font-bold text-gray-900">
                      <span itemProp="value">{listing.square_feet.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-500"><span itemProp="unitText">Sq Ft</span></div>
                  </div>
                )}
                {listing.year_built && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-900" itemProp="yearBuilt">{listing.year_built}</div>
                    <div className="text-sm text-gray-500">Year Built</div>
                  </div>
                )}
                {listing.lot_size && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">
                      {listing.lot_size >= 1 ? listing.lot_size.toFixed(2) : (listing.lot_size * 43560).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {listing.lot_size >= 1 ? 'Acres' : 'Sq Ft Lot'}
                    </div>
                  </div>
                )}
                {listing.days_on_market !== null && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{listing.days_on_market}</div>
                    <div className="text-sm text-gray-500">Days on Market</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed" itemProp="description">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {listing.features && Object.keys(listing.features).length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(listing.features).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">
                          {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Tour - Matterport only */}
              {listing.virtual_tour_url && listing.virtual_tour_url.includes('matterport') && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Virtual Tour</h2>
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
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

              {/* Map */}
              {listing.latitude && listing.longitude && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
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
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Agent Info */}
              {listing.agent_name && (
                <div className="bg-white p-6 rounded-lg shadow-sm" itemProp="seller" itemScope itemType="https://schema.org/RealEstateAgent">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Agent</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900" itemProp="name">{listing.agent_name}</p>
                      {listing.agent_email && (
                        <a
                          href={`mailto:${listing.agent_email}`}
                          className="text-sm text-blue-600 hover:underline"
                          itemProp="email"
                        >
                          {listing.agent_email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">MLS #</dt>
                    <dd className="font-medium text-gray-900" itemProp="identifier">{listing.mls_number}</dd>
                  </div>
                  {listing.property_type && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Type</dt>
                      <dd className="font-medium text-gray-900">{listing.property_type}</dd>
                    </div>
                  )}
                  {listing.subdivision_name && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Subdivision</dt>
                      <dd className="font-medium text-gray-900">{listing.subdivision_name}</dd>
                    </div>
                  )}
                  {listing.mls_area_minor && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Area</dt>
                      <dd className="font-medium text-gray-900">{listing.mls_area_minor}</dd>
                    </div>
                  )}
                  {listing.listing_date && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Listed</dt>
                      <dd className="font-medium text-gray-900">
                        <time dateTime={listing.listing_date}>
                          {new Date(listing.listing_date).toLocaleDateString()}
                        </time>
                      </dd>
                    </div>
                  )}
                  {listing.year_built && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Year Built</dt>
                      <dd className="font-medium text-gray-900">{listing.year_built}</dd>
                    </div>
                  )}
                  {listing.lot_size && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Lot Size</dt>
                      <dd className="font-medium text-gray-900">{formatLotSize(listing.lot_size)}</dd>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Living Area</dt>
                      <dd className="font-medium text-gray-900">{formatSqft(listing.square_feet)}</dd>
                    </div>
                  )}
                  {listing.furnished && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Furnished</dt>
                      <dd className="font-medium text-gray-900">{listing.furnished}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Interior Features */}
              {(listing.fireplace_yn || listing.cooling?.length || listing.heating?.length || listing.laundry_features?.length) && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interior Features</h3>
                  <dl className="space-y-3">
                    {listing.fireplace_yn && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Fireplace</dt>
                        <dd className="font-medium text-gray-900">
                          {listing.fireplace_total ? `${listing.fireplace_total} fireplace${listing.fireplace_total > 1 ? 's' : ''}` : 'Yes'}
                        </dd>
                      </div>
                    )}
                    {listing.fireplace_features && listing.fireplace_features.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Fireplace Features</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.fireplace_features.join(', ')}</dd>
                      </div>
                    )}
                    {listing.cooling && listing.cooling.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Cooling</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.cooling.join(', ')}</dd>
                      </div>
                    )}
                    {listing.heating && listing.heating.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Heating</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.heating.join(', ')}</dd>
                      </div>
                    )}
                    {listing.laundry_features && listing.laundry_features.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Laundry</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.laundry_features.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Parking & Garage */}
              {(listing.attached_garage_yn !== null || listing.parking_features?.length) && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parking</h3>
                  <dl className="space-y-3">
                    {listing.attached_garage_yn !== null && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Attached Garage</dt>
                        <dd className="font-medium text-gray-900">{listing.attached_garage_yn ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                    {listing.parking_features && listing.parking_features.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Parking Features</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.parking_features.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Association Amenities */}
              {listing.association_amenities && listing.association_amenities.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Association Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.association_amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact CTA */}
              <div className="bg-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Interested in this property?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Contact us for more information or to schedule a viewing.
                </p>
                <button className="w-full bg-white text-blue-600 font-semibold py-3 px-4 rounded-md hover:bg-blue-50 transition-colors">
                  Request Information
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
