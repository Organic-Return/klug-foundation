/**
 * Fetches a set of pages for one domain, extracts every JSON-LD block from
 * the raw HTML (no JavaScript is run) and reports the @types found on each
 * page plus anything that looks wrong: invalid JSON, relative or preview
 * URLs, empty values, dangling @id references, Product, AggregateRating.
 *
 *   npx tsx scripts/check-schema.ts https://www.klugproperties.com
 *   npx tsx scripts/check-schema.ts http://localhost:3000 --paths /,/sell
 *   npx tsx scripts/check-schema.ts http://localhost:3000 --tenant skk
 *
 * With no --paths, a default list per tenant is used. --tenant defaults to
 * "klug" unless the domain contains "skk". Exit code 1 when any page errors.
 */

type JsonNode = Record<string, unknown>;

const DEFAULT_PATHS: Record<string, string[]> = {
  klug: [
    '/',
    '/real-estate-for-sale',
    '/real-estate-for-sale/LISTING',
    '/communities/aspen',
    '/about/blog',
    '/about/blog/POST',
    '/real-estate-agent/AGENT',
    '/about/testimonials',
    '/media/living-aspen-magazine/MAGAZINE',
    '/media/videos/VIDEO',
    '/in-the-news/PRESS',
    '/aspen-snowmass-market-reports/REPORT',
    '/sell',
    '/buy',
    '/contact-us',
    '/about',
  ],
  skk: [
    '/',
    '/listings',
    '/listings/LISTING',
    '/communities/COMMUNITY',
    '/blog',
    '/POST',
    '/team/AGENT',
    '/about/stacey-k-kelly',
    '/testimonials',
    '/living-aspen/MAGAZINE',
    '/market-reports/REPORT',
    '/sell',
    '/buy',
    '/contact-us',
    '/about',
  ],
};

