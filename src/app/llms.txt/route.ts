import { unstable_cache } from 'next/cache';
import { client } from '@/sanity/client';
import { getSettings } from '@/lib/settings';

// llms.txt — curated guide for LLMs/AI search engines.
// Spec: https://llmstxt.org. Renders at /llms.txt as text/plain
// markdown. Latest market reports are pulled from Sanity so the
// list stays fresh without anyone hand-editing a static file;
// everything else is curated by hand because the hub-page set
// is small and stable.

export const dynamic = 'force-dynamic';

const MARKET_REPORTS_QUERY = `*[_type == "publication" && publicationType == "market-report"] | order(coalesce(publishedAt, _updatedAt) desc)[0...8]{
  title,
  "slug": slug.current,
  publishedAt,
  _updatedAt
}`;

interface MarketReport {
  title?: string;
  slug: string;
  publishedAt?: string;
  _updatedAt?: string;
}

const getLatestMarketReports = unstable_cache(
  async (): Promise<MarketReport[]> => {
    try {
      return await client.fetch<MarketReport[]>(MARKET_REPORTS_QUERY);
    } catch (err) {
      console.error('[llms.txt] market reports fetch failed:', err);
      return [];
    }
  },
  ['llms-txt-market-reports-v1'],
  { revalidate: 3600, tags: ['llms-txt'] }
);

function formatReportLink(baseUrl: string, report: MarketReport): string {
  const url = `${baseUrl}/aspen-snowmass-market-reports/${report.slug}`;
  const label = report.title?.trim() || report.slug;
  return `- [${label}](${url})`;
}

export async function GET(): Promise<Response> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://klug-foundation.vercel.app';
  const reports = await getLatestMarketReports();

  const reportLines = reports.length > 0
    ? reports.map((r) => formatReportLink(baseUrl, r)).join('\n')
    : `- [All market reports](${baseUrl}/aspen-snowmass-market-reports)`;

  const body = `# Klug Properties

> Luxury real estate in Aspen, Snowmass Village, and the Roaring Fork Valley, led by three-time Olympic medalist Chris Klug. Part of Aspen Snowmass Sotheby's International Realty.

Family-run brokerage with over 25 years of combined experience and $1B+ in career sales. Coverage spans Aspen, Snowmass Village, Basalt, Carbondale, Glenwood Springs, and the surrounding Colorado mountain region. The site publishes the full MLS inventory for the area, off-market and exclusive listings, quarterly market analysis, and editorial coverage of the Roaring Fork Valley.

## Core pages

- [Home](${baseUrl}/): Site overview and featured content.
- [About Klug Properties](${baseUrl}/about): Brokerage background and story.
- [Our team](${baseUrl}/about/our-team): Licensed brokers and staff.
- [Why Klug Properties](${baseUrl}/why-klug-properties): Track record and approach.
- [Contact us](${baseUrl}/contact-us): Phone, email, and contact form.

## Listings

- [All properties for sale](${baseUrl}/real-estate-for-sale): Full MLS inventory across the Roaring Fork Valley, updated continuously.
- [Off-market listings](${baseUrl}/off-market): Private inventory not on the public MLS (registration required).
- [Exclusive and new](${baseUrl}/exclusive-and-new): Klug-exclusive listings plus the freshest single-family homes hitting the Aspen market.
- [Open houses](${baseUrl}/open-houses): Upcoming open houses across the valley.
- [Sold by Klug Properties](${baseUrl}/sold-by-klug-properties): Recent sales record.

## Property types

- [Rentals](${baseUrl}/rentals): Long-term and seasonal residential rentals.
- [Commercial real estate](${baseUrl}/commercial): Commercial, multi-family, and income properties.
- [Land for sale](${baseUrl}/land): Vacant lots, ranches, and acreage across the Roaring Fork Valley.

## Buyers and sellers

- [Buying](${baseUrl}/buy): Buyer resources and process overview.
- [Relocation](${baseUrl}/buy/relocation): Moving to the Roaring Fork Valley.
- [First-time buyers](${baseUrl}/buy/first-time-buyers): Resources for first-time purchasers.
- [Selling](${baseUrl}/sell): Seller resources and listing process.

## Market intelligence

- [Aspen Snowmass market reports](${baseUrl}/aspen-snowmass-market-reports): Quarterly real estate analysis from Chris Klug with pricing trends, inventory data, and neighborhood insights.

Most recent reports:
${reportLines}

## Affiliated partners

- [Affiliated partners](${baseUrl}/about/partners): Network of trusted partner agents.
- [Market leaders](${baseUrl}/affiliated-partners/market-leaders): Partner brokerages and their inventory.
- [Ski town partners](${baseUrl}/about/ski-town-partners): Sotheby's affiliates in other ski destinations.

## Optional

- [Living Aspen magazine](${baseUrl}/media/living-aspen-magazine): Lifestyle publication covering the Aspen and Snowmass area.
- [In the news](${baseUrl}/in-the-news): Media coverage of Klug Properties.
- [Testimonials](${baseUrl}/about/testimonials): Client testimonials.
- [Blog](${baseUrl}/about/blog): Editorial posts on the local market and lifestyle.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
