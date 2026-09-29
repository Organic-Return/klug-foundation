import {
  getSiteBaseUrl,
  renderUrlset,
  withTimeout,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';
import { client } from '@/sanity/client';

// The buyer guides render only when their singleton documents exist in
// Sanity; listing them unconditionally put two 404s in the sitemap.
const GUIDES_QUERY = `{
  "firstTimeBuyers": count(*[_type == "firstTimeBuyersPage"]) > 0,
  "relocation": count(*[_type == "relocationPage"]) > 0
}`;

// Static hub pages — no remote data, no cache needed.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const [baseUrl, guides] = await Promise.all([
    getSiteBaseUrl(),
    withTimeout(
      client.fetch<{ firstTimeBuyers: boolean; relocation: boolean }>(GUIDES_QUERY, {}, { next: { revalidate: 3600 } }),
      { firstTimeBuyers: false, relocation: false },
      'sitemap-static guides'
    ),
  ]);
  const now = new Date();

  const entries: SitemapEntry[] = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/real-estate-for-sale`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/off-market`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/aspen-snowmass-market-reports`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/media/living-aspen-magazine`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/why-klug-properties`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/affiliated-partners/market-leaders`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/about/ski-town-partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/media/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/about/our-team`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/in-the-news`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/exclusive-and-new`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sold-by-klug-properties`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/open-houses`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ...(guides.firstTimeBuyers
      ? [{ url: `${baseUrl}/buy/first-time-buyers`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }]
      : []),
    ...(guides.relocation
      ? [{ url: `${baseUrl}/buy/relocation`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }]
      : []),
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/contact-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/condos`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/rentals`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/commercial`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/land`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  ];

  return xmlResponse(renderUrlset(entries));
}
