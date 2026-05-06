import { MetadataRoute } from 'next';
import { client } from '@/sanity/client';
import { getListings, getListingHref, toAddressSlug, getDistinctCities } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';
import { getSettings, getYouTubeCredentials } from '@/lib/settings';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';

// Generate the sitemap on demand (and cache for 1h) instead of at
// build time. The full sweep (MLS pagination + per-partner Realogy
// listing harvest + YouTube + Sanity) routinely exceeds Vercel's
// 60s build-export timeout × 3 retries, which then fails the whole
// deploy. ISR-style runtime generation has a much higher timeout
// budget and never blocks deployment.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// Cap any single slow data source so one outage / runaway query
// can't push total sitemap generation over the runtime timeout.
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
  // Single bulk query against an OR pattern on the agent name
  // — N partners × paginated lookup was the slowest part of the
  // sitemap. One query with 1000 rows covers the typical inventory
  // for the partner network and runs in a couple seconds.
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://example.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/off-market`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/market-reports`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/living-aspen`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/testimonials`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/why-klug-properties`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/affiliated-partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/affiliated-partners/market-leaders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/affiliated-partners/ski-town`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/in-the-news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/exclusive-and-new`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sold-by-klug-properties`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/open-houses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/buy/first-time-buyers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/buy/relocation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // Property-type hubs (rentals, commercial, land). City-filtered
    // sub-hubs are added below from the live cities list.
    {
      url: `${baseUrl}/rentals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/commercial`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/land`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Fetch dynamic content from Sanity + YouTube
  const [communities, marketReports, magazines, posts, partners, teamMembers, buyPage, sellPage, aboutPage, resourcesPage, youtubeVideos, marketLeaderListingSlugs, distinctCities] = await Promise.all([
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(COMMUNITIES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MARKET_REPORTS_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MAGAZINES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(POSTS_QUERY),
    client.fetch<Array<{ slug: string; partnerType: string; firstName: string; lastName: string; _updatedAt: string }>>(PARTNERS_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(TEAM_MEMBERS_QUERY),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "buyPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "sellPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "aboutPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "resourcesPage"][0]{ _updatedAt }`),
    withTimeout(getYouTubeVideoIds(), [] as Array<{ videoId: string; publishedAt?: string }>, 'youtube'),
    withTimeout(getMarketLeaderListingSlugs(), [] as string[], 'partner-listings'),
    withTimeout(getDistinctCities(), [] as string[], 'cities'),
  ]);

  // Conditionally add singleton content pages (only if they exist in this project's Sanity dataset)
  const singletonPages: MetadataRoute.Sitemap = [];
  if (buyPage) {
    singletonPages.push({ url: `${baseUrl}/buy`, lastModified: new Date(buyPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
  }
  if (sellPage) {
    singletonPages.push({ url: `${baseUrl}/sell`, lastModified: new Date(sellPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
  }
  if (aboutPage) {
    singletonPages.push({ url: `${baseUrl}/about`, lastModified: new Date(aboutPage._updatedAt), changeFrequency: 'monthly', priority: 0.7 });
  }
  if (resourcesPage) {
    singletonPages.push({ url: `${baseUrl}/resources`, lastModified: new Date(resourcesPage._updatedAt), changeFrequency: 'monthly', priority: 0.6 });
  }
  if (posts && posts.length > 0) {
    singletonPages.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
  }

  // Community pages
  const communityPages: MetadataRoute.Sitemap = (communities || []).map((community) => ({
    url: `${baseUrl}/communities/${community.slug}`,
    lastModified: new Date(community._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Market report pages
  const marketReportPages: MetadataRoute.Sitemap = (marketReports || []).map((report) => ({
    url: `${baseUrl}/market-reports/${report.slug}`,
    lastModified: new Date(report._updatedAt || report.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Magazine/Living Aspen pages
  const magazinePages: MetadataRoute.Sitemap = (magazines || []).map((magazine) => ({
    url: `${baseUrl}/living-aspen/${magazine.slug}`,
    lastModified: new Date(magazine._updatedAt || magazine.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Blog/Post pages
  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(post._updatedAt || post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Partner pages
  const partnerPages: MetadataRoute.Sitemap = (partners || []).map((partner) => {
    const slug = partner.slug || `${partner.firstName}-${partner.lastName}`.toLowerCase();
    const pathPrefix = partner.partnerType === 'market_leader' ? 'market-leaders' : 'ski-town';
    return {
      url: `${baseUrl}/affiliated-partners/${pathPrefix}/${slug}`,
      lastModified: new Date(partner._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    };
  });

  // Team member detail pages
  const teamMemberPages: MetadataRoute.Sitemap = (teamMembers || []).map((member) => ({
    url: `${baseUrl}/team/${member.slug}`,
    lastModified: new Date(member._updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Video detail pages
  const videoPages: MetadataRoute.Sitemap = (youtubeVideos || []).map((video) => ({
    url: `${baseUrl}/videos/${video.videoId}`,
    lastModified: video.publishedAt ? new Date(video.publishedAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Property-type city sub-hubs — /rentals/<city>, /commercial/<city>,
  // /land/<city>. One entry per (type × city) combination so the
  // search graph maps every (Aspen rentals, Snowmass commercial, etc).
  const propertyTypeCityPages: MetadataRoute.Sitemap = [];
  const citySlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
  for (const c of distinctCities || []) {
    const slug = citySlug(c);
    if (!slug) continue;
    for (const t of ['rentals', 'commercial', 'land'] as const) {
      propertyTypeCityPages.push({
        url: `${baseUrl}/${t}/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      });
    }
  }

  // Market Leader listing detail pages
  // (/affiliated-partners/market-leaders/listings/[slug])
  const marketLeaderListingsIndex: MetadataRoute.Sitemap = [{
    url: `${baseUrl}/affiliated-partners/market-leaders/listings`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }];
  const marketLeaderListingPages: MetadataRoute.Sitemap = (marketLeaderListingSlugs || []).map((slug) => ({
    url: `${baseUrl}/affiliated-partners/market-leaders/listings/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // Fetch every MLS listing — active and closed/sold — paginating through
  // the dataset so the sitemap exposes the full inventory the /listings page
  // shows visitors. Sold listings are valuable SEO surfaces (track record,
  // historical pricing) so we no longer exclude them. Capped at 5 pages of
  // 1000 = up to 5k listings to keep total sitemap generation under the
  // runtime timeout; raise if /listings ever exceeds this volume.
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
            changeFrequency: 'daily' as const,
            priority: 0.8,
          });
        }
        if (page >= totalPages) break;
      }
    } catch (error) {
      console.error('Error fetching listings for sitemap:', error);
    }
    return out;
  };
  // MLS pagination is the heaviest source — give it a longer budget
  // (90s) since this is the bulk of the sitemap's value.
  const listingPages = await withTimeout(fetchListingPages(), [] as MetadataRoute.Sitemap, 'mls-listings', 90_000);

  // Fetch off-market listings
  let offMarketPages: MetadataRoute.Sitemap = [];
  try {
    const offMarketListings = await getOffMarketListings();
    offMarketPages = offMarketListings.map((listing) => ({
      url: `${baseUrl}/off-market/${listing.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching off-market listings for sitemap:', error);
  }

  return [
    ...staticPages,
    ...singletonPages,
    ...communityPages,
    ...marketReportPages,
    ...magazinePages,
    ...postPages,
    ...partnerPages,
    ...teamMemberPages,
    ...videoPages,
    ...propertyTypeCityPages,
    ...marketLeaderListingsIndex,
    ...marketLeaderListingPages,
    ...listingPages,
    ...offMarketPages,
  ];
}
