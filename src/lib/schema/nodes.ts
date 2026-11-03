/**
 * Typed builders for the schema.org nodes the site emits. Each returns a plain
 * node (or undefined when it has nothing to say). Pages compose the nodes they
 * need and hand them to `buildGraph`, which removes empty properties, so the
 * builders pass values through without guarding every one.
 *
 * Nothing in here knows about a particular tenant: names, addresses, URLs and
 * images all come in through the Tenant object or the builder's input.
 */
import { ids, ref, type Ref } from './ids';
import type { JsonLdNode } from './graph';
import type { Tenant, TenantAgent, TenantCredential } from './tenant';

const schemaUrl = (name: string) => `https://schema.org/${name}`;

export interface ImageInput {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

export function imageObject(image?: ImageInput | string | null): JsonLdNode | undefined {
  if (!image) return undefined;
  const input = typeof image === 'string' ? { url: image } : image;
  if (!input.url) return undefined;
  return { '@type': 'ImageObject', url: input.url, width: input.width, height: input.height, caption: input.caption };
}

export interface PostalAddressInput {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export function postalAddress(address?: PostalAddressInput | null): JsonLdNode | undefined {
  if (!address) return undefined;
  if (!address.street && !address.city && !address.postalCode) return undefined;
  return {
    '@type': 'PostalAddress',
    streetAddress: address.street,
    addressLocality: address.city,
    addressRegion: address.state,
    postalCode: address.postalCode,
    addressCountry: address.country || 'US',
  };
}

export function geoCoordinates(geo?: { lat?: number | null; lng?: number | null } | null): JsonLdNode | undefined {
  if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') return undefined;
  return { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng };
}

/** "Aspen, CO" → City node; anything else → Place. */
export function placeByName(name: string): JsonLdNode {
  return { '@type': /,\s*[A-Z]{2}$/.test(name) ? 'City' : 'Place', name };
}

// ---------------------------------------------------------------------------
// Sitewide entities
// ---------------------------------------------------------------------------

export function organizationNode(tenant: Tenant): JsonLdNode {
  return {
    '@type': 'RealEstateAgent',
    '@id': ids.organization(tenant.baseUrl),
    name: tenant.name,
    description: tenant.description,
    url: `${tenant.baseUrl}/`,
    logo: imageObject(tenant.logoUrl),
    image: imageObject(tenant.imageUrl || tenant.logoUrl),
    telephone: tenant.phone,
    email: tenant.email,
    address: postalAddress(tenant.address),
    geo: geoCoordinates(tenant.geo),
    areaServed: tenant.areaServed.map(placeByName),
    priceRange: tenant.priceRange,
    sameAs: tenant.sameAs,
    parentOrganization: tenant.brokerage?.name
      ? { '@type': 'Organization', name: tenant.brokerage.name, url: tenant.brokerage.url }
      : undefined,
    founder: tenant.agent ? ref(ids.agent(tenant.baseUrl)) : undefined,
    employee: tenant.agent ? ref(ids.agent(tenant.baseUrl)) : undefined,
  };
}

function credentialProperties(credentials: TenantCredential[] | undefined) {
  if (!credentials || credentials.length === 0) return {};
  const memberships = credentials.filter((c) => c.type === 'membership');
  const awards = credentials.filter((c) => c.type === 'award');
  const licenses = credentials.filter((c) => c.type === 'license');
  return {
    memberOf: memberships.map((c) => ({
      '@type': 'ProgramMembership',
      name: c.name,
      programName: c.name,
      url: c.url,
      hostingOrganization: c.issuer ? { '@type': 'Organization', name: c.issuer } : undefined,
    })),
    award: awards.map((c) => (c.year ? `${c.name} (${c.year})` : c.name)),
    hasCredential: licenses.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: c.name,
      url: c.url,
      recognizedBy: c.issuer ? { '@type': 'Organization', name: c.issuer } : undefined,
    })),
  };
}

