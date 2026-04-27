import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getListingBySlug,
  getListingHref,
  formatPrice,
  type MLSProperty,
} from '@/lib/listings';
import { getSettings, getGoogleMapsApiKey, getSiteName } from '@/lib/settings';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import CustomOneListingContent from '@/components/CustomOneListingContent';
import KlugListingContent from '@/components/KlugListingContent';
import { findPartnerByAgentName, enrichPartnerWithAgentData, getPartnerUrl } from '@/app/affiliated-partners/components';

export const revalidate = 60;

const builder = createImageUrlBuilder(client);
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

async function getListingAgents(listing: MLSProperty): Promise<ListingAgent[]> {
  const ids = [
    listing.list_agent_mls_id,
    listing.co_list_agent_mls_id,
    listing.buyer_agent_mls_id,
    listing.co_buyer_agent_mls_id,
  ].filter(Boolean);

  if (ids.length === 0) return [];

  let agents = await client.fetch<(ListingAgent & { _id: string; mlsAgentId?: string })[]>(
    `*[_type == "teamMember" && inactive != true && (mlsAgentId in $ids || mlsAgentIdSold in $ids)]{
      _id,
      name,
      slug,
      title,
      image,
      email,
      phone,
      mobile,
      mlsAgentId
    }`,
    { ids },
    { next: { revalidate: 60 } }
  );

  if (agents.length === 0) return [];

  // Sort: listing agent first, co-listing agent second, others after
  const listAgentId = listing.list_agent_mls_id;
  agents.sort((a, b) => {
    if (a.mlsAgentId === listAgentId) return -1;
    if (b.mlsAgentId === listAgentId) return 1;
    return 0;
  });

  return agents;
}

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

// Helper to get the base URL (sync version for non-async contexts)
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