const args = process.argv.slice(2);
const siteOrigin = (args.find((a) => /^https?:\/\//.test(a)) || '').replace(/\/+$/, '');
if (!siteOrigin) {
  console.error('Usage: tsx scripts/check-schema.ts <origin> [--paths /a,/b] [--tenant klug|skk]');
  process.exit(2);
}
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const tenant = opt('tenant') || (/skk/i.test(siteOrigin) ? 'skk' : 'klug');
const explicitPaths = opt('paths')?.split(',').map((p) => p.trim()).filter(Boolean);

/** Resolves placeholders like /about/blog/POST by reading the index page's first matching link. */
async function resolvePlaceholder(path: string): Promise<string | null> {
  const match = path.match(/^(.*)\/([A-Z]+)$/);
  if (!match) return path;
  const [, prefix, kind] = match;
  const indexPaths: Record<string, string[]> = {
    LISTING: tenant === 'skk' ? ['/listings', '/exclusive-listings'] : ['/real-estate-for-sale'],
    COMMUNITY: ['/communities', '/'],
    POST: tenant === 'skk' ? ['/blog'] : ['/about/blog'],
    AGENT: tenant === 'skk' ? ['/team', '/agents'] : ['/about/our-team', '/agents'],
    MAGAZINE: tenant === 'skk' ? ['/living-aspen'] : ['/media/living-aspen-magazine'],
    VIDEO: ['/media/videos', '/videos'],
    PRESS: ['/in-the-news'],
    REPORT: tenant === 'skk' ? ['/market-reports'] : ['/aspen-snowmass-market-reports'],
  };
  const linkPrefix = prefix === '' ? '/' : `${prefix}/`;
  for (const indexPath of indexPaths[kind] || []) {
    const html = await fetchHtml(indexPath).catch(() => '');
    const re = new RegExp(`href="(${linkPrefix.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[^"#?]+)"`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const href = m[1];
      // Skip assets, API routes and anything with a file extension
      if (/^\/(_next|api)\//.test(href) || /\.[a-z0-9]{2,5}$/i.test(href)) continue;
      // Skip index-like links (e.g. /blog/page/2) and other sections
      if (kind === 'POST' && tenant === 'skk' && /^\/(about|blog|agents|listings|communities|sell|buy|team|market-reports|living-aspen|videos|testimonials|contact-us|off-market|resources|builders|sold|privacy-policy|why-klug-properties|exclusive-listings|open-houses|saved-properties|local-guide|affiliated-partners)(\/|$)/.test(href)) continue;
      if (/\/page\/\d+/.test(href)) continue;
      return href;
    }
  }
  return null;
}

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${siteOrigin}${path}`, { headers: { 'user-agent': 'schema-check/1.0', accept: 'text/html' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractJsonLd(html: string): Array<{ raw: string; data?: unknown; error?: string }> {
  const out: Array<{ raw: string; data?: unknown; error?: string }> = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      out.push({ raw, data: JSON.parse(raw) });
    } catch (e) {
      out.push({ raw, error: `invalid JSON: ${(e as Error).message}` });
    }
  }
  return out;
}

function nodesOf(data: unknown): JsonNode[] {
  if (Array.isArray(data)) return data.flatMap(nodesOf);
  if (data && typeof data === 'object') {
    const obj = data as JsonNode;
    if (Array.isArray(obj['@graph'])) return (obj['@graph'] as JsonNode[]);
    return [obj];
  }
  return [];
}

function walk(value: unknown, visit: (v: unknown, path: string) => void, path = '') {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, visit, `${path}[${i}]`));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value as JsonNode)) walk(v, visit, `${path}.${k}`);
}

function typeName(t: unknown): string {
  return Array.isArray(t) ? t.join('+') : String(t);
}

async function checkPage(path: string) {
  const errors: string[] = [];
  let html = '';
  try {
    html = await fetchHtml(path);
  } catch (e) {
    return { path, types: [] as string[], scripts: 0, errors: [`fetch failed: ${(e as Error).message}`] };
  }
  const blocks = extractJsonLd(html);
  const allNodes: JsonNode[] = [];
  for (const block of blocks) {
    if (block.error) {
      errors.push(block.error);
      continue;
    }
    allNodes.push(...nodesOf(block.data));
    if (/<\/script/i.test(block.raw)) errors.push('unescaped </script inside JSON-LD');
  }
  const defined = new Set(allNodes.map((n) => n['@id']).filter((id): id is string => typeof id === 'string'));
  const types: string[] = [];
  for (const node of allNodes) {
    types.push(typeName(node['@type']));
    walk(node, (v, p) => {
      if (v === null || v === '') errors.push(`empty value at ${p}`);
      if (Array.isArray(v) && v.length === 0) errors.push(`empty array at ${p}`);
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) errors.push(`empty object at ${p}`);
      if (typeof v === 'string' && /vercel\.app/i.test(v)) errors.push(`preview domain at ${p}: ${v}`);
      if (typeof v === 'string' && /^\/(?!\/)/.test(v) && /(url|@id|item|image|logo|contentUrl|embedUrl|thumbnailUrl)$/i.test(p.split('.').pop() || '')) errors.push(`relative URL at ${p}: ${v}`);
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const keys = Object.keys(v as object);
        if (keys.length === 1 && keys[0] === '@id') {
          const id = (v as { '@id': string })['@id'];
          if (!defined.has(id)) errors.push(`dangling reference ${id} at ${p}`);
        }
        const t = (v as JsonNode)['@type'];
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) errors.push(`Product at ${p}`);
        if (t === 'AggregateRating') errors.push(`AggregateRating at ${p}`);
      }
    });
  }
  if (blocks.length === 0) errors.push('no JSON-LD found');
  const hasOg = /<meta[^>]+property=["']og:image["']/i.test(html);
  return { path, types, scripts: blocks.length, errors: [...new Set(errors)], hasOg };
}

(async () => {
  const paths: string[] = [];
  for (const p of explicitPaths || DEFAULT_PATHS[tenant] || DEFAULT_PATHS.klug) {
    const resolved = await resolvePlaceholder(p);
    if (resolved) paths.push(resolved);
    else console.log(`(skipped ${p}: no example link found)`);
  }
  let failed = 0;
  for (const path of paths) {
    const r = await checkPage(path);
    const counts = r.types.reduce<Record<string, number>>((acc, t) => ((acc[t] = (acc[t] || 0) + 1), acc), {});
    const summary = Object.entries(counts).map(([t, n]) => (n > 1 ? `${t}×${n}` : t)).join(', ');
    const status = r.errors.length ? 'FAIL' : 'ok';
    if (r.errors.length) failed++;
    console.log(`${status.padEnd(4)} ${path}  [${r.scripts} script${r.scripts === 1 ? '' : 's'}${r.hasOg === false ? ', no og:image' : ''}]`);
    console.log(`     ${summary || '(none)'}`);
    for (const e of r.errors.slice(0, 12)) console.log(`     ! ${e}`);
    if (r.errors.length > 12) console.log(`     ! …and ${r.errors.length - 12} more`);
  }
  console.log(`\n${paths.length - failed}/${paths.length} pages clean`);
  process.exit(failed ? 1 : 0);
})();