export interface PersonInput {
  id: string;
  url?: string;
  name: string;
  jobTitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  telephone?: string | null;
  email?: string | null;
  sameAs?: Array<string | null | undefined>;
  knowsAbout?: string[];
  credentials?: TenantCredential[];
  worksForId?: string;
  worksForName?: string;
  address?: PostalAddressInput | null;
}

export function personNode(input: PersonInput): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': input.id,
    name: input.name,
    url: input.url,
    jobTitle: input.jobTitle,
    description: input.description,
    image: imageObject(input.imageUrl),
    telephone: input.telephone,
    email: input.email,
    address: postalAddress(input.address),
    worksFor: input.worksForId ? ref(input.worksForId) : input.worksForName ? { '@type': 'Organization', name: input.worksForName } : undefined,
    knowsAbout: input.knowsAbout,
    sameAs: (input.sameAs || []).filter((s): s is string => !!s),
    ...credentialProperties(input.credentials),
  };
}

/** The tenant's primary agent, addressed as #agent on every page. */
export function agentNode(tenant: Tenant): JsonLdNode | undefined {
  const agent: TenantAgent | null = tenant.agent;
  if (!agent) return undefined;
  return personNode({
    id: ids.agent(tenant.baseUrl),
    url: agent.url,
    name: agent.name,
    jobTitle: agent.jobTitle,
    description: agent.bio,
    imageUrl: agent.imageUrl,
    telephone: agent.phone,
    email: agent.email,
    sameAs: agent.sameAs,
    knowsAbout: agent.knowsAbout,
    credentials: agent.credentials,
    worksForId: ids.organization(tenant.baseUrl),
  });
}

export function websiteNode(tenant: Tenant): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': ids.website(tenant.baseUrl),
    name: tenant.siteTitle,
    url: `${tenant.baseUrl}/`,
    description: tenant.description,
    inLanguage: 'en-US',
    publisher: ref(ids.organization(tenant.baseUrl)),
    potentialAction: tenant.searchPath
      ? {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${tenant.baseUrl}${tenant.searchPath}?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };
}

/** Every page's sitewide nodes. Emitted by the root layout. */
export function siteNodes(tenant: Tenant): JsonLdNode[] {
  return [organizationNode(tenant), agentNode(tenant), websiteNode(tenant)].filter((n): n is JsonLdNode => !!n);
}

// ---------------------------------------------------------------------------
// Page-level nodes
// ---------------------------------------------------------------------------

export type WebPageType =
  | 'WebPage'
  | 'CollectionPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'ProfilePage'
  | 'ItemPage'
  | 'FAQPage';

export interface WebPageInput {
  /** The tenant, or at least its base URL, for the isPartOf → website link. */
  tenant?: Pick<Tenant, 'baseUrl'>;
  baseUrl?: string;
  url: string;
  name: string;
  description?: string | null;
  type?: WebPageType;
  image?: ImageInput | string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  /** Set when the page has a breadcrumb node (every page except home). */
  hasBreadcrumb?: boolean;
  mainEntityId?: string;
  aboutId?: string;
}

export function webPageNode(input: WebPageInput): JsonLdNode {
  const baseUrl = input.tenant?.baseUrl || input.baseUrl || new URL(input.url).origin;
  return {
    '@type': input.type || 'WebPage',
    '@id': ids.webpage(input.url),
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: 'en-US',
    isPartOf: ref(ids.website(baseUrl)),
    breadcrumb: input.hasBreadcrumb ? ref(ids.breadcrumb(input.url)) : undefined,
    primaryImageOfPage: imageObject(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    mainEntity: input.mainEntityId ? ref(input.mainEntityId) : undefined,
    about: input.aboutId ? ref(input.aboutId) : undefined,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbNode(pageUrl: string, items: BreadcrumbItem[]): JsonLdNode | undefined {
  const crumbs = items.filter((item) => item.name && item.url);
  if (crumbs.length === 0) return undefined;
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(pageUrl),
    itemListElement: crumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FaqInput {
  question: string;
  answer: string;
}

/** Only call this with questions that are rendered on the page, word for word. */
export function faqNode(pageUrl: string, faqs: FaqInput[]): JsonLdNode | undefined {
  const items = faqs.filter((f) => f.question?.trim() && f.answer?.trim());
  if (items.length === 0) return undefined;
  return {
    '@type': 'FAQPage',
    '@id': ids.faq(pageUrl),
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: f.answer.trim() },
    })),
  };
}

