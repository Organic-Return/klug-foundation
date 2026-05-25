import { unstable_cache } from 'next/cache';
import { client } from '@/sanity/client';
import { toAddressSlug } from '@/lib/listings';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';
import {
  getSiteBaseUrl,
  renderUrlset,
  withTimeout,
  xmlResponse,
  type SitemapEntry,
} from '@/lib/sitemapXml';

// Realogy-backed market-leader listing detail pages.
export const dynamic = 'force-dynamic';

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

const buildEntries = unstable_cache(
  async (baseUrl: string): Promise<SitemapEntry[]> => {
    const slugs = await withTimeout(
      getMarketLeaderListingSlugs(),
      [] as string[],
      'partner-listings'
    );

    const out: SitemapEntry[] = [
      {
        url: `${baseUrl}/affiliated-partners/market-leaders/listings`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
      },
    ];
    for (const slug of slugs) {
      out.push({
        url: `${baseUrl}/affiliated-partners/market-leaders/listings/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
      });
    }
    return out;
  },
  ['sitemap-partners-v2'],
  { revalidate: 3600, tags: ['sitemap', 'sitemap-partners'] }
);

export async function GET(): Promise<Response> {
  const baseUrl = await getSiteBaseUrl();
  const entries = await buildEntries(baseUrl);
  return xmlResponse(renderUrlset(entries));
}
