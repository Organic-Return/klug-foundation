/**
 * The tenant: everything structured data needs to know about the business
 * that owns this deployment, read once from Sanity site settings and the
 * primary agent's team member document. Nothing here is specific to one
 * site; a different Sanity project yields a different tenant.
 */
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { normalizeBaseUrl } from './ids';
import { siteConfig } from './site-config';

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
  /** Profile path for a team member slug, e.g. /real-estate-agent/jane. */
  agentProfilePath: (slug: string) => string;
}

const AGENT_FIELDS = `
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
`;

const TENANT_QUERY = `*[_type == "settings" && _id == "settings"][0]{
  template,
  title,
  siteName,
  description,
  siteUrl,
  socialMedia,
  contactInfo,
  "logo": branding.logo,
  defaultHeroImage,
  "defaultMetaImage": seo.defaultMetaImage,
  "homepageHero": *[_type == "homepage"][0].hero.fallbackImage,
  business{
    office,
    priceRange,
    areaServed,
    brokerage,
    services,
    faqs,
    primaryAgent->{${AGENT_FIELDS}}
  },
  "fallbackAgent": *[_type == "teamMember" && featured == true && inactive != true] | order(order asc)[0]{${AGENT_FIELDS}}
}`;

interface RawCredential {
  credentialType?: TenantCredential['type'];
  name?: string;
  issuer?: string;
  url?: string;
  year?: number;
}

interface RawAgent {
  name?: string;
  slug?: string;
  title?: string;
  bio?: string;
  image?: unknown;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  socialMedia?: Record<string, string | null | undefined>;
  knowsAbout?: Array<string | null>;
  credentials?: RawCredential[];
}

interface RawSettings {
  template?: string;
  title?: string;
  siteName?: string;
  description?: string;
  siteUrl?: string;
  socialMedia?: Record<string, string | null | undefined>;
  contactInfo?: { email?: string; phone?: string; address?: string };
  logo?: unknown;
  defaultHeroImage?: unknown;
  defaultMetaImage?: unknown;
  homepageHero?: unknown;
  business?: {
    office?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string; lat?: number; lng?: number };
    priceRange?: string;
    areaServed?: Array<string | null>;
    brokerage?: { name?: string; url?: string };
    services?: Array<{ serviceType?: string; description?: string | null } | null>;
    faqs?: Array<{ question?: string; answer?: unknown } | null>;
    primaryAgent?: RawAgent | null;
  };
  /** The featured team member, used when settings name no primary agent. */
  fallbackAgent?: RawAgent | null;
}

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

/**
 * A PostalAddress from a free-text office address as editors type it in
 * settings, e.g. "Snowmass Village Office\n16 Kearns Road, Suite 110\n
 * Snowmass Village, CO 81615". The last line is read as "City, ST ZIP" and
 * the lines before it as the street (minus a leading office label). When
 * it does not match that shape the whole text becomes the street.
 */
export function parseFreeTextAddress(address?: string | null): Tenant['address'] {
  const lines = (address || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const last = /^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/.exec(lines[lines.length - 1]);
  if (!last) return { street: lines.join(', ') };
  const [, city, state, postalCode] = last;
  const streetLines = lines.slice(0, -1);
  const street = (streetLines.length > 1 ? streetLines.slice(1) : streetLines).join(', ');
  return { street: street || undefined, city, state, postalCode, country: 'US' };
}

/**
 * The brand as a name. Settings may carry an explicit `siteName`, written
 * "Brand | Tagline", whose first segment is the brand; otherwise the SEO
 * `title` is "Keywords | Brand", whose last segment is the brand.
 */
export function brandName(title?: string | null, fallback = 'Real Estate', siteName?: string | null): string {
  const explicit = (siteName || '').split('|')[0].trim();
  if (explicit) return explicit;
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

export async function getTenant(): Promise<Tenant> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.tenant;

  let data: RawSettings | null = null;
  try {
    data = await client.fetch<RawSettings | null>(TENANT_QUERY, {}, { next: { revalidate: 300 } });
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
  }

  const baseUrl = resolveBaseUrl(data?.siteUrl);
  const template = data?.template || process.env.NEXT_PUBLIC_SITE_TEMPLATE || null;
  const agentProfilePath = (slug: string) => siteConfig.agentProfilePath(slug, template);
  const searchPath = siteConfig.searchPath;
  const business: NonNullable<RawSettings['business']> = data?.business || {};
  const office = business.office || {};
  // Settings → Business → Primary Agent wins; the featured team member stands
  // in until an editor sets it.
  const primary = business.primaryAgent || data?.fallbackAgent;

  const agent: TenantAgent | null = primary?.name && primary?.slug
    ? {
        name: primary.name,
        slug: primary.slug,
        url: `${baseUrl}${agentProfilePath(primary.slug)}`,
        jobTitle: primary.title,
        bio: primary.bio,
        imageUrl: imageUrl(primary.image, 800),
        phone: primary.phone || primary.mobile,
        email: primary.email,
        sameAs: [primary.website, ...socialLinks(primary.socialMedia)].filter((v): v is string => !!v),
        knowsAbout: (primary.knowsAbout || []).filter((k): k is string => !!k),
        credentials: (primary.credentials || [])
          .filter((c): c is RawCredential & { name: string; credentialType: TenantCredential['type'] } => !!c?.name && !!c?.credentialType)
          .map((c) => ({ type: c.credentialType, name: c.name, issuer: c.issuer, url: c.url, year: c.year })),
      }
    : null;

  const tenant: Tenant = {
    baseUrl,
    name: brandName(data?.title, process.env.NEXT_PUBLIC_SITE_TITLE || 'Real Estate', data?.siteName),
    siteTitle: data?.title || process.env.NEXT_PUBLIC_SITE_TITLE || 'Real Estate',
    description: data?.description,
    logoUrl: imageUrl(data?.logo, 600),
    // Default share image: the SEO meta image, else the site-wide hero, else
    // the homepage hero, else the logo. Each step is a settings value, so a
    // tenant that sets none still gets a picture rather than a blank card.
    imageUrl:
      imageUrl(data?.defaultMetaImage, 1200, 630) ||
      imageUrl(data?.defaultHeroImage, 1200, 630) ||
      imageUrl(data?.homepageHero, 1200, 630) ||
      imageUrl(data?.logo, 1200) ||
      undefined,
    phone: data?.contactInfo?.phone,
    email: data?.contactInfo?.email,
    address: office.street || office.city || office.postalCode
      ? { street: office.street, city: office.city, state: office.state, postalCode: office.postalCode, country: office.country }
      : parseFreeTextAddress(data?.contactInfo?.address),
    geo: typeof office.lat === 'number' && typeof office.lng === 'number' ? { lat: office.lat, lng: office.lng } : null,
    priceRange: business.priceRange,
    areaServed: (business.areaServed || []).filter((a): a is string => !!a),
    sameAs: socialLinks(data?.socialMedia),
    brokerage: business.brokerage?.name ? business.brokerage : null,
    services: (business.services || [])
      .filter((svc): svc is { serviceType: string; description?: string | null } => !!svc?.serviceType)
      .map((svc) => ({ serviceType: svc.serviceType, description: svc.description })),
    faqs: (business.faqs || []).filter((f): f is TenantFaq => !!f?.question && !!f?.answer),
    agent,
    searchPath,
    agentProfilePath,
  };

  cached = { at: Date.now(), tenant };
  return tenant;
}
