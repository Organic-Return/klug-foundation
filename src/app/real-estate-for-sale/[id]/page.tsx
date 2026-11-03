import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getListingBySlug,
  getListingHref,
  buildListingSlug,
  formatPrice,
  getRelatedListings,
  isOffMarketStatus,
  isSoldStatus,
  findNewerDuplicateListing,
  type MLSProperty,
} from '@/lib/listings';
import { getSettings, getGoogleMapsApiKey, getSiteName, getTeamSyncConfig } from '@/lib/settings';
import SchemaGraph from '@/components/SchemaGraph';
import {
  getTenant,
  ids,
  listingNodes,
  webPageNode,
  breadcrumbNode,
  truncate,
  type Tenant,
  type VideoInput,
} from '@/lib/schema';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import CustomOneListingContent from '@/components/CustomOneListingContent';
import KlugListingContent from '@/components/KlugListingContent';
import RelatedListings from '@/components/RelatedListings';
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
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

async function getListingAgents(listing: MLSProperty): Promise<ListingAgent[]> {
  const ids = [
    listing.list_agent_mls_id,
    listing.co_list_agent_mls_id,
    listing.buyer_agent_mls_id,
    listing.co_buyer_agent_mls_id,
  ].filter(Boolean);

  if (ids.length === 0) return [];

  let agents = await client.fetch<(ListingAgent & { _id: string; mlsAgentId?: string; mlsAgentIdSold?: string })[]>(
    `*[_type == "teamMember" && inactive != true && (mlsAgentId in $ids || mlsAgentIdSold in $ids)]{
      _id,
      name,
      slug,
      title,
      image,
      email,
      phone,
      mobile,
      mlsAgentId,
      mlsAgentIdSold
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
  /**
   * When true (default), if the visitor's URL slug doesn't match the
   * canonical address-based slug, 301-redirect to the canonical one.
   * The /affiliated-partners/.../listings/[slug] wrapper re-uses this
   * page component but should NOT redirect away from its namespaced
   * URL — partner listing pages live at their own paths.
   */
  canonicalize?: boolean;
}

// Helper to get the base URL (sync version for non-async contexts)
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

interface EnhancementVideo {
  title: string;
  videoType: 'mux' | 'youtube' | 'vimeo' | 'url';
  muxPlaybackId?: string;
  youtubeId?: string;
  vimeoId?: string;
  externalUrl?: string;
  thumbnail?: { asset: { url: string } };
  description?: string;
}

/**
 * The listing's first video as a VideoObject input. Mux uploads are the
 * preferred source; YouTube/Vimeo embeds and plain URLs are described too.
 * `uploadDate` is the enhancement document's creation time.
 */
function enhancementVideo(
  listingUrl: string,
  enhancement: { _createdAt?: string; videos?: EnhancementVideo[] } | null
): VideoInput | null {
  const video = enhancement?.videos?.[0];
  if (!video) return null;
  const custom = video.thumbnail?.asset?.url;
  const base = { url: listingUrl, name: video.title, description: video.description, uploadDate: enhancement?._createdAt };
  if (video.videoType === 'mux' && video.muxPlaybackId) {
    return {
      ...base,
      thumbnailUrl: custom || `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg`,
      contentUrl: `https://stream.mux.com/${video.muxPlaybackId}.m3u8`,
    };
  }
  if (video.videoType === 'youtube' && video.youtubeId) {
    return {
      ...base,
      thumbnailUrl: custom || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
    };
  }
  if (video.videoType === 'vimeo' && video.vimeoId) {
    return { ...base, thumbnailUrl: custom, embedUrl: `https://player.vimeo.com/video/${video.vimeoId}` };
  }
  if (video.externalUrl) {
    return { ...base, thumbnailUrl: custom, contentUrl: video.externalUrl };
  }
  return null;
}

/**
 * Structured data for the listing page: its WebPage and breadcrumb, the
 * RealEstateListing with its offer, the home it offers, and a VideoObject
 * when the listing has one. `isOwn` marks the tenant's own listings, whose
 * offer names the business as seller.
 */
