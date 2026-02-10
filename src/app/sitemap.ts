import { MetadataRoute } from 'next';
import { client } from '@/sanity/client';
import { getListings } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

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
  ];

  // Fetch dynamic content from Sanity
  const [communities, marketReports, magazines, posts, partners] = await Promise.all([
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(COMMUNITIES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MARKET_REPORTS_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MAGAZINES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(POSTS_QUERY),
    client.fetch<Array<{ slug: string; partnerType: string; firstName: string; lastName: string; _updatedAt: string }>>(PARTNERS_QUERY),
  ]);

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

  // Fetch MLS listings (limit to recent/active for performance)
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const { listings } = await getListings(1, 500, { excludedStatuses: ['Closed'] });
    listingPages = listings.map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
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
    ...communityPages,
    ...marketReportPages,
    ...magazinePages,
    ...postPages,
    ...partnerPages,
    ...listingPages,
    ...offMarketPages,
  ];
}
