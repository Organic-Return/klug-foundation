// Rewrite stored URLs in Sanity to match the new Klug-branded paths.
// Targets: navigation, homepage CTAs, per-page ctaButtonHref/Link,
// resources page url arrays, and any PortableText link annotations.
//
// Run: SANITY_API_TOKEN=xxx node scripts/patch-url-migration.mjs

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

if (!process.env.SANITY_API_TOKEN) {
  console.error('SANITY_API_TOKEN env var is required.');
  process.exit(1);
}

// Map of old path → new path. Order matters: longest prefix first so
// `/affiliated-partners/ski-town` is rewritten before `/affiliated-partners`.
const RENAMES = [
  ['/affiliated-partners/ski-town', '/about/ski-town-partners'],
  ['/affiliated-partners', '/about/partners'],
  ['/privacy-policy', '/privacy'],
  ['/testimonials', '/about/testimonials'],
  ['/why-klug-properties', '/about/why-klug-properties'],
  ['/videos', '/media/videos'],
  ['/living-aspen', '/media/living-aspen-magazine'],
  ['/market-reports', '/aspen-snowmass-market-reports'],
  ['/blog', '/about/blog'],
  ['/team', '/about/our-team'],
  ['/listings', '/real-estate-for-sale'],
];

function rewrite(url) {
  if (typeof url !== 'string' || !url.startsWith('/')) return url;
  for (const [from, to] of RENAMES) {
    if (url === from || url.startsWith(from + '/') || url.startsWith(from + '?') || url.startsWith(from + '#')) {
      return to + url.slice(from.length);
    }
  }
  return url;
}

function rewriteDeep(value) {
  if (typeof value === 'string') return rewrite(value);
  if (Array.isArray(value)) return value.map(rewriteDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = rewriteDeep(v);
    return out;
  }
  return value;
}

// Pull every document of these types and rewrite any string value that
// looks like an internal link.
const TYPES = [
  'siteSettings',
  'navigation',
  'homepage',
  'teamPage',
  'blogPage',
  'inTheNewsPage',
  'livingAspenPage',
  'marketReportsPage',
  'testimonialsPage',
  'whyKlugPage',
  'affiliatedPartnersPage',
  'resourcesPage',
  'aboutPage',
  'buyPage',
  'sellPage',
];

let totalPatched = 0;

for (const type of TYPES) {
  const docs = await client.fetch(`*[_type == $type]`, { type });
  for (const doc of docs) {
    const next = rewriteDeep(doc);
    if (JSON.stringify(next) === JSON.stringify(doc)) continue;
    const { _id, _type, _rev, _createdAt, _updatedAt, ...patch } = next;
    await client.patch(_id).set(patch).commit();
    console.log(`Patched ${_type} (${_id})`);
    totalPatched++;
  }
}

console.log(`\nDone. Patched ${totalPatched} document(s).`);
