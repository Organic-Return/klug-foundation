import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { client } from '@/sanity/client';
import { getListings, getListingHref, toAddressSlug, getDistinctCities } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';
import { getSettings, getYouTubeCredentials } from '@/lib/settings';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';

// A single sitemap.xml that fans out to Sanity + Realogy + MLS + YouTube
// in one request was returning in ~23s on cold start, past the 15s
// patience of most crawlers. We now split into a sitemap index with
// four sub-sitemaps via Next.js `generateSitemaps()`, and cache the
// data fetches with `unstable_cache` so only the first request per
// hour pays the cost. `force-dynamic` is retained so a slow data
// source never blocks a deploy.
export const dynamic = 'force-dynamic';

// Sub-sitemap identifiers. Next.js requires numeric ids; the named
// constants are just for readability inside this file.
const SITEMAP_STATIC = 0;
const SITEMAP_CONTENT = 1;
const SITEMAP_LISTINGS = 2;
const SITEMAP_PARTNERS = 3;

const SITEMAP_REVALIDATE_SECONDS = 3600;

export async function generateSitemaps() {
  return [
    { id: SITEMAP_STATIC },
    { id: SITEMAP_CONTENT },
    { id: SITEMAP_LISTINGS },
    { id: SITEMAP_PARTNERS },
  ];
}

