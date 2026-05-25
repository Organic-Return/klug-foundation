import { unstable_cache } from 'next/cache';
import { client } from '@/sanity/client';
import { getOffMarketListings } from '@/lib/offMarketListings';
import { getYouTubeCredentials } from '@/lib/settings';
import {
  getSiteBaseUrl,
  renderUrlset,
  withTimeout,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';

// Sanity-driven content + YouTube + off-market listings.
export const dynamic = 'force-dynamic';

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

const buildEntries = unstable_cache(
  async (baseUrl: string): Promise<SitemapEntry[]> => {
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

    const out: SitemapEntry[] = [];

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
      out.push({ url: `${baseUrl}/about/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
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
        url: `${baseUrl}/aspen-snowmass-market-reports/${report.slug}`,
        lastModified: new Date(report._updatedAt || report.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    for (const magazine of magazines) {
      out.push({
        url: `${baseUrl}/media/living-aspen-magazine/${magazine.slug}`,
        lastModified: new Date(magazine._updatedAt || magazine.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
    for (const post of posts) {
      out.push({
        url: `${baseUrl}/about/blog/${post.slug}`,
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
        url: `${baseUrl}/media/videos/${video.videoId}`,
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
  ['sitemap-content-v2'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap-content'] }
);

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const entries = await buildEntries(baseUrl);
  return xmlResponse(renderUrlset(entries));
}