function listingSchemaNodes(opts: { listing: MLSProperty; tenant: Tenant; isOwn: boolean; video: VideoInput | null }) {
  const { listing, tenant, isOwn, video } = opts;
  const listingUrl = `${tenant.baseUrl}${getListingHref(listing)}`;
  const name = listing.address || `Property ${listing.mls_number}`;
  const description =
    truncate(listing.description) || `${listing.property_type || 'Property'} in ${listing.city}, ${listing.state}`;
  const parent = listing.is_realogy
    ? { name: 'Market Leaders', url: `${tenant.baseUrl}/affiliated-partners/market-leaders` }
    : { name: 'Listings', url: `${tenant.baseUrl}/real-estate-for-sale` };

  return [
    webPageNode({
      tenant,
      url: listingUrl,
      name,
      description,
      type: 'ItemPage',
      image: listing.photos?.[0],
      hasBreadcrumb: true,
      mainEntityId: ids.mainEntity(listingUrl),
      dateModified: listing.updated_at,
    }),
    breadcrumbNode(listingUrl, [{ name: 'Home', url: `${tenant.baseUrl}/` }, parent, { name, url: listingUrl }]),
    ...listingNodes({
      url: listingUrl,
      name,
      description,
      mlsNumber: listing.mls_number,
      photos: listing.photos,
      address: { street: listing.address, city: listing.city, state: listing.state, postalCode: listing.zip_code },
      geo: { lat: listing.latitude, lng: listing.longitude },
      propertyType: listing.property_type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFeet: listing.square_feet,
      lotSizeAcres: listing.lot_size,
      yearBuilt: listing.year_built,
      listPrice: listing.list_price,
      status: listing.status,
      listingDate: listing.listing_date,
      soldDate: listing.sold_date,
      sellerId: isOwn ? ids.organization(tenant.baseUrl) : undefined,
      video,
    }),
  ];
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingBySlug(id);

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  // Off-market (expired/withdrawn/canceled) listings 404 in the page below;
  // keep them out of search indexes too.
  if (isOffMarketStatus(listing.status)) {
    return { title: 'Listing Not Found', robots: { index: false, follow: false } };
  }

  const baseUrl = getBaseUrl();
  const siteName = await getSiteName();
  const listingUrl = `${baseUrl}${getListingHref(listing)}`;
  // A listing without a street address (lots, some land and commercial
  // records) would otherwise be labelled "Property" like every other
  // address-less listing. Describe what it actually is instead.
  const addressLabel =
    listing.address?.trim() ||
    [
      `${listing.property_type || 'Property'} for Sale`,
      listing.mls_number ? `MLS ${listing.mls_number}` : null,
    ]
      .filter(Boolean)
      .join(' — ');
  // The address already names the city; repeating it pushed every title past
  // 70 characters and Google truncated the price.
  const title = `${addressLabel} | ${formatPrice(listing.list_price)}`;
  // Lead with the facts that differ between units before the MLS remarks:
  // every unit in a building shares the same remarks, so remarks-only
  // descriptions were identical across dozens of pages.
  const facts = [
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    listing.square_feet ? `${listing.square_feet.toLocaleString()} sq ft` : null,
  ].filter(Boolean).join(', ');
  const lead = `${addressLabel}: ${[facts, listing.property_type].filter(Boolean).join(' ')}${isSoldStatus(listing.status) ? ' sold for ' : ' listed at '}${formatPrice(listing.list_price)}.`;
  const remarks = (listing.description || '').replace(/\s+/g, ' ').trim();
  const fullDescription = remarks ? `${lead} ${remarks}` : `${lead} MLS# ${listing.mls_number}.`;
  const description = fullDescription.length > 300 ? fullDescription.slice(0, 297).replace(/\s+\S*$/, '') + '...' : fullDescription;
  // A property the feed lists twice canonicalises to its newer record.
  const newer = await findNewerDuplicateListing(listing);
  const canonicalUrl = newer ? `${baseUrl}${getListingHref(newer)}` : listingUrl;
  const images = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const primaryImage = images[0] || `${baseUrl}/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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
      title: `${addressLabel} - ${formatPrice(listing.list_price)}`,
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

export default async function ListingPage({ params, canonicalize = true }: ListingPageProps) {
  const { id } = await params;

  const [fetchedListing, settings, googleMapsApiKey] = await Promise.all([
    getListingBySlug(id),
    getSettings(),
    getGoogleMapsApiKey(),
  ]);

  if (!fetchedListing) {
    notFound();
  }

  // Tours and videos on closed listings are usually taken down by whoever
  // hosted them, so a sold page would frame an error. Closed listings show
  // neither, whoever listed them.
  const showMedia = !isSoldStatus(fetchedListing.status);
  const listing: MLSProperty = showMedia
    ? fetchedListing
    : { ...fetchedListing, virtual_tour_url: null, video_urls: [] };

  // Off-market listings (expired, withdrawn, canceled) are no longer for sale
  // and were pulled from the MLS — they should not be browsable. 404 them.
  // Sold/Closed listings are intentionally kept (the sold gallery links to them).
  if (isOffMarketStatus(listing.status)) {
    notFound();
  }

  // Fetch 6 related listings (same city, active) for the bottom cross-link
  // section. Wrap in try/catch so a Supabase hiccup can't take down the
  // page — empty array just hides the section.
  let related: MLSProperty[] = [];
  try {
    related = await getRelatedListings(
      { mls_number: listing.mls_number, city: listing.city, state: listing.state },
      6
    );
  } catch (err) {
    console.error('related listings fetch failed:', err);
  }

  // Canonicalize the URL: if the visitor arrived at a legacy
  // bare-MLS-number / id slug, 301 them to the address-based slug.
  // Keeps Google's link equity consolidated on the keyword-rich URL
  // and avoids duplicate-content treatment. Disabled when invoked
  // via the partner-listing wrapper, whose URLs live at their own
  // namespace (/affiliated-partners/.../listings/<slug>).
  if (canonicalize) {
    const canonicalSlug = buildListingSlug(listing);
    if (canonicalSlug && id !== canonicalSlug) {
      permanentRedirect(`/real-estate-for-sale/${canonicalSlug}`);
    }
  }


  const template = settings?.template || 'classic';

  // Fetch property enhancements (videos/documents) from Sanity
  const propertyEnhancement = await client.fetch<{
    _createdAt?: string;
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
      _createdAt,
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

  // The listing is the tenant's own when a team member is the listing or
  // co-listing agent, or the listing office is one of the tenant's offices.
  const tenant = await getTenant();
  const teamSync = await getTeamSyncConfig();
  const listSideIds = new Set([listing.list_agent_mls_id, listing.co_list_agent_mls_id].filter(Boolean));
  const ownByAgent = listingAgents.some(
    (agent) => (agent.mlsAgentId && listSideIds.has(agent.mlsAgentId)) || (agent.mlsAgentIdSold && listSideIds.has(agent.mlsAgentIdSold))
  );
  const officeName = (listing.list_office_name || '').toLowerCase();
  const ownByOffice = !!officeName && teamSync.offices.some((o) => o.officeName && officeName.includes(o.officeName.toLowerCase()));
  const schemaNodes = listingSchemaNodes({
    listing,
    tenant,
    isOwn: ownByAgent || ownByOffice,
    video: showMedia ? enhancementVideo(`${tenant.baseUrl}${getListingHref(listing)}`, propertyEnhancement) : null,
  });

  // Klug exclusive: listed by a Klug team member — use the exclusive listing template
  if (listingAgent !== null) {
    const agentImageUrl = listingAgent.image
      ? urlFor(listingAgent.image).width(400).height(500).fit('crop').crop('top').url()
      : null;

    return (
      <>
        <SchemaGraph nodes={schemaNodes} />
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
          videos={showMedia ? propertyEnhancement?.videos : undefined}
          googleMapsApiKey={googleMapsApiKey}
        />
        <RelatedListings listings={related} city={listing.city} />
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
    try {
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
    } catch (err) {
      // A miss on the partner roster shouldn't take down the listing
      // page — fall through to the default-agent branch.
      console.error('partner lookup failed:', err);
    }
  }

  // Partner-listed properties: use the same exclusive template as Klug listings
  if (partnerAgent) {
    return (
      <>
        <SchemaGraph nodes={schemaNodes} />
        <CustomOneListingContent
          listing={listing}
          agent={partnerAgent}
          documents={propertyEnhancement?.documents}
          videos={showMedia ? propertyEnhancement?.videos : undefined}
          googleMapsApiKey={googleMapsApiKey}
        />
        <RelatedListings listings={related} city={listing.city} />
      </>
    );
  }

  // Fallback: no agent match — surface Chris Klug as the brokerage contact
  // on the non-exclusive sidebar, matching what the exclusive template does.
  // Defensive: a Sanity hiccup here used to bubble up and 500 the entire
  // listing page even though the listing itself rendered fine.
  let defaultTeamMember: ListingAgent | null = null;
  try {
    defaultTeamMember = await client.fetch<ListingAgent | null>(
      `*[_type == "teamMember" && slug.current == "chris-klug" && inactive != true][0]{
        name, slug, title, image, email, phone, mobile
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.error('default agent fetch failed:', err);
  }

  let defaultAgent: {
    name: string;
    slug: { current: string };
    title?: string;
    imageUrl?: string | null;
    email?: string;
    phone?: string;
    mobile?: string;
  } | null = null;
  if (defaultTeamMember) {
    try {
      defaultAgent = {
        name: defaultTeamMember.name,
        slug: defaultTeamMember.slug,
        title: defaultTeamMember.title?.replace(/\bResidential\b/g, 'Real Estate Broker'),
        imageUrl: defaultTeamMember.image
          ? urlFor(defaultTeamMember.image).width(400).height(500).fit('crop').crop('top').url()
          : null,
        email: defaultTeamMember.email,
        phone: defaultTeamMember.phone,
        mobile: defaultTeamMember.mobile,
      };
    } catch (err) {
      console.error('default agent build failed:', err);
    }
  }

  return (
    <>
      <SchemaGraph nodes={schemaNodes} />
      <KlugListingContent
        listing={listing}
        agent={null}
        coAgent={null}
        defaultAgent={defaultAgent}
        googleMapsApiKey={googleMapsApiKey}
      />
      <RelatedListings listings={related} city={listing.city} />
    </>
  );
}