// Cap any single slow data source so one outage / runaway query
// can't poison a sub-sitemap on cache miss.
function withTimeout<T>(p: Promise<T>, fallback: T, label: string, timeoutMs = 45_000): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((resolve) =>
      setTimeout(() => {
        console.warn(`[sitemap] ${label} timed out after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs)
    ),
  ]);
}

// Sanity queries for dynamic content
const COMMUNITIES_QUERY = `*[_type == "community"]{ "slug": slug.current, _updatedAt }`;
const MARKET_REPORTS_QUERY = `*[_type == "publication" && publicationType == "market-report"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const MAGAZINES_QUERY = `*[_type == "publication" && publicationType == "magazine"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const POSTS_QUERY = `*[_type == "post"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const PARTNERS_QUERY = `*[_type == "affiliatedPartner" && active == true]{
  "slug": slug.current,
  partnerType,
  firstName,
  lastName,
  _updatedAt
}`;
const TEAM_MEMBERS_QUERY = `*[_type == "teamMember" && defined(slug.current) && inactive != true]{ "slug": slug.current, _updatedAt }`;

interface YouTubeUploadItem {
  snippet?: { resourceId?: { videoId?: string }; publishedAt?: string };
}

interface MarketLeaderRow {
  street_address: string | null;
}

async function getMarketLeaderListingSlugs(): Promise<string[]> {
  if (!isRealogyConfigured()) return [];
  const supabase = getRealogySupabase();
  if (!supabase) return [];
  const partners = await client.fetch<Array<{ firstName: string; lastName: string }>>(
    `*[_type == "affiliatedPartner" && active == true]{ firstName, lastName }`
  );
  // Single bulk query against an OR pattern on the agent name —
  // N partners × paginated lookup was the slowest part of the
  // sitemap. One query with 2000 rows covers the typical inventory.
  const namePatterns = partners
    .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
    .filter((n) => n.length >= 3)
    .map((n) => {
      const parts = n.split(/\s+/);
      return `primary_agent_name.ilike.${parts[0]}%${parts[parts.length - 1]}`;
    });
  if (namePatterns.length === 0) return [];
  const slugs = new Set<string>();
  const { data } = await supabase
    .from('realogy_listings')
    .select('street_address')
    .or(namePatterns.join(','))
    .eq('listing_type', 'ForSale')
    .limit(2000);
  for (const row of (data ?? []) as MarketLeaderRow[]) {
    if (!row.street_address) continue;
    const slug = toAddressSlug(row.street_address);
    if (slug) slugs.add(slug);
  }
  return Array.from(slugs);
}

async function getYouTubeVideoIds(): Promise<Array<{ videoId: string; publishedAt?: string }>> {
  const seen = new Map<string, { videoId: string; publishedAt?: string }>();
  const { apiKey, channelId } = await getYouTubeCredentials();
  if (!apiKey || !channelId || !channelId.startsWith('UC')) return [];
  const uploadsPlaylistId = 'UU' + channelId.slice(2);
  let pageToken: string | undefined;
  for (let page = 0; page < 6; page++) {
    const params = new URLSearchParams({
      key: apiKey,
      playlistId: uploadsPlaylistId,
      part: 'snippet',
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) break;
    const data = (await res.json()) as { items?: YouTubeUploadItem[]; nextPageToken?: string };
    for (const item of data.items || []) {
      const vid = item.snippet?.resourceId?.videoId;
      if (vid && !seen.has(vid)) {
        seen.set(vid, { videoId: vid, publishedAt: item.snippet?.publishedAt });
      }
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return Array.from(seen.values());
}

// ---- Sub-sitemap builders ---------------------------------------------------

// Static pages: hardcoded, no remote fetches, no cache needed.
function buildStaticSitemap(baseUrl: string): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/real-estate-for-sale`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/off-market`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/market-reports`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/living-aspen`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/why-klug-properties`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/affiliated-partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/affiliated-partners/market-leaders`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/affiliated-partners/ski-town`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/team`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/in-the-news`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/exclusive-and-new`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sold-by-klug-properties`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/open-houses`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/buy/first-time-buyers`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/buy/relocation`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/rentals`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/commercial`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/land`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  ];
}

// Content sub-sitemap: Sanity-driven content + YouTube + off-market.
const buildContentSitemap = unstable_cache(
  async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    const [
      communities,
      marketReports,
      magazines,
      posts,
      partners,
      teamMembers,
      buyPage,
      sellPage,
      aboutPage,
      resourcesPage,
      youtubeVideos,
      offMarketListings,
    ] = await Promise.all([
      withTimeout(
        client.fetch<Array<{ slug: string; _updatedAt: string }>>(COMMUNITIES_QUERY),
        [] as Array<{ slug: string; _updatedAt: string }>,
        'sanity-communities'
      ),
      withTimeout(
        client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MARKET_REPORTS_QUERY),
        [] as Array<{ slug: string; _updatedAt: string; publishedAt: string }>,
        'sanity-market-reports'
      ),
      withTimeout(
        client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MAGAZINES_QUERY),
        [] as Array<{ slug: string; _updatedAt: string; publishedAt: string }>,
        'sanity-magazines'
      ),
      withTimeout(
        client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(POSTS_QUERY),
        [] as Array<{ slug: string; _updatedAt: string; publishedAt: string }>,
        'sanity-posts'
      ),
      withTimeout(
        client.fetch<Array<{ slug: string; partnerType: string; firstName: string; lastName: string; _updatedAt: string }>>(PARTNERS_QUERY),
        [] as Array<{ slug: string; partnerType: string; firstName: string; lastName: string; _updatedAt: string }>,
        'sanity-partners'
      ),
      withTimeout(
        client.fetch<Array<{ slug: string; _updatedAt: string }>>(TEAM_MEMBERS_QUERY),
        [] as Array<{ slug: string; _updatedAt: string }>,
        'sanity-team-members'
      ),
      withTimeout(client.fetch<{ _updatedAt: string } | null>(`*[_type == "buyPage"][0]{ _updatedAt }`), null, 'sanity-buy-page'),
      withTimeout(client.fetch<{ _updatedAt: string } | null>(`*[_type == "sellPage"][0]{ _updatedAt }`), null, 'sanity-sell-page'),
      withTimeout(client.fetch<{ _updatedAt: string } | null>(`*[_type == "aboutPage"][0]{ _updatedAt }`), null, 'sanity-about-page'),
      withTimeout(client.fetch<{ _updatedAt: string } | null>(`*[_type == "resourcesPage"][0]{ _updatedAt }`), null, 'sanity-resources-page'),
      withTimeout(getYouTubeVideoIds(), [] as Array<{ videoId: string; publishedAt?: string }>, 'youtube'),
      withTimeout(getOffMarketListings(), [] as Awaited<ReturnType<typeof getOffMarketListings>>, 'off-market'),
    ]);

    const out: MetadataRoute.Sitemap = [];

    // Singleton content pages (only if present in this dataset)
    if (buyPage) {
      out.push({ url: `${baseUrl}/buy`, lastModified: new Date(buyPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
    }
    if (sellPage) {
      out.push({ url: `${baseUrl}/sell`, lastModified: new Date(sellPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
    }
    if (aboutPage) {
      out.push({ url: `${baseUrl}/about`, lastModified: new Date(aboutPage._updatedAt), changeFrequency: 'monthly', priority: 0.7 });
    }
    if (resourcesPage) {
      out.push({ url: `${baseUrl}/resources`, lastModified: new Date(resourcesPage._updatedAt), changeFrequency: 'monthly', priority: 0.6 });
    }
    if (posts.length > 0) {
      out.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
    }

    for (const community of communities) {
      out.push({
        url: `${baseUrl}/communities/${community.slug}`,
        lastModified: new Date(community._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
    for (const report of marketReports) {
      out.push({
        url: `${baseUrl}/market-reports/${report.slug}`,
        lastModified: new Date(report._updatedAt || report.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    for (const magazine of magazines) {
      out.push({
        url: `${baseUrl}/living-aspen/${magazine.slug}`,
        lastModified: new Date(magazine._updatedAt || magazine.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
    for (const post of posts) {
      out.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt || post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
    for (const partner of partners) {
      const slug = partner.slug || `${partner.firstName}-${partner.lastName}`.toLowerCase();
      out.push({
        url: `${baseUrl}/real-estate-agent/${slug}`,
        lastModified: new Date(partner._updatedAt),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
    for (const member of teamMembers) {
      out.push({
        url: `${baseUrl}/real-estate-agent/${member.slug}`,
        lastModified: new Date(member._updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
    for (const video of youtubeVideos) {
      out.push({
        url: `${baseUrl}/videos/${video.videoId}`,
        lastModified: video.publishedAt ? new Date(video.publishedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
    for (const listing of offMarketListings) {
      out.push({
        url: `${baseUrl}/off-market/${listing.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    return out;
  },
  ['sitemap-content-v1'],
  { revalidate: SITEMAP_REVALIDATE_SECONDS, tags: ['sitemap', 'sitemap-content'] }
);

// Listings sub-sitemap: MLS detail pages + property-type city sub-hubs.
// This is the heaviest source — up to 5 pages × 1000 rows = 5k entries.
const buildListingsSitemap = unstable_cache(
  async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    const fetchListingPages = async (): Promise<MetadataRoute.Sitemap> => {
      const out: MetadataRoute.Sitemap = [];
      try {
        const PAGE_SIZE = 1000;
        const seen = new Set<string>();
        for (let page = 1; page <= 5; page++) {
          const { listings, totalPages } = await getListings(page, PAGE_SIZE);
          if (!listings || listings.length === 0) break;
          for (const listing of listings) {
            const href = getListingHref(listing);
            if (seen.has(href)) continue;
            seen.add(href);
            out.push({
              url: `${baseUrl}${href}`,
              lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
              changeFrequency: 'daily',
              priority: 0.8,
            });
          }
          if (page >= totalPages) break;
        }
      } catch (error) {
        console.error('[sitemap] error fetching MLS listings:', error);
      }
      return out;
    };

    const [listingPages, distinctCities] = await Promise.all([
      withTimeout(fetchListingPages(), [] as MetadataRoute.Sitemap, 'mls-listings', 90_000),
      withTimeout(getDistinctCities(), [] as string[], 'cities'),
    ]);

    // Property-type × city sub-hubs (rentals/commercial/land by city)
    const citySlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
    const propertyTypeCityPages: MetadataRoute.Sitemap = [];
    for (const c of distinctCities) {
      const slug = citySlug(c);
      if (!slug) continue;
      for (const t of ['rentals', 'commercial', 'land'] as const) {
        propertyTypeCityPages.push({
          url: `${baseUrl}/${t}/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.6,
        });
      }
    }

    return [...listingPages, ...propertyTypeCityPages];
  },
  ['sitemap-listings-v1'],
  { revalidate: SITEMAP_REVALIDATE_SECONDS, tags: ['sitemap', 'sitemap-listings'] }
);

// Partners sub-sitemap: Realogy-backed market-leader listing detail pages.
const buildPartnersSitemap = unstable_cache(
  async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    const marketLeaderListingSlugs = await withTimeout(
      getMarketLeaderListingSlugs(),
      [] as string[],
      'partner-listings'
    );

    const out: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/affiliated-partners/market-leaders/listings`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
      },
    ];
    for (const slug of marketLeaderListingSlugs) {
      out.push({
        url: `${baseUrl}/affiliated-partners/market-leaders/listings/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
      });
    }
    return out;
  },
  ['sitemap-partners-v1'],
  { revalidate: SITEMAP_REVALIDATE_SECONDS, tags: ['sitemap', 'sitemap-partners'] }
);

// ---- Entry point ------------------------------------------------------------

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://example.com';

  switch (id) {
    case SITEMAP_STATIC:
      return buildStaticSitemap(baseUrl);
    case SITEMAP_CONTENT:
      return buildContentSitemap(baseUrl);
    case SITEMAP_LISTINGS:
      return buildListingsSitemap(baseUrl);
    case SITEMAP_PARTNERS:
      return buildPartnersSitemap(baseUrl);
    default:
      return [];
  }
}
