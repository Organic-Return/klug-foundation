/**
 * Writes the business facts that used to be hardcoded in the home page's
 * structured data into Sanity site settings (settings.business), so the
 * sitewide RealEstateAgent node keeps its address, map position, service
 * area and price range after the schema refactor.
 *
 * Idempotent: only fills fields that are empty. Nothing is overwritten.
 *
 *   SANITY_API_TOKEN=... NEXT_PUBLIC_SANITY_PROJECT_ID=ujo0cv7k \
 *     node scripts/seed-business-settings.mjs [--dry-run] [--agent-slug chris-klug]
 *
 * Pass the tenant's values on the command line or edit DEFAULTS below before
 * running it for another site. Review the output of --dry-run first.
 */
import { createClient } from '@sanity/client';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

// Values that today live in src/app/page.tsx (Klug). Adjust per tenant.
const DEFAULTS = {
  office: {
    street: opt('street', '415 East Hyman Avenue'),
    city: opt('city', 'Aspen'),
    state: opt('state', 'CO'),
    postalCode: opt('zip', '81611'),
    country: 'US',
    lat: Number(opt('lat', '39.1911')),
    lng: Number(opt('lng', '-106.8175')),
  },
  priceRange: opt('price-range', '$$$$'),
  areaServed: [
    'Aspen, CO',
    'Snowmass Village, CO',
    'Snowmass, CO',
    'Basalt, CO',
    'Carbondale, CO',
    'El Jebel, CO',
    'Woody Creek, CO',
    'Old Snowmass, CO',
    'Glenwood Springs, CO',
    'Marble, CO',
    'Redstone, CO',
    'Roaring Fork Valley, Colorado',
  ],
  services: [
    { _key: 'luxury-sales', serviceType: 'Luxury home sales' },
    { _key: 'buyer-rep', serviceType: 'Buyer representation' },
    { _key: 'seller-rep', serviceType: 'Seller representation' },
    { _key: 'relocation', serviceType: 'Relocation' },
  ],
  agentSlug: opt('agent-slug', 'chris-klug'),
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN;
if (!projectId || !token) {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN');
  process.exit(2);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });

const settings = await client.fetch(`*[_type == "settings" && _id == "settings"][0]{ _id, business }`);
if (!settings) {
  console.error('No settings document found');
  process.exit(1);
}
const agent = await client.fetch(`*[_type == "teamMember" && slug.current == $slug && !(_id in path("drafts.**"))][0]{ _id, name }`, {
  slug: DEFAULTS.agentSlug,
});

const business = settings.business || {};
const patch = {};
if (!business.office?.street) patch['business.office'] = DEFAULTS.office;
if (!business.priceRange) patch['business.priceRange'] = DEFAULTS.priceRange;
if (!business.areaServed?.length) patch['business.areaServed'] = DEFAULTS.areaServed;
if (!business.services?.length) patch['business.services'] = DEFAULTS.services;
if (!business.primaryAgent && agent) patch['business.primaryAgent'] = { _type: 'reference', _ref: agent._id };

console.log('Project', projectId, dataset);
console.log('Primary agent:', agent ? `${agent.name} (${agent._id})` : `none found for slug "${DEFAULTS.agentSlug}"`);
console.log('Fields to set:', Object.keys(patch).length ? Object.keys(patch).join(', ') : 'none (already populated)');
if (dryRun || Object.keys(patch).length === 0) {
  console.log(JSON.stringify(patch, null, 2));
  process.exit(0);
}
const result = await client.patch('settings').setIfMissing({ business: {} }).set(patch).commit();
console.log('Updated settings', result._rev);
