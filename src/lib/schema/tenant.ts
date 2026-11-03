/**
 * The tenant: everything structured data needs to know about the business
 * that owns this deployment, read once from Sanity site settings and the
 * primary agent's team member document. Nothing here is specific to one
 * site; a different Sanity project yields a different tenant.
 */
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { normalizeBaseUrl } from './ids';

export interface TenantCredential {
  type: 'membership' | 'award' | 'license';
  name: string;
  issuer?: string | null;
  url?: string | null;
  year?: number | null;
}

export interface TenantAgent {
  name: string;
  slug: string;
  url: string;
  jobTitle?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  sameAs: string[];
  knowsAbout: string[];
  credentials: TenantCredential[];
}

export interface TenantService {
  serviceType: string;
  description?: string | null;
}

export interface TenantFaq {
  question: string;
  answer: unknown;
}

export interface Tenant {
  /** Production origin with no trailing slash, e.g. https://www.klugproperties.com */
  baseUrl: string;
  /** The business name, e.g. "Chris Klug Properties". */
  name: string;
  /** The site's SEO title, used for the WebSite node. */
  siteTitle: string;
  description?: string | null;
  logoUrl?: string | null;
  /** A representative photo of the business (default hero or meta image). */
  imageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: { street?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null } | null;
  geo?: { lat?: number | null; lng?: number | null } | null;
  priceRange?: string | null;
  areaServed: string[];
  sameAs: string[];
  brokerage?: { name?: string | null; url?: string | null } | null;
  services: TenantService[];
  faqs: TenantFaq[];
  agent: TenantAgent | null;
  /** Path of the listings search page, for the WebSite SearchAction. */
  searchPath: string;
  /** Path under which agent profiles live, e.g. /real-estate-agent. */
  agentProfilePath: string;
}

const TENANT_QUERY = `*[_type == "settings" && _id == "settings"][0]{
  title,
  description,
  siteUrl,
  socialMedia,
  contactInfo,
  "logo": branding.logo,
  "defaultHeroImage": defaultHeroImage.asset->url,
  "defaultMetaImage": seo.defaultMetaImage,
  business{
    office,
    priceRange,
    areaServed,
    brokerage,
    services,
    faqs,
    primaryAgent->{
      name,
      "slug": slug.current,
      title,
      bio,
      image,
      email,
      phone,
      mobile,
      website,
      socialMedia,
      knowsAbout,
      credentials
    }
  }
}`;

const builder = createImageUrlBuilder(client);

function imageUrl(source: unknown, width: number, height?: number): string | undefined {
  const asset = (source as { asset?: unknown } | null)?.asset;
  if (!asset) return undefined;
  try {
    const b = builder.image(source as Parameters<typeof builder.image>[0]).width(width);
    return (height ? b.height(height).fit('crop') : b).url();
  } catch {
    return undefined;
  }
}

/** The brand as a name: the last "|" segment of an SEO site title. */
export function brandName(title?: string | null, fallback = 'Real Estate'): string {
  const parts = (title || '').split('|').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function socialLinks(social?: Record<string, string | null | undefined> | null): string[] {
  if (!social) return [];
  return Object.values(social).filter((v): v is string => typeof v === 'string' && /^https?:\/\//.test(v));
}

/** The production origin. Preview and vercel.app hosts never reach structured data. */
export function resolveBaseUrl(settingsSiteUrl?: string | null): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, settingsSiteUrl];
  for (const candidate of candidates) {
    const url = (candidate || '').trim();
    if (!url) continue;
    if (/vercel\.app/i.test(url)) continue;
    return normalizeBaseUrl(url);
  }
  return 'https://example.com';
}

let cached: { at: number; tenant: Tenant } | null = null;
const CACHE_MS = 60_000;

export async function getTenant(options: { agentProfilePath?: string; searchPath?: string } = {}): Promise<Tenant> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.tenant;

  let data: Record<string, any> | null = null;
  try {
    data = await client.fetch(TENANT_QUERY, {}, { next: { revalidate: 300 } });
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
  }

  const baseUrl = resolveBaseUrl(data?.siteUrl);
  const agentProfilePath = options.agentProfilePath || process.env.NEXT_PUBLIC_AGENT_PROFILE_PATH || '/real-estate-agent';
  const searchPath = options.searchPath || process.env.NEXT_PUBLIC_LISTINGS_PATH || '/real-estate-for-sale';
  const business = data?.business || {};
  const office = business.office || {};
  const primary = business.primaryAgent;

  const agent: TenantAgent | null = primary?.name && primary?.slug
    ? {
        name: primary.name,
        slug: primary.slug,
        url: `${baseUrl}${agentProfilePath}/${primary.slug}`,
        jobTitle: primary.title,
        bio: primary.bio,
        imageUrl: imageUrl(primary.image, 800),
        phone: primary.phone || primary.mobile,
        email: primary.email,
        sameAs: [primary.website, ...socialLinks(primary.socialMedia)].filter((v): v is string => !!v),
        knowsAbout: Array.isArray(primary.knowsAbout) ? primary.knowsAbout.filter(Boolean) : [],
        credentials: Array.isArray(primary.credentials)
          ? primary.credentials
              .filter((c: any) => c?.name && c?.credentialType)
              .map((c: any) => ({ type: c.credentialType, name: c.name, issuer: c.issuer, url: c.url, year: c.year }))
          : [],
      }
    : null;

  const tenant: Tenant = {
    baseUrl,
    name: brandName(data?.title, process.env.NEXT_PUBLIC_SITE_TITLE || 'Real Estate'),
    siteTitle: data?.title || process.env.NEXT_PUBLIC_SITE_TITLE || 'Real Estate',
    description: data?.description,
    logoUrl: imageUrl(data?.logo, 600),
    imageUrl: imageUrl(data?.defaultMetaImage, 1200, 630) || data?.defaultHeroImage || undefined,
    phone: data?.contactInfo?.phone,
    email: data?.contactInfo?.email,
    address: office.street || office.city || office.postalCode
      ? { street: office.street, city: office.city, state: office.state, postalCode: office.postalCode, country: office.country }
      : data?.contactInfo?.address
        ? { street: String(data.contactInfo.address).split('\n')[0] }
        : null,
    geo: typeof office.lat === 'number' && typeof office.lng === 'number' ? { lat: office.lat, lng: office.lng } : null,
    priceRange: business.priceRange,
    areaServed: Array.isArray(business.areaServed) ? business.areaServed.filter(Boolean) : [],
    sameAs: socialLinks(data?.socialMedia),
    brokerage: business.brokerage?.name ? business.brokerage : null,
    services: Array.isArray(business.services) ? business.services.filter((s: any) => s?.serviceType) : [],
    faqs: Array.isArray(business.faqs) ? business.faqs.filter((f: any) => f?.question && f?.answer) : [],
    agent,
    searchPath,
    agentProfilePath,
  };

  cached = { at: Date.now(), tenant };
  return tenant;
}