export interface ArticleInput {
  type?: 'Article' | 'BlogPosting' | 'NewsArticle';
  url: string;
  headline: string;
  description?: string | null;
  image?: ImageInput | string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  /** @id of the author Person, or a plain name. */
  authorId?: string;
  authorName?: string;
  /** @id of the publisher, or an outlet name for press coverage. */
  publisherId?: string;
  publisherName?: string;
  publisherLogoUrl?: string | null;
  articleSection?: string | null;
  keywords?: string[];
  /** The original article when this page summarises coverage elsewhere. */
  isBasedOn?: string | null;
  wordCount?: number;
}

export function articleNode(input: ArticleInput): JsonLdNode {
  return {
    '@type': input.type || 'Article',
    '@id': ids.mainEntity(input.url),
    url: input.url,
    headline: input.headline,
    description: input.description,
    image: imageObject(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: input.authorId ? ref(input.authorId) : input.authorName ? { '@type': 'Person', name: input.authorName } : undefined,
    publisher: input.publisherId
      ? ref(input.publisherId)
      : input.publisherName
        ? { '@type': 'Organization', name: input.publisherName, logo: imageObject(input.publisherLogoUrl) }
        : undefined,
    mainEntityOfPage: ref(ids.webpage(input.url)),
    articleSection: input.articleSection,
    keywords: input.keywords,
    isBasedOn: input.isBasedOn,
    sameAs: input.isBasedOn,
    wordCount: input.wordCount,
    inLanguage: 'en-US',
  };
}

export interface VideoInput {
  url: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | string[] | null;
  uploadDate?: string | null;
  contentUrl?: string | null;
  embedUrl?: string | null;
  /** ISO 8601, e.g. PT2M30S */
  duration?: string | null;
  publisherId?: string;
}

export function videoNode(input: VideoInput): JsonLdNode | undefined {
  if (!input.name || !input.thumbnailUrl || !input.uploadDate) return undefined;
  if (!input.contentUrl && !input.embedUrl) return undefined;
  return {
    '@type': 'VideoObject',
    '@id': `${input.url}#video`,
    url: input.url,
    name: input.name,
    description: input.description || input.name,
    thumbnailUrl: input.thumbnailUrl,
    uploadDate: input.uploadDate,
    contentUrl: input.contentUrl,
    embedUrl: input.embedUrl,
    duration: input.duration,
    publisher: input.publisherId ? ref(input.publisherId) : undefined,
  };
}

export interface ReviewInput {
  body: string;
  authorName: string;
  itemReviewedId: string;
  rating?: number | null;
  datePublished?: string | null;
  name?: string | null;
}

export function reviewNode(input: ReviewInput): JsonLdNode | undefined {
  if (!input.body?.trim() || !input.authorName?.trim()) return undefined;
  const rating = typeof input.rating === 'number' && input.rating >= 1 && input.rating <= 5 ? input.rating : undefined;
  return {
    '@type': 'Review',
    name: input.name,
    reviewBody: input.body.trim(),
    author: { '@type': 'Person', name: input.authorName.trim() },
    itemReviewed: ref(input.itemReviewedId),
    datePublished: input.datePublished,
    reviewRating: rating ? { '@type': 'Rating', ratingValue: rating, bestRating: 5, worstRating: 1 } : undefined,
  };
}

export interface ProfilePageInput {
  tenant?: Pick<Tenant, 'baseUrl'>;
  baseUrl?: string;
  url: string;
  name: string;
  description?: string | null;
  image?: ImageInput | string | null;
  /** @id of the Person this profile is about. */
  mainEntityId: string;
  dateModified?: string | null;
}

export function profilePageNode(input: ProfilePageInput): JsonLdNode {
  return webPageNode({
    tenant: input.tenant,
    baseUrl: input.baseUrl,
    type: 'ProfilePage',
    url: input.url,
    name: input.name,
    description: input.description,
    image: input.image,
    hasBreadcrumb: true,
    mainEntityId: input.mainEntityId,
    dateModified: input.dateModified,
  });
}

export interface PlaceInput {
  url: string;
  name: string;
  description?: string | null;
  image?: ImageInput | string | null;
  geo?: { lat?: number | null; lng?: number | null } | null;
  /** Innermost first, e.g. ["Pitkin County", "Colorado"]. */
  containedIn?: Array<string | null | undefined>;
  amenities?: string[];
  address?: PostalAddressInput | null;
}

export function placeNode(input: PlaceInput): JsonLdNode {
  // Innermost first: ["Pitkin County", "Colorado"] becomes
  // AdministrativeArea(Pitkin County) → containedInPlace → State(Colorado).
  const chain = (input.containedIn || []).filter((n): n is string => !!n);
  const containedInPlace = chain.reduceRight<JsonLdNode | undefined>((outer, name, index) => {
    const isOutermost = index === chain.length - 1;
    const node: JsonLdNode = { '@type': isOutermost && !/county/i.test(name) ? 'State' : 'AdministrativeArea', name };
    if (outer) node.containedInPlace = outer;
    return node;
  }, undefined);
  return {
    '@type': 'Place',
    '@id': ids.mainEntity(input.url),
    url: input.url,
    name: input.name,
    description: input.description,
    image: imageObject(input.image),
    geo: geoCoordinates(input.geo),
    address: postalAddress(input.address),
    containedInPlace,
    amenityFeature: (input.amenities || []).map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  };
}

export interface ServiceInput {
  serviceType: string;
  description?: string | null;
  providerId: string;
  areaServed?: string[];
  url?: string;
}

export function serviceNode(input: ServiceInput): JsonLdNode | undefined {
  if (!input.serviceType) return undefined;
  return {
    '@type': 'Service',
    serviceType: input.serviceType,
    name: input.serviceType,
    description: input.description,
    url: input.url,
    provider: ref(input.providerId),
    areaServed: (input.areaServed || []).map(placeByName),
  };
}

export interface ReportInput {
  url: string;
  name: string;
  description?: string | null;
  image?: ImageInput | string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorId?: string;
  publisherId: string;
  /** The area the report covers, e.g. "Aspen, CO". */
  aboutPlace?: string | null;
  /** ISO 8601 interval, e.g. "2026-07/2026-09". */
  temporalCoverage?: string | null;
  pdfUrl?: string | null;
}

export function reportNode(input: ReportInput): JsonLdNode {
  return {
    '@type': 'Report',
    '@id': ids.mainEntity(input.url),
    url: input.url,
    name: input.name,
    headline: input.name,
    description: input.description,
    image: imageObject(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: input.authorId ? ref(input.authorId) : ref(input.publisherId),
    publisher: ref(input.publisherId),
    about: input.aboutPlace ? placeByName(input.aboutPlace) : undefined,
    temporalCoverage: input.temporalCoverage,
    mainEntityOfPage: ref(ids.webpage(input.url)),
    associatedMedia: input.pdfUrl ? { '@type': 'MediaObject', contentUrl: input.pdfUrl, encodingFormat: 'application/pdf' } : undefined,
    inLanguage: 'en-US',
  };
}

export interface ItemListEntry {
  url: string;
  name?: string | null;
  image?: string | null;
}

export function itemListNode(pageUrl: string, items: ItemListEntry[], name?: string): JsonLdNode | undefined {
  const entries = items.filter((i) => !!i.url);
  if (entries.length === 0) return undefined;
  return {
    '@type': 'ItemList',
    '@id': ids.itemList(pageUrl),
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name,
      image: item.image,
    })),
  };
}

