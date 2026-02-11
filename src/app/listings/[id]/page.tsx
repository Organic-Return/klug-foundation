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
import { getSettings } from '@/lib/settings';
import { client } from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyDetailsTabs from '@/components/PropertyDetailsTabs';
import PropertyMap from '@/components/PropertyMap';
import SavePropertyButton from '@/components/SavePropertyButton';
import ScheduleTourButton from '@/components/ScheduleTourButton';
import RequestInfoButton from '@/components/RequestInfoButton';
import PropertyMedia from '@/components/PropertyMedia';
import CustomOneListingContent from '@/components/CustomOneListingContent';
import RCSothebysListingContent from '@/components/RCSothebysListingContent';
import StickyRequestInfo from '@/components/StickyRequestInfo';

const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface ListingAgent {
  name: string;
  slug: { current: string };
  title?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
}

async function getListingAgent(listing: MLSProperty): Promise<ListingAgent | null> {
  const agentIds = [
    listing.list_agent_mls_id,
    listing.co_list_agent_mls_id,
    listing.buyer_agent_mls_id,
    listing.co_buyer_agent_mls_id,
  ].filter(Boolean);

  if (agentIds.length === 0) return null;

  // Find a team member whose mlsAgentId or mlsAgentIdSold matches any of the listing's agent IDs
  const agent = await client.fetch<ListingAgent | null>(
    `*[_type == "teamMember" && (mlsAgentId in $ids || mlsAgentIdSold in $ids)][0]{
      name,
      slug,
      title,
      image,
      email,
      phone,
      mobile
    }`,
    { ids: agentIds },
    { next: { revalidate: 60 } }
  );

  return agent;
}

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
  const rawDescription = listing.description
    || `${listing.bedrooms || 0} bed, ${listing.bathrooms || 0} bath ${listing.property_type || 'property'} for ${listing.status === 'Closed' ? 'sale (sold)' : 'sale'} in ${listing.city}, ${listing.state}. ${listing.square_feet ? `${listing.square_feet.toLocaleString()} sq ft.` : ''} MLS# ${listing.mls_number}`;
  const description = rawDescription.length > 300 ? rawDescription.slice(0, 297) + '...' : rawDescription;
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

  const [listing, settings] = await Promise.all([
    getListingById(id),
    getSettings(),
  ]);

  if (!listing) {
    notFound();
  }

  const template = settings?.template || 'classic';

  // Fetch property enhancements (videos/documents) from Sanity
  const propertyEnhancement = await client.fetch<{
    videos?: Array<{
      _key: string;
      title: string;
      videoType: 'mux' | 'youtube' | 'vimeo' | 'url';
      muxPlaybackId?: string;
      youtubeId?: string;
      vimeoId?: string;
      externalUrl?: string;
      thumbnail?: { asset: { url: string } };
      description?: string;
    }>;
    documents?: Array<{
      _key: string;
      title: string;
      documentType: string;
      file: { asset: { url: string; originalFilename?: string } };
      description?: string;
    }>;
  } | null>(
    `*[_type == "propertyEnhancement" && mlsNumber == $mlsNumber][0]{
      videos[]{
        _key,
        title,
        videoType,
        muxPlaybackId,
        youtubeId,
        vimeoId,
        externalUrl,
        thumbnail{ asset->{ url } },
        description
      },
      documents[]{
        _key,
        title,
        documentType,
        file{ asset->{ url, originalFilename } },
        description
      }
    }`,
    { mlsNumber: listing.mls_number }
  );

  // Look up team member matching this listing's agent IDs
  const listingAgent = await getListingAgent(listing);

  const hasPhotos = listing.photos && listing.photos.length > 0;
  const schemas = generateRealEstateSchema(listing);

  // Custom-one template: only for properties listed by team members with matching MLS IDs
  const isCustomOne = template === 'custom-one' && listingAgent !== null;

  // Custom-one template: luxury single-property landing page
  if (isCustomOne) {
    // Resolve agent image URL server-side for the client component
    const agentImageUrl = listingAgent?.image
      ? urlFor(listingAgent.image).width(256).height(256).url()
      : null;

    return (
      <>
        {schemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <CustomOneListingContent
          listing={listing}
          agent={listingAgent ? {
            name: listingAgent.name,
            slug: listingAgent.slug,
            title: listingAgent.title,
            imageUrl: agentImageUrl,
            email: listingAgent.email,
            phone: listingAgent.phone,
            mobile: listingAgent.mobile,
          } : null}
          documents={propertyEnhancement?.documents}
        />
      </>
    );
  }

  // RC Sotheby's Custom template
  if (template === 'rcsothebys-custom') {
    const agentImageUrl = listingAgent?.image
      ? urlFor(listingAgent.image).width(256).height(320).url()
      : null;

    return (
      <>
        {schemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <RCSothebysListingContent
          listing={listing}
          agent={listingAgent ? {
            name: listingAgent.name,
            slug: listingAgent.slug,
            title: listingAgent.title,
            imageUrl: agentImageUrl,
            email: listingAgent.email,
            phone: listingAgent.phone,
            mobile: listingAgent.mobile,
          } : null}
        />
      </>
    );
  }

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

      <div className={`min-h-screen ${template === 'custom-one' ? '-mt-[80px] lg:-mt-[120px] pt-[80px] lg:pt-[120px] bg-[var(--modern-black)] relative overflow-hidden' : 'bg-[#f8f7f5]'}`} itemScope itemType="https://schema.org/RealEstateListing">
        {/* Gold texture background for custom-one */}
        {template === 'custom-one' && (
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
              }}
            />
          </div>
        )}

        {/* Hidden microformat data */}
        <meta itemProp="url" content={`${getBaseUrl()}/listings/${listing.id}`} />
        <meta itemProp="datePosted" content={listing.listing_date || ''} />

        {/* Back Link */}
        <div className={template === 'custom-one' ? 'relative z-10' : 'bg-[var(--color-sothebys-blue)]'}>
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${template === 'custom-one' ? 'max-w-[1400px] py-5' : 'max-w-7xl py-4'}`}>
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
        {template === 'custom-one' && !isCustomOne ? (
          <div className="max-w-[1400px] mx-auto pb-16">
            <PropertyGallery photos={listing.photos || []} address={listing.address ?? undefined} constrained />
          </div>
        ) : (
          <PropertyGallery photos={listing.photos || []} address={listing.address ?? undefined} />
        )}

        {/* Property Header Section */}
        <section className="bg-white border-b border-gray-100 relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className={`flex flex-col lg:flex-row lg:justify-between gap-6 ${template === 'custom-one' ? 'lg:items-stretch' : 'lg:items-start'}`}>
              {/* Left: Address and Status */}
              <div className={`flex-1 ${template === 'custom-one' ? 'lg:max-w-[calc(100%-400px)]' : ''}`}>
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
                  <h1 className={`font-serif font-light text-[#1a1a1a] ${template === 'custom-one' ? 'text-[3rem] leading-tight' : 'text-xl md:text-2xl'}`}>
                    <span itemProp="streetAddress" className="block">
                      {listing.address?.split(',')[0] || listing.address}
                    </span>
                    <span className={`block text-gray-500 mt-1 ${template === 'custom-one' ? 'text-xl' : 'text-lg md:text-xl'}`}>
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

                {/* Key Stats Bar - for custom-one template */}
                {template === 'custom-one' && (
                  <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-6 pt-6 border-t border-gray-100">
                    {listing.bedrooms !== null && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <div>
                          <span className="text-xl font-light text-[#1a1a1a]" itemProp="numberOfRooms">{listing.bedrooms}</span>
                          <span className="text-sm text-gray-500 ml-1">Bed</span>
                        </div>
                      </div>
                    )}
                    {listing.bathrooms !== null && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-sothebys-blue)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 2C8 1.44772 8.44772 1 9 1H10C10.5523 1 11 1.44772 11 2V4H13V2C13 1.44772 13.4477 1 14 1H15C15.5523 1 16 1.44772 16 2V4H17C17.5523 4 18 4.44772 18 5V8C18 8.55228 17.5523 9 17 9H7C6.44772 9 6 8.55228 6 8V5C6 4.44772 6.44772 4 7 4H8V2ZM7 11H17C17.5523 11 18 11.4477 18 12V14C18 14.5523 17.5523 15 17 15H16.9L16.5 20C16.4481 20.5447 15.9931 21 15.4444 21H8.55556C8.00693 21 7.55191 20.5447 7.5 20L7.1 15H7C6.44772 15 6 14.5523 6 14V12C6 11.4477 6.44772 11 7 11Z" />
                        </svg>
                        <div>
                          <span className="text-xl font-light text-[#1a1a1a]">{listing.bathrooms}</span>
                          <span className="text-sm text-gray-500 ml-1">Bath</span>
                        </div>
                      </div>
                    )}
                    {listing.square_feet && (
                      <div className="flex items-center gap-2" itemProp="floorSize" itemScope itemType="https://schema.org/QuantitativeValue">
                        <svg className="w-5 h-5 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <div>
                          <span className="text-xl font-light text-[#1a1a1a]" itemProp="value">{listing.square_feet.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 ml-1" itemProp="unitText">Sq Ft</span>
                        </div>
                      </div>
                    )}
                    {listing.lot_size && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <div>
                          <span className="text-xl font-light text-[#1a1a1a]">
                            {listing.lot_size >= 1 ? listing.lot_size.toFixed(2) : (listing.lot_size * 43560).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            {listing.lot_size >= 1 ? 'Acres' : 'Sq Ft Lot'}
                          </span>
                        </div>
                      </div>
                    )}
                    {listing.year_built && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-sothebys-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-xl font-light text-[#1a1a1a]" itemProp="yearBuilt">{listing.year_built}</span>
                          <span className="text-sm text-gray-500 ml-1">Built</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Property Details Inline - for custom-one template */}
                {template === 'custom-one' && (
                  <div className="mt-8 pt-8 border-t border-gray-100 space-y-8">
                    {/* Description */}
                    {listing.description && (
                      <div>
                        <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-4">About This Property</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{listing.description}</p>
                      </div>
                    )}

                    {/* Overview Grid */}
                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-4">Property Details</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                          <span className="text-gray-500 text-sm">MLS #</span>
                          <span className="font-medium text-gray-900">{listing.mls_number}</span>
                        </div>
                        {listing.property_type && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Type</span>
                            <span className="font-medium text-gray-900">{listing.property_type}</span>
                          </div>
                        )}
                        {listing.subdivision_name && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Subdivision</span>
                            <span className="font-medium text-gray-900">{listing.subdivision_name}</span>
                          </div>
                        )}
                        {listing.mls_area_minor && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Area</span>
                            <span className="font-medium text-gray-900">{listing.mls_area_minor}</span>
                          </div>
                        )}
                        {listing.listing_date && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Listed</span>
                            <span className="font-medium text-gray-900">{new Date(listing.listing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                        {listing.days_on_market !== null && listing.days_on_market !== undefined && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Days on Market</span>
                            <span className="font-medium text-gray-900">{listing.days_on_market}</span>
                          </div>
                        )}
                        {listing.furnished && (
                          <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Furnished</span>
                            <span className="font-medium text-gray-900">{listing.furnished}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features & Amenities */}
                    {(listing.fireplace_yn || listing.cooling?.length || listing.heating?.length || listing.laundry_features?.length || listing.attached_garage_yn !== null || listing.parking_features?.length || listing.association_amenities?.length) && (
                      <div>
                        <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-4">Features & Amenities</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                          {listing.fireplace_yn && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Fireplace</span>
                              <span className="font-medium text-gray-900">{listing.fireplace_total ? `${listing.fireplace_total}` : 'Yes'}</span>
                            </div>
                          )}
                          {listing.cooling && listing.cooling.length > 0 && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Cooling</span>
                              <span className="font-medium text-gray-900 text-right text-sm">{listing.cooling.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                          {listing.heating && listing.heating.length > 0 && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Heating</span>
                              <span className="font-medium text-gray-900 text-right text-sm">{listing.heating.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                          {listing.laundry_features && listing.laundry_features.length > 0 && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Laundry</span>
                              <span className="font-medium text-gray-900 text-right text-sm">{listing.laundry_features.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                          {listing.attached_garage_yn !== null && listing.attached_garage_yn !== undefined && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Attached Garage</span>
                              <span className="font-medium text-gray-900">{listing.attached_garage_yn ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {listing.parking_features && listing.parking_features.length > 0 && (
                            <div className="flex justify-between items-baseline py-2 border-b border-gray-100">
                              <span className="text-gray-500 text-sm">Parking</span>
                              <span className="font-medium text-gray-900 text-right text-sm">{listing.parking_features.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {listing.association_amenities && listing.association_amenities.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-500 text-sm block mb-2">Community Amenities</span>
                            <div className="flex flex-wrap gap-2">
                              {listing.association_amenities.map((amenity, index) => (
                                <span key={index} className="px-3 py-1.5 bg-[#f8f7f5] text-gray-700 text-xs rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: CTA */}
              <div className="flex items-start">
                {template === 'custom-one' ? (
                  <StickyRequestInfo>
                  <div className="bg-[var(--modern-black)] p-6 rounded-sm min-w-[320px] max-w-[380px] relative overflow-hidden">
                    {/* Gold textured background */}
                    <div className="absolute inset-0 opacity-5">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
                        }}
                      />
                    </div>
                    <div className="relative z-10">
                    <h3 className="font-serif text-xl font-light text-white mb-4">Request Information</h3>

                    {/* Agent Info */}
                    {listingAgent && (
                      <div className="mb-6 pb-6 border-b border-white/20">
                        <div className="flex items-center gap-4">
                          {listingAgent.image ? (
                            <Link href={`/team/${listingAgent.slug.current}`}>
                              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--modern-gold)]/30 flex-shrink-0">
                                <Image
                                  src={urlFor(listingAgent.image).width(112).height(112).url()}
                                  alt={listingAgent.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-7 h-7 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link href={`/team/${listingAgent.slug.current}`} className="text-white font-serif text-base hover:text-[var(--modern-gold)] transition-colors">
                              {listingAgent.name}
                            </Link>
                            {listingAgent.title && (
                              <p className="text-white/50 text-xs font-light mt-0.5">{listingAgent.title}</p>
                            )}
                            {listingAgent.phone && (
                              <a href={`tel:${listingAgent.phone}`} className="text-white/70 text-xs hover:text-white transition-colors block mt-1">
                                {listingAgent.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Form */}
                    <form className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="firstName"
                          placeholder="First Name"
                          required
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:border-[var(--modern-gold)] focus:outline-none transition-colors rounded-sm"
                        />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Last Name"
                          required
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:border-[var(--modern-gold)] focus:outline-none transition-colors rounded-sm"
                        />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        required
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:border-[var(--modern-gold)] focus:outline-none transition-colors rounded-sm"
                      />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:border-[var(--modern-gold)] focus:outline-none transition-colors rounded-sm"
                      />
                      <textarea
                        name="message"
                        rows={3}
                        placeholder={`I'm interested in ${listing.address?.split(',')[0] || 'this property'}...`}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:border-[var(--modern-gold)] focus:outline-none transition-colors rounded-sm resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full bg-[var(--modern-gold)] hover:bg-[var(--modern-gold)]/80 text-white font-medium tracking-wide uppercase py-2.5 transition-all duration-300 text-sm rounded-sm"
                      >
                        Send Inquiry
                      </button>
                    </form>
                    </div>
                  </div>
                  </StickyRequestInfo>
                ) : (
                  <ScheduleTourButton propertyAddress={listing.address || `Property ${listing.mls_number}`} />
                )}
              </div>
            </div>

            {/* Key Stats Bar - hidden for custom-one (shown in address column instead) */}
            {template !== 'custom-one' && (
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
                    <svg className="w-6 h-6 text-[var(--color-sothebys-blue)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 2C8 1.44772 8.44772 1 9 1H10C10.5523 1 11 1.44772 11 2V4H13V2C13 1.44772 13.4477 1 14 1H15C15.5523 1 16 1.44772 16 2V4H17C17.5523 4 18 4.44772 18 5V8C18 8.55228 17.5523 9 17 9H7C6.44772 9 6 8.55228 6 8V5C6 4.44772 6.44772 4 7 4H8V2ZM7 11H17C17.5523 11 18 11.4477 18 12V14C18 14.5523 17.5523 15 17 15H16.9L16.5 20C16.4481 20.5447 15.9931 21 15.4444 21H8.55556C8.00693 21 7.55191 20.5447 7.5 20L7.1 15H7C6.44772 15 6 14.5523 6 14V12C6 11.4477 6.44772 11 7 11Z" />
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
            )}
          </div>
        </section>

        {/* Main Content */}
        <div className="bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 ${template !== 'custom-one' ? 'lg:grid-cols-3' : ''} gap-8`}>
            {/* Main Content - Tabbed Section */}
            <div className={`${template !== 'custom-one' ? 'lg:col-span-2' : ''} space-y-8`}>
              {/* Tabbed Content - hidden for custom-one (shown in header section instead) */}
              {template !== 'custom-one' && (
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
              )}

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

              {/* Property Videos & Documents from Sanity */}
              {propertyEnhancement && (
                <PropertyMedia
                  videos={propertyEnhancement.videos}
                  documents={propertyEnhancement.documents}
                />
              )}

            </div>

            {/* Sidebar - hidden on custom-one template */}
            {template !== 'custom-one' && (
            <aside className="space-y-6">
                {/* Request Info CTA */}
                <div className="bg-[var(--color-sothebys-blue)] p-6 rounded-sm">
                  <h3 className="font-serif text-xl font-light text-white mb-2">Request Information</h3>
                  <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    Have questions about this property? We&apos;re here to help.
                  </p>

                  {/* Agent Info */}
                  {listingAgent && (
                    <div className="mb-6 pb-6 border-b border-white/20">
                      <div className="flex items-center gap-4">
                        {listingAgent.image ? (
                          <Link href={`/team/${listingAgent.slug.current}`}>
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--color-gold)]/30 flex-shrink-0">
                              <Image
                                src={urlFor(listingAgent.image).width(128).height(128).url()}
                                alt={listingAgent.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/team/${listingAgent.slug.current}`} className="text-white font-serif text-base hover:text-[var(--color-gold)] transition-colors">
                            {listingAgent.name}
                          </Link>
                          {listingAgent.title && (
                            <p className="text-white/50 text-xs font-light mt-0.5">{listingAgent.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {listingAgent.email && (
                          <a href={`mailto:${listingAgent.email}`} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-light transition-colors">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {listingAgent.email}
                          </a>
                        )}
                        {listingAgent.phone && (
                          <a href={`tel:${listingAgent.phone}`} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-light transition-colors">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {listingAgent.phone}
                          </a>
                        )}
                        {listingAgent.mobile && listingAgent.mobile !== listingAgent.phone && (
                          <a href={`tel:${listingAgent.mobile}`} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-light transition-colors">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {listingAgent.mobile}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

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
            )}
          </div>
        </div>
        </div>

        {/* Full Width Map Section */}
        {listing.latitude && listing.longitude && (
          <section className={`relative z-10 overflow-hidden ${template === 'custom-one' ? 'bg-[var(--modern-black)] py-16 md:py-24' : 'bg-white border-t border-gray-100'}`}>
            {/* Gold texture background for custom-one */}
            {template === 'custom-one' && (
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
                  }}
                />
              </div>
            )}
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${template === 'custom-one' ? 'max-w-[1400px]' : 'max-w-7xl pt-6 pb-4'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-sm font-medium uppercase tracking-[0.15em] ${template === 'custom-one' ? 'text-[var(--modern-gold)]' : 'text-[var(--color-sothebys-blue)]'}`}>
                  Location
                </h2>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm hover:underline flex items-center gap-1 ${template === 'custom-one' ? 'text-[var(--modern-gold)]' : 'text-[var(--color-sothebys-blue)]'}`}
                >
                  Get Directions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <div className={`h-[600px] ${template === 'custom-one' ? 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8' : 'w-full'}`}>
              <PropertyMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                address={listing.address || undefined}
                price={listing.list_price}
              />
            </div>
          </section>
        )}

        {/* Contact Form Section */}
        <section className={`py-16 md:py-24 relative z-10 ${template === 'custom-one' ? 'bg-white' : 'bg-[var(--color-sothebys-blue)]'}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className={`text-2xl md:text-3xl lg:text-4xl font-serif font-light mb-4 ${template === 'custom-one' ? 'text-[var(--modern-black)]' : 'text-white'}`}>
                Learn More About {listing.address?.split(',')[0] || listing.address}
              </h2>
              <p className={`font-light ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/70'}`}>
                Fill out the form below and we'll be in touch shortly.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className={`block text-sm mb-2 uppercase tracking-wider ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${template === 'custom-one' ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={`block text-sm mb-2 uppercase tracking-wider ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${template === 'custom-one' ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className={`block text-sm mb-2 uppercase tracking-wider ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${template === 'custom-one' ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={`block text-sm mb-2 uppercase tracking-wider ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`w-full px-4 py-3 border focus:outline-none transition-colors ${template === 'custom-one' ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className={`block text-sm mb-2 uppercase tracking-wider ${template === 'custom-one' ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className={`w-full px-4 py-3 border focus:outline-none transition-colors resize-none ${template === 'custom-one' ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
                  placeholder={`I'm interested in learning more about ${listing.address?.split(',')[0] || listing.address}...`}
                />
              </div>

              <div className="text-center pt-4">
                <button
                  type="submit"
                  className={`inline-flex items-center gap-3 px-12 py-4 border transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light ${template === 'custom-one' ? 'bg-[var(--modern-gold)] border-[var(--modern-gold)] text-white hover:bg-[#c99158] hover:border-[#c99158]' : 'bg-transparent border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)]'}`}
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
