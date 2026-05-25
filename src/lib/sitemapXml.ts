import { getSettings } from '@/lib/settings';

// Shared helpers for the manually-rendered sitemap routes. We left
// Next.js's `generateSitemaps()` metadata-file pattern behind because
// it can't auto-generate the /sitemap.xml index when sub-sitemaps use
// `force-dynamic`, and it silently passes the sub-sitemap id as a
// string at runtime even though the type says number. Owning the XML
// directly is less magic and easier to debug.

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapIndexEntry {
  url: string;
  lastModified?: Date | string;
}

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoString(d: Date | string | undefined): string | undefined {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const items = entries.map((e) => {
    const lines = [`  <url>`, `    <loc>${xmlEscape(e.url)}</loc>`];
    const lastmod = toIsoString(e.lastModified);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    if (e.changeFrequency) lines.push(`    <changefreq>${e.changeFrequency}</changefreq>`);
    if (e.priority !== undefined) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push(`  </url>`);
    return lines.join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function renderSitemapIndex(entries: SitemapIndexEntry[]): string {
  const items = entries.map((e) => {
    const lines = [`  <sitemap>`, `    <loc>${xmlEscape(e.url)}</loc>`];
    const lastmod = toIsoString(e.lastModified);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`  </sitemap>`);
    return lines.join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

export function xmlResponse(body: string, cacheSeconds = 3600): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}

// Cap any single slow data source so one outage / runaway query
// can't poison a sub-sitemap on cache miss.
export function withTimeout<T>(p: Promise<T>, fallback: T, label: string, timeoutMs = 45_000): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((resolve) =>
      setTimeout(() => {
        console.warn(`[sitemap] ${label} timed out after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs)
    ),
  ]);
}

export async function getSiteBaseUrl(): Promise<string> {
  const settings = await getSettings();
  return process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://example.com';
}
