import { MetadataRoute } from 'next';
import { client } from '@/sanity/client';
import { getListings, getListingHref, toAddressSlug } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';
import { getSettings, getYouTubeCredentials } from '@/lib/settings';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';

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
  const slugs = new Set<string>();
  for (const p of partners) {
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    if (name.length < 3) continue;
    const parts = name.split(/\s+/);
    const pattern = `${parts[0]}%${parts[parts.length - 1]}`;
    // Page through everything attributed to this agent — active +
    // sold combined — so high-volume agents like Josh Behr don't
    // get their sold inventory cut off at an arbitrary limit.
    let from = 0;
    const PAGE = 1000;
    for (let pageIdx = 0; pageIdx < 5; pageIdx++) {
      const { data, error } = await supabase
        .from('realogy_listings')
        .select('street_address')
        .ilike('primary_agent_name', pattern)
        .eq('listing_type', 'ForSale')
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      for (const row of data as MarketLeaderRow[]) {
        if (!row.street_address) continue;
        const slug = toAddressSlug(row.street_address);
        if (slug) slugs.add(slug);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }
  return Array.from(slugs);
}

async function getYouTubeVideoIds(baseUrl: string): Promise<Array<{ videoId: string; publishedAt?: string }>> {
  const seen = new Map<string, { videoId: string; publishedAt?: string }>();

  // Source 1: YouTube uploads playlist (canonical, fresh data with
  // publishedAt timestamps, but capped at whatever the API exposes
  // right now — sometimes a subset of the channel's history).
  const { apiKey, channelId } = await getYouTubeCredentials();
  if (apiKey && channelId && channelId.startsWith('UC')) {
    const uploadsPlaylistId = 'UU' + channelId.slice(2);
    let pageToken: string | undefined;
    for (let page = 0; page < 10; page++) {
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
  }

  // Source 2: scrape the deployed /videos page for any IDs the
  // page is actually rendering. The /videos page caches API results
  // in Vercel's persistent fetch cache, so its current view of the
  // channel can be richer than a fresh API call. Whatever it shows,
  // the sitemap should mirror — every visible card needs a sitemap
  // entry. Falls through silently if the fetch fails.
  try {
    const res = await fetch(`${baseUrl}/videos`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const html = await res.text();
      const matches = html.matchAll(/href="\/videos\/([a-zA-Z0-9_-]{6,})"/g);
      for (const m of matches) {
        const vid = m[1];
        if (!seen.has(vid)) seen.set(vid, { videoId: vid });
      }
    }
  } catch {
    // ignore — API source above still fills the map
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
  ];

  // Fetch dynamic content from Sanity + YouTube
  const [communities, marketReports, magazines, posts, partners, teamMembers, buyPage, sellPage, aboutPage, resourcesPage, youtubeVideos, marketLeaderListingSlugs] = await Promise.all([
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
    getYouTubeVideoIds(baseUrl).catch(() => [] as Array<{ videoId: string; publishedAt?: string }>),
    getMarketLeaderListingSlugs().catch(() => [] as string[]),
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
  // historical pricing) so we no longer exclude them.
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const PAGE_SIZE = 1000;
    const seen = new Set<string>();
    for (let page = 1; page <= 20; page++) {
      const { listings, totalPages } = await getListings(page, PAGE_SIZE);
      if (!listings || listings.length === 0) break;
      for (const listing of listings) {
        const href = getListingHref(listing);
        if (seen.has(href)) continue;
        seen.add(href);
        listingPages.push({
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
    ...marketLeaderListingsIndex,
    ...marketLeaderListingPages,
    ...listingPages,
    ...offMarketPages,
  ];
}
