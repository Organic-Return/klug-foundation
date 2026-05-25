import { getSiteBaseUrl, renderSitemapIndex, xmlResponse } from '@/lib/sitemapXml';

// Sitemap index — tiny, hardcoded, instant. Crawlers always get a
// fast response here and follow the four sub-sitemaps independently.
export const dynamic = 'force-dynamic';

const SUB_SITEMAPS = [
  'sitemap-static.xml',
  'sitemap-content.xml',
  'sitemap-listings.xml',
  'sitemap-partners.xml',
] as const;

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const now = new Date();
  const xml = renderSitemapIndex(
    SUB_SITEMAPS.map((path) => ({ url: `${baseUrl}/${path}`, lastModified: now }))
  );
  return xmlResponse(xml);
}