// Generate Schema.org RealEstateListing structured data
function generateRealEstateSchema(listing: MLSProperty) {
  const baseUrl = getBaseUrl();
  const listingUrl = `${baseUrl}${getListingHref(listing)}`;

  const realEstateSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': listingUrl,
    url: listingUrl,
    name: listing.address || `Property ${listing.mls_number}`,
    description: listing.description || `${listing.property_type || 'Property'} in ${listing.city}, ${listing.state}`,
    datePosted: listing.listing_date,
    ...(listing.sold_date && { dateModified: listing.sold_date }),
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
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
      primaryImageOfPage: listing.photos[0],
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip_code,
      addressCountry: 'US',
    },
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),
    identifier: {
      '@type': 'PropertyValue',
      name: 'MLS Number',
      value: listing.mls_number,
    },
  };

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
    ...(listing.bedrooms !== null && { numberOfRooms: listing.bedrooms }),
    ...(listing.bathrooms !== null && { numberOfBathroomsTotal: listing.bathrooms }),
    ...(listing.square_feet && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: listing.square_feet,
        unitCode: 'FTK',
      },
    }),
    ...(listing.lot_size && {
      lotSize: {
        '@type': 'QuantitativeValue',
        value: listing.lot_size,
        unitCode: 'ACR',
      },
    }),
    ...(listing.year_built && { yearBuilt: listing.year_built }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip_code,
      addressCountry: 'US',
    },
    ...(listing.latitude && listing.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
    }),
    ...(listing.photos && listing.photos.length > 0 && {
      image: listing.photos,
    }),
  };

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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Listings', item: `${baseUrl}/listings` },
      { '@type': 'ListItem', position: 3, name: listing.address || listing.mls_number, item: listingUrl },
    ],
  };

  return [realEstateSchema, propertySchema, productSchema, breadcrumbSchema];
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingBySlug(id);

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  const baseUrl = getBaseUrl();
  const siteName = await getSiteName();
  const listingUrl = `${baseUrl}${getListingHref(listing)}`;
  const title = `${listing.address || 'Property'} | ${formatPrice(listing.list_price)} | ${listing.city}, ${listing.state}`;
  const rawDescription = listing.description
    || `${listing.bedrooms || 0} bed, ${listing.bathrooms || 0} bath ${listing.property_type || 'property'} for ${listing.status === 'Closed' ? 'sale (sold)' : 'sale'} in ${listing.city}, ${listing.state}. ${listing.square_feet ? `${listing.square_feet.toLocaleString()} sq ft.` : ''} MLS# ${listing.mls_number}`;
  const description = rawDescription.length > 300 ? rawDescription.slice(0, 297) + '...' : rawDescription;
  const images = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const primaryImage = images[0] || `${baseUrl}/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: listingUrl },
    keywords: [
      listing.city, listing.state, listing.property_type,
      'real estate', 'property', 'home for sale',
      listing.neighborhood,
      `${listing.bedrooms} bedroom`, `${listing.bathrooms} bathroom`,
    ].filter(Boolean) as string[],
    openGraph: {
      type: 'website',
      url: listingUrl,
      title,
      description,
      siteName,
      locale: 'en_US',
      images: images.length > 0
        ? images.slice(0, 4).map((img, index) => ({
            url: img, width: 1200, height: 630,
            alt: index === 0 ? `${listing.address} - Main Photo` : `${listing.address} - Photo ${index + 1}`,
          }))
        : [{ url: primaryImage, width: 1200, height: 630, alt: listing.address || 'Property Photo' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.address || 'Property'} - ${formatPrice(listing.list_price)}`,
      description: `${listing.bedrooms || 0} bd | ${listing.bathrooms || 0} ba | ${listing.square_feet?.toLocaleString() || 'N/A'} sqft in ${listing.city}, ${listing.state}`,
      images: [primaryImage],
    },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    other: {
      'og:price:amount': listing.list_price?.toString() || '',
      'og:price:currency': 'USD',
      'product:price:amount': listing.list_price?.toString() || '',
      'product:price:currency': 'USD',
      'product:availability': listing.status === 'Active' ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:category': listing.property_type || 'Real Estate',
      'property:bedrooms': listing.bedrooms?.toString() || '',
      'property:bathrooms': listing.bathrooms?.toString() || '',
      'property:sqft': listing.square_feet?.toString() || '',
      'property:type': listing.property_type || '',
      'property:mls': listing.mls_number,
      'property:status': listing.status,
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

  const [listing, settings, googleMapsApiKey] = await Promise.all([
    getListingBySlug(id),
    getSettings(),
    getGoogleMapsApiKey(),
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

  // Look up team members matching this listing's agent IDs
  const listingAgents = await getListingAgents(listing);
  const listingAgent = listingAgents[0] || null;
  const coListingAgent = listingAgents[1] || null;

  // Normalize synced title: "Residential" -> "Real Estate Broker"
  if (listingAgent?.title) listingAgent.title = listingAgent.title.replace(/\bResidential\b/g, 'Real Estate Broker');
  if (coListingAgent?.title) coListingAgent.title = coListingAgent.title.replace(/\bResidential\b/g, 'Real Estate Broker');

  const schemas = generateRealEstateSchema(listing);

  // Klug exclusive: listed by a Klug team member — use the exclusive listing template
  if (listingAgent !== null) {
    const agentImageUrl = listingAgent.image
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
          agent={{
            name: listingAgent.name,
            slug: listingAgent.slug,
            title: listingAgent.title,
            imageUrl: agentImageUrl,
            email: listingAgent.email,
            phone: listingAgent.phone,
            mobile: listingAgent.mobile,
          }}
          documents={propertyEnhancement?.documents}
          videos={propertyEnhancement?.videos}
        />
      </>
    );
  }

  // Non-exclusive listings: try to find the listing agent in our affiliatedPartner
  // Sanity records (e.g. Dusty Baker) so we can show their photo + contact info.
  let partnerAgent: {
    name: string;
    slug: { current: string };
    title?: string;
    imageUrl?: string | null;
    email?: string;
    phone?: string;
    mobile?: string;
  } | null = null;

  if (listing.agent_name) {
    const partner = await findPartnerByAgentName(listing.agent_name);
    if (partner) {
      const enriched = await enrichPartnerWithAgentData(partner);
      const partnerUrl = getPartnerUrl(enriched);
      const partnerSlug = partnerUrl.split('/').pop() || 'partner';
      partnerAgent = {
        name: `${enriched.firstName} ${enriched.lastName}`.trim(),
        slug: { current: partnerSlug },
        title: enriched.title,
        imageUrl: enriched.photoUrl,
        email: enriched.email,
        phone: enriched.phone,
      };
    }
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <KlugListingContent
        listing={listing}
        agent={partnerAgent}
        coAgent={null}
        googleMapsApiKey={googleMapsApiKey}
      />
    </>
  );
}