export interface CollectionPageInput extends Omit<WebPageInput, 'type'> {
  items?: ItemListEntry[];
  listName?: string;
}

/** CollectionPage plus its ItemList, linked through mainEntity. */
export function collectionPageNodes(input: CollectionPageInput): JsonLdNode[] {
  const list = input.items ? itemListNode(input.url, input.items, input.listName) : undefined;
  const page = webPageNode({ ...input, type: 'CollectionPage', mainEntityId: list ? ids.itemList(input.url) : undefined });
  return list ? [page, list] : [page];
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export type ListingAvailability = 'InStock' | 'LimitedAvailability' | 'SoldOut';

export interface ListingInput {
  url: string;
  name: string;
  description?: string | null;
  mlsNumber?: string | null;
  photos?: string[];
  address?: PostalAddressInput | null;
  geo?: { lat?: number | null; lng?: number | null } | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  lotSizeAcres?: number | null;
  yearBuilt?: number | null;
  listPrice?: number | null;
  status?: string | null;
  listingDate?: string | null;
  soldDate?: string | null;
  /** The business @id, only when the listing is the tenant's own. */
  sellerId?: string;
  video?: VideoInput | null;
}

/** Maps the feed's property type to a schema.org accommodation type. */
export function accommodationType(propertyType?: string | null): string {
  const type = (propertyType || '').toLowerCase();
  if (/condo|apartment|co-?op|flat/.test(type)) return 'Apartment';
  if (/town/.test(type)) return 'House';
  if (/duplex|multi|triplex|fourplex|income/.test(type)) return 'House';
  if (/land|lot|acreage|ranch|farm/.test(type)) return 'LandmarksOrHistoricalBuildings';
  if (/commercial|office|retail|industrial|business/.test(type)) return 'Accommodation';
  if (/single|residence|house|home|cabin|chalet/.test(type)) return 'SingleFamilyResidence';
  return 'Accommodation';
}

export function listingAvailability(status?: string | null): ListingAvailability {
  const s = (status || '').trim().toLowerCase();
  if (s === 'active' || s === 'coming soon' || s === 'active under contract') return 'InStock';
  if (s === 'pending' || s === 'contingent') return 'LimitedAvailability';
  return 'SoldOut';
}

/** RealEstateListing plus the accommodation it offers, cross-linked. */
export function listingNodes(input: ListingInput): JsonLdNode[] {
  const accommodationId = `${input.url}#property`;
  const address = postalAddress(input.address);
  const geo = geoCoordinates(input.geo);
  const availability = listingAvailability(input.status);
  const video = input.video ? videoNode(input.video) : undefined;

  const listing: JsonLdNode = {
    '@type': 'RealEstateListing',
    '@id': ids.mainEntity(input.url),
    url: input.url,
    name: input.name,
    description: input.description,
    datePosted: input.listingDate,
    dateModified: input.soldDate,
    image: input.photos,
    identifier: input.mlsNumber ? { '@type': 'PropertyValue', name: 'MLS Number', value: input.mlsNumber } : undefined,
    address,
    geo,
    mainEntityOfPage: ref(ids.webpage(input.url)),
    about: ref(accommodationId),
    video: video ? ref(video['@id'] as string) : undefined,
    offers: input.listPrice
      ? {
          '@type': 'Offer',
          url: input.url,
          price: input.listPrice,
          priceCurrency: 'USD',
          availability: schemaUrl(availability),
          itemOffered: ref(accommodationId),
          seller: input.sellerId ? ref(input.sellerId) : undefined,
          priceValidUntil: availability === 'SoldOut' && input.soldDate ? input.soldDate : undefined,
        }
      : undefined,
  };

  const accommodation: JsonLdNode = {
    '@type': accommodationType(input.propertyType),
    '@id': accommodationId,
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.photos,
    numberOfRooms: input.bedrooms ?? undefined,
    numberOfBedrooms: input.bedrooms ?? undefined,
    numberOfBathroomsTotal: input.bathrooms ?? undefined,
    floorSize: input.squareFeet ? { '@type': 'QuantitativeValue', value: input.squareFeet, unitCode: 'FTK' } : undefined,
    lotSize: input.lotSizeAcres ? { '@type': 'QuantitativeValue', value: input.lotSizeAcres, unitCode: 'ACR' } : undefined,
    yearBuilt: input.yearBuilt ?? undefined,
    address,
    geo,
  };

  return [listing, accommodation, ...(video ? [video] : [])];
}

export type { Ref };
