import {
  getSiteBaseUrl,
  renderUrlset,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';

// Static hub pages — no remote data, no cache needed.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const now = new Date();

  const entries: SitemapEntry[] = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/real-estate-for-sale`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/off-market`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/aspen-snowmass-market-reports`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/media/living-aspen-magazine`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/why-klug-properties`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/affiliated-partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/affiliated-partners/market-leaders`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/affiliated-partners/ski-town`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/media/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/about/our-team`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/in-the-news`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/exclusive-and-new`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sold-by-klug-properties`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/open-houses`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/buy/first-time-buyers`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/buy/relocation`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/contact-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/rentals`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/commercial`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/land`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  ];

  return xmlResponse(renderUrlset(entries));
}
