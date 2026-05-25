import { unstable_cache } from 'next/cache';
import { getListings, getListingHref, getDistinctCities } from '@/lib/listings';
import {
  getSiteBaseUrl,
  renderUrlset,
  withTimeout,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';

// MLS listing detail pages + per-city property-type hubs. Heaviest
// source — up to 5 × 1000 = 5k listings paginated from the MLS feed.
export const dynamic = 'force-dynamic';

const buildEntries = unstable_cache(
  async (baseUrl: string): Promise<SitemapEntry[]> => {
    const fetchListingEntries = async (): Promise<SitemapEntry[]> => {
      const out: SitemapEntry[] = [];
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
  ['sitemap-listings-v2'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap-listings'] }
);

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const entries = await buildEntries(baseUrl);
  return xmlResponse(renderUrlset(entries));
}
