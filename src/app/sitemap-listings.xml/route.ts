import { unstable_cache } from 'next/cache';
import { getListingsForSitemap, getListingHref, getDistinctCities } from '@/lib/listings';
import {
  getSiteBaseUrl,
  renderUrlset,
  withTimeout,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';

// MLS listing detail pages + per-city property-type hubs. Uses a
// sitemap-specific query that only fetches what getListingHref() needs
// (~6 columns instead of full row) — cuts cold-start from 17–30s down
// to a couple seconds, well within crawler timeout windows.
export const dynamic = 'force-dynamic';

const buildEntries = unstable_cache(
  async (baseUrl: string): Promise<SitemapEntry[]> => {
    const fetchListingEntries = async (): Promise<SitemapEntry[]> => {
      const out: SitemapEntry[] = [];
      try {
        const rows = await getListingsForSitemap();
        const seen = new Set<string>();
        for (const row of rows) {
          const href = getListingHref(row);
          if (seen.has(href)) continue;
          seen.add(href);
          out.push({
            url: `${baseUrl}${href}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      } catch (error) {
        console.error('[sitemap] error fetching MLS listings:', error);
      }
      return out;
    };

    const [listingEntries, distinctCities] = await Promise.all([
      withTimeout(fetchListingEntries(), [] as SitemapEntry[], 'mls-listings', 90_000),
      withTimeout(getDistinctCities(), [] as string[], 'cities'),
    ]);

    // Property-type × city sub-hubs: /rentals/<city>, /commercial/<city>, /land/<city>
    const citySlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
    const cityHubs: SitemapEntry[] = [];
    for (const c of distinctCities) {
      const slug = citySlug(c);
      if (!slug) continue;
      for (const t of ['rentals', 'commercial', 'land'] as const) {
        cityHubs.push({
          url: `${baseUrl}/${t}/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.6,
        });
      }
    }

    return [...listingEntries, ...cityHubs];
  },
  ['sitemap-listings-v3'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap-listings'] }
);

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const entries = await buildEntries(baseUrl);
  return xmlResponse(renderUrlset(entries));
}
