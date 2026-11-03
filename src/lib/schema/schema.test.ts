import { describe, it, expect } from 'vitest';
import { buildGraph, compact, serializeJsonLd } from './graph';
import { ids, absoluteUrl, normalizeBaseUrl } from './ids';
import { toPlainText, truncate, temporalCoverage, isoDate } from './text';
import { brandName, resolveBaseUrl, parseFreeTextAddress, type Tenant } from './tenant';
import {
  organizationNode,
  agentNode,
  websiteNode,
  siteNodes,
  webPageNode,
  breadcrumbNode,
  faqNode,
  articleNode,
  videoNode,
  reviewNode,
  personNode,
  placeNode,
  serviceNode,
  reportNode,
  collectionPageNodes,
  listingNodes,
  accommodationType,
  listingAvailability,
} from './nodes';

const tenant: Tenant = {
  baseUrl: 'https://www.example-agent.com',
  name: 'Example Agent Properties',
  siteTitle: 'Mountain Real Estate | Example Agent Properties',
  description: 'Homes in the mountains.',
  logoUrl: 'https://cdn.example.com/logo.png',
  imageUrl: 'https://cdn.example.com/hero.jpg',
  phone: '+1 555 0100',
  email: 'hello@example-agent.com',
  address: { street: '1 Main St', city: 'Aspen', state: 'CO', postalCode: '81611', country: 'US' },
  geo: { lat: 39.19, lng: -106.82 },
  priceRange: '$$$$',
  areaServed: ['Aspen, CO', 'Roaring Fork Valley'],
  sameAs: ['https://instagram.com/example'],
  brokerage: { name: 'Example Brokerage', url: 'https://brokerage.example.com' },
  services: [{ serviceType: 'Buyer representation' }],
  faqs: [],
  agent: {
    name: 'Jane Example',
    slug: 'jane-example',
    url: 'https://www.example-agent.com/real-estate-agent/jane-example',
    jobTitle: 'Broker Associate',
    bio: 'Jane sells homes.',
    imageUrl: 'https://cdn.example.com/jane.jpg',
    phone: '+1 555 0101',
    email: 'jane@example-agent.com',
    sameAs: ['https://linkedin.com/in/jane'],
    knowsAbout: ['Luxury homes'],
    credentials: [
      { type: 'membership', name: 'Masters Circle', issuer: 'Example Brokerage', url: 'https://brokerage.example.com/masters' },
      { type: 'award', name: 'Top Producer', year: 2025 },
      { type: 'license', name: 'Colorado Real Estate Broker', issuer: 'Colorado DORA' },
    ],
  },
  searchPath: '/real-estate-for-sale',
  agentProfilePath: (slug: string) => `/real-estate-agent/${slug}`,
};

/** Every string under the given key in the whole graph. */
function collect(value: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(value)) value.forEach((v) => collect(v, key, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === key) out.push(v);
      collect(v, key, out);
    }
  }
  return out;
}

function walk(value: unknown, visit: (v: unknown, path: string) => void, path = '') {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, visit, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, visit, `${path}.${k}`);
  }
}

function fullGraph() {
  const pageUrl = `${tenant.baseUrl}/communities/aspen`;
  const listingUrl = `${tenant.baseUrl}/real-estate-for-sale/123-main-st-aspen-co-81611-ABC123`;
  return buildGraph([
    siteNodes(tenant),
    webPageNode({ tenant, url: pageUrl, name: 'Aspen', hasBreadcrumb: true, mainEntityId: ids.mainEntity(pageUrl) }),
    webPageNode({ tenant, url: listingUrl, name: '123 Main St', type: 'ItemPage' }),
    webPageNode({ tenant, url: `${tenant.baseUrl}/about/blog/hello`, name: 'Hello' }),
    webPageNode({ tenant, url: `${tenant.baseUrl}/reports/q3`, name: 'Q3' }),
    breadcrumbNode(pageUrl, [
      { name: 'Home', url: `${tenant.baseUrl}/` },
      { name: 'Aspen', url: pageUrl },
    ]),
    placeNode({ url: pageUrl, name: 'Aspen', geo: { lat: 39.19, lng: -106.82 }, containedIn: ['Pitkin County', 'Colorado'] }),
    faqNode(pageUrl, [{ question: 'Is it snowy?', answer: 'Yes.' }]),
    reviewNode({ body: 'Great.', authorName: 'A Client', itemReviewedId: ids.organization(tenant.baseUrl), rating: 5 }),
    serviceNode({ serviceType: 'Buyer representation', providerId: ids.organization(tenant.baseUrl), areaServed: ['Aspen, CO'] }),
    listingNodes({
      url: listingUrl,
      name: '123 Main St',
      mlsNumber: 'ABC123',
      photos: ['https://cdn.example.com/1.jpg'],
      listPrice: 1000000,
      status: 'Active',
      propertyType: 'Single Family Residence',
      sellerId: ids.organization(tenant.baseUrl),
      video: {
        url: listingUrl,
        name: 'Tour',
        thumbnailUrl: 'https://image.mux.com/abc/thumbnail.jpg',
        uploadDate: '2026-01-01T00:00:00.000Z',
        contentUrl: 'https://stream.mux.com/abc.m3u8',
      },
    }),
    articleNode({
      type: 'BlogPosting',
      url: `${tenant.baseUrl}/about/blog/hello`,
      headline: 'Hello',
      datePublished: '2026-01-01',
      authorId: ids.agent(tenant.baseUrl),
      publisherId: ids.organization(tenant.baseUrl),
    }),
    reportNode({
      url: `${tenant.baseUrl}/reports/q3`,
      name: 'Q3',
      publisherId: ids.organization(tenant.baseUrl),
      authorId: ids.agent(tenant.baseUrl),
      aboutPlace: 'Aspen, CO',
      temporalCoverage: '2026-07/2026-09',
    }),
    breadcrumbNode(`${tenant.baseUrl}/about/blog`, [{ name: 'Home', url: `${tenant.baseUrl}/` }, { name: 'Blog', url: `${tenant.baseUrl}/about/blog` }]),
    collectionPageNodes({ tenant, url: `${tenant.baseUrl}/about/blog`, name: 'Blog', hasBreadcrumb: true, items: [{ url: `${tenant.baseUrl}/about/blog/hello`, name: 'Hello' }] }),
  ]);
}

describe('graph assembly', () => {
  it('produces valid JSON with one @context and a @graph', () => {
    const json = serializeJsonLd(fullGraph());
    const parsed = JSON.parse(json);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(Array.isArray(parsed['@graph'])).toBe(true);
    expect(parsed['@graph'].length).toBeGreaterThan(10);
  });

  it('escapes characters that could close the script element', () => {
    const json = serializeJsonLd(buildGraph([{ '@type': 'Thing', name: '</script><b>&amp;' }]));
    expect(json).not.toContain('</script>');
    expect(json).not.toContain('<');
    expect(json).not.toContain('>');
    expect(json).not.toContain('&');
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><b>&amp;');
  });

  it('never outputs empty strings, nulls, empty arrays or empty objects', () => {
    const graph = fullGraph();
    walk(graph, (v, path) => {
      if (path === '') return;
      expect(v, path).not.toBeNull();
      expect(v, path).not.toBeUndefined();
      if (typeof v === 'string') expect(v.trim().length, path).toBeGreaterThan(0);
      if (Array.isArray(v)) expect(v.length, path).toBeGreaterThan(0);
      if (v && typeof v === 'object' && !Array.isArray(v)) expect(Object.keys(v).length, path).toBeGreaterThan(0);
    });
  });

  it('compact strips empty values from nested structures', () => {
    expect(compact({ a: '', b: null, c: [], d: {}, e: { f: undefined }, g: 'x', h: 0, i: [null, 'y'] })).toEqual({ g: 'x', h: 0, i: ['y'] });
  });

  it('every URL and @id is absolute and on the tenant domain', () => {
    const graph = fullGraph();
    const urls = [...collect(graph, 'url'), ...collect(graph, '@id'), ...collect(graph, 'item')].flat();
    expect(urls.length).toBeGreaterThan(10);
    for (const u of urls) {
      if (typeof u !== 'string') continue;
      expect(u, u).toMatch(/^https:\/\//);
      if (u.includes('example-agent.com')) expect(u).not.toMatch(/vercel\.app/);
    }
  });

  it('every @id reference resolves to a node in the graph', () => {
    const graph = fullGraph();
    const defined = new Set(graph['@graph'].map((n) => n['@id']).filter(Boolean));
    const references: string[] = [];
    walk(graph, (v) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const keys = Object.keys(v as object);
        if (keys.length === 1 && keys[0] === '@id') references.push((v as { '@id': string })['@id']);
      }
    });
    expect(references.length).toBeGreaterThan(10);
    for (const id of references) expect(defined.has(id), `dangling reference ${id}`).toBe(true);
  });

  it('merges nodes that share an @id instead of duplicating them', () => {
    const graph = buildGraph([
      { '@type': 'Thing', '@id': 'https://x.com/#a', name: 'A' },
      { '@type': 'Thing', '@id': 'https://x.com/#a', description: 'More' },
    ]);
    expect(graph['@graph']).toHaveLength(1);
    expect(graph['@graph'][0]).toMatchObject({ name: 'A', description: 'More' });
  });

  it('contains no Product and no AggregateRating anywhere', () => {
    const types = collect(fullGraph(), '@type').flat();
    expect(types).not.toContain('Product');
    expect(types).not.toContain('AggregateRating');
  });
});

describe('ids', () => {
  it('builds the documented @id patterns', () => {
    expect(ids.organization('https://x.com/')).toBe('https://x.com/#organization');
    expect(ids.agent('https://x.com')).toBe('https://x.com/#agent');
    expect(ids.website('https://x.com')).toBe('https://x.com/#website');
    expect(ids.webpage('https://x.com/a/b')).toBe('https://x.com/a/b#webpage');
    expect(ids.breadcrumb('https://x.com/a/b')).toBe('https://x.com/a/b#breadcrumb');
  });
  it('normalises base URLs and joins paths', () => {
    expect(normalizeBaseUrl('https://x.com///')).toBe('https://x.com');
    expect(absoluteUrl('https://x.com/', '/a')).toBe('https://x.com/a');
    expect(absoluteUrl('https://x.com', 'a')).toBe('https://x.com/a');
    expect(absoluteUrl('https://x.com', '/')).toBe('https://x.com/');
    expect(absoluteUrl('https://x.com', 'https://y.com/z')).toBe('https://y.com/z');
  });
  it('refuses preview domains for the base URL', () => {
    const saved = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site-abc.vercel.app';
    expect(resolveBaseUrl('https://www.real.com/')).toBe('https://www.real.com');
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(resolveBaseUrl('https://www.real.com')).toBe('https://www.real.com');
    if (saved !== undefined) process.env.NEXT_PUBLIC_SITE_URL = saved;
  });
});

describe('sitewide nodes', () => {
  it('organization carries the tenant facts and links to the agent', () => {
    const org = organizationNode(tenant);
    expect(org['@type']).toBe('RealEstateAgent');
    expect(org['@id']).toBe('https://www.example-agent.com/#organization');
    expect(org.address).toMatchObject({ '@type': 'PostalAddress', streetAddress: '1 Main St', postalCode: '81611' });
    expect(org.geo).toMatchObject({ latitude: 39.19, longitude: -106.82 });
    expect(org.areaServed).toEqual([
      { '@type': 'City', name: 'Aspen, CO' },
      { '@type': 'Place', name: 'Roaring Fork Valley' },
    ]);
    expect(org.parentOrganization).toMatchObject({ name: 'Example Brokerage' });
    expect(org.founder).toEqual({ '@id': 'https://www.example-agent.com/#agent' });
  });

  it('agent is a Person with credentials mapped to memberOf, award and hasCredential', () => {
    const agent = agentNode(tenant)!;
    expect(agent['@type']).toBe('Person');
    expect(agent.worksFor).toEqual({ '@id': 'https://www.example-agent.com/#organization' });
    expect(agent.memberOf).toEqual([
      {
        '@type': 'ProgramMembership',
        name: 'Masters Circle',
        programName: 'Masters Circle',
        url: 'https://brokerage.example.com/masters',
        hostingOrganization: { '@type': 'Organization', name: 'Example Brokerage' },
      },
    ]);
    expect(agent.award).toEqual(['Top Producer (2025)']);
    expect(agent.hasCredential).toEqual([
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'license',
        name: 'Colorado Real Estate Broker',
        url: undefined,
        recognizedBy: { '@type': 'Organization', name: 'Colorado DORA' },
      },
    ]);
  });

  it('omits the agent node when the tenant has no primary agent', () => {
    expect(agentNode({ ...tenant, agent: null })).toBeUndefined();
    expect(siteNodes({ ...tenant, agent: null }).map((n) => n['@type'])).toEqual(['RealEstateAgent', 'WebSite']);
  });

  it('website publishes through the organization and keeps the search action', () => {
    const site = websiteNode(tenant);
    expect(site.publisher).toEqual({ '@id': 'https://www.example-agent.com/#organization' });
    expect((site.potentialAction as { target: { urlTemplate: string } }).target.urlTemplate).toBe(
      'https://www.example-agent.com/real-estate-for-sale?q={search_term_string}'
    );
  });

  it('parses a free-text office address', () => {
    expect(parseFreeTextAddress('Snowmass Village Office\n16 Kearns Road, Suite 110\nSnowmass Village, CO 81615')).toEqual({
      street: '16 Kearns Road, Suite 110',
      city: 'Snowmass Village',
      state: 'CO',
      postalCode: '81615',
      country: 'US',
    });
    expect(parseFreeTextAddress('415 East Hyman Avenue')).toEqual({ street: '415 East Hyman Avenue' });
    expect(parseFreeTextAddress('')).toBeNull();
  });

  it('webPage derives the website id from the page origin when no tenant is given', () => {
    expect(webPageNode({ url: 'https://x.com/a', name: 'A' }).isPartOf).toEqual({ '@id': 'https://x.com/#website' });
  });

  it('brandName takes the last segment of an SEO title', () => {
    expect(brandName('Aspen Real Estate | Example Agent')).toBe('Example Agent');
    expect(brandName('', 'Fallback')).toBe('Fallback');
  });
});

describe('page nodes', () => {
  it('webPage links to the website and its breadcrumb', () => {
    const page = webPageNode({ tenant, url: 'https://www.example-agent.com/sell', name: 'Sell', hasBreadcrumb: true });
    expect(page['@id']).toBe('https://www.example-agent.com/sell#webpage');
    expect(page.isPartOf).toEqual({ '@id': 'https://www.example-agent.com/#website' });
    expect(page.breadcrumb).toEqual({ '@id': 'https://www.example-agent.com/sell#breadcrumb' });
  });

  it('breadcrumb numbers positions from 1 and drops incomplete items', () => {
    const crumb = breadcrumbNode('https://x.com/a', [
      { name: 'Home', url: 'https://x.com/' },
      { name: '', url: 'https://x.com/missing' },
      { name: 'A', url: 'https://x.com/a' },
    ])!;
    expect(crumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x.com/' },
      { '@type': 'ListItem', position: 2, name: 'A', item: 'https://x.com/a' },
    ]);
    expect(breadcrumbNode('https://x.com/a', [])).toBeUndefined();
  });

  it('faq only emits complete questions', () => {
    expect(faqNode('https://x.com/a', [{ question: 'Q?', answer: '' }])).toBeUndefined();
    const faq = faqNode('https://x.com/a', [{ question: ' Q? ', answer: 'A.' }])!;
    expect(faq.mainEntity).toEqual([{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }]);
  });

  it('article references author, publisher and its page', () => {
    const article = articleNode({
      type: 'NewsArticle',
      url: 'https://x.com/news/a',
      headline: 'A',
      publisherName: 'The Times',
      isBasedOn: 'https://times.example/a',
    });
    expect(article['@type']).toBe('NewsArticle');
    expect(article.mainEntityOfPage).toEqual({ '@id': 'https://x.com/news/a#webpage' });
    expect(article.publisher).toMatchObject({ '@type': 'Organization', name: 'The Times' });
    expect(article.isBasedOn).toBe('https://times.example/a');
  });

  it('video requires the fields Google needs', () => {
    expect(videoNode({ url: 'https://x.com/v', name: 'V', thumbnailUrl: 't.jpg', uploadDate: null, embedUrl: 'e' })).toBeUndefined();
    expect(videoNode({ url: 'https://x.com/v', name: 'V', thumbnailUrl: 't.jpg', uploadDate: '2026-01-01', embedUrl: 'https://e' })).toMatchObject({
      '@type': 'VideoObject',
      embedUrl: 'https://e',
    });
  });

  it('review has a rating only when one was given', () => {
    const base = { body: 'Lovely', authorName: 'Pat', itemReviewedId: 'https://x.com/#organization' };
    expect(reviewNode(base)!.reviewRating).toBeUndefined();
    expect(reviewNode({ ...base, rating: 4 })!.reviewRating).toEqual({ '@type': 'Rating', ratingValue: 4, bestRating: 5, worstRating: 1 });
    expect(reviewNode({ ...base, rating: 9 })!.reviewRating).toBeUndefined();
    expect(reviewNode({ ...base, body: '' })).toBeUndefined();
  });

  it('person worksFor falls back to a named organization', () => {
    expect(personNode({ id: 'https://x.com/p#person', name: 'P', worksForName: 'Office' }).worksFor).toEqual({ '@type': 'Organization', name: 'Office' });
  });

  it('place nests county inside state', () => {
    const place = placeNode({ url: 'https://x.com/c', name: 'Snowmass Village', containedIn: ['Pitkin County', 'Colorado'] });
    expect(place.containedInPlace).toEqual({
      '@type': 'AdministrativeArea',
      name: 'Pitkin County',
      containedInPlace: { '@type': 'State', name: 'Colorado' },
    });
  });

  it('report carries author, publisher, about and temporalCoverage', () => {
    const report = reportNode({ url: 'https://x.com/r', name: 'R', publisherId: 'https://x.com/#organization', authorId: 'https://x.com/#agent', aboutPlace: 'Aspen, CO', temporalCoverage: '2026-07/2026-09' });
    expect(report.author).toEqual({ '@id': 'https://x.com/#agent' });
    expect(report.about).toEqual({ '@type': 'City', name: 'Aspen, CO' });
    expect(report.temporalCoverage).toBe('2026-07/2026-09');
  });

  it('collection page points at its item list', () => {
    const [page, list] = collectionPageNodes({ tenant, url: 'https://x.com/blog', name: 'Blog', items: [{ url: 'https://x.com/blog/a', name: 'A' }] });
    expect(page['@type']).toBe('CollectionPage');
    expect(page.mainEntity).toEqual({ '@id': 'https://x.com/blog#itemlist' });
    expect(list['@id']).toBe('https://x.com/blog#itemlist');
  });
});

describe('listings', () => {
  it('maps feed property types to accommodation types', () => {
    expect(accommodationType('Single Family Residence')).toBe('SingleFamilyResidence');
    expect(accommodationType('Condominium')).toBe('Apartment');
    expect(accommodationType('Townhouse')).toBe('House');
    expect(accommodationType('Unimproved Land')).toBe('LandmarksOrHistoricalBuildings');
    expect(accommodationType(null)).toBe('Accommodation');
  });

  it('maps statuses to availability', () => {
    expect(listingAvailability('Active')).toBe('InStock');
    expect(listingAvailability('Pending')).toBe('LimitedAvailability');
    expect(listingAvailability('Sold')).toBe('SoldOut');
    expect(listingAvailability('Closed')).toBe('SoldOut');
  });

  it('keeps the MLS number as identifier and the offer on the listing, with seller only when given', () => {
    const [listing, home] = listingNodes({ url: 'https://x.com/l/1', name: '1 St', mlsNumber: 'M1', listPrice: 5, status: 'Active' });
    expect(listing.identifier).toEqual({ '@type': 'PropertyValue', name: 'MLS Number', value: 'M1' });
    expect(listing.offers).toMatchObject({ '@type': 'Offer', price: 5, priceCurrency: 'USD', availability: 'https://schema.org/InStock' });
    expect((listing.offers as { seller?: unknown }).seller).toBeUndefined();
    expect(home['@id']).toBe('https://x.com/l/1#property');
    const [own] = listingNodes({ url: 'https://x.com/l/1', name: '1 St', listPrice: 5, sellerId: 'https://x.com/#organization' });
    expect((own.offers as { seller: unknown }).seller).toEqual({ '@id': 'https://x.com/#organization' });
  });

  it('adds a VideoObject when the listing has a video', () => {
    const nodes = listingNodes({
      url: 'https://x.com/l/1',
      name: '1 St',
      video: { url: 'https://x.com/l/1', name: 'Tour', thumbnailUrl: 't', uploadDate: '2026-01-01', embedUrl: 'https://e' },
    });
    expect(nodes.map((n) => n['@type'])).toEqual(['RealEstateListing', 'Accommodation', 'VideoObject']);
    expect(nodes[0].video).toEqual({ '@id': 'https://x.com/l/1#video' });
  });
});

describe('text helpers', () => {
  it('flattens portable text', () => {
    const blocks = [
      { _type: 'block', children: [{ text: 'Hello ' }, { text: 'world' }] },
      { _type: 'block', listItem: 'bullet', children: [{ text: 'one' }] },
      { _type: 'image' },
    ];
    expect(toPlainText(blocks)).toBe('Hello world\n\n• one');
    expect(toPlainText('  plain ')).toBe('plain');
    expect(toPlainText(null)).toBe('');
  });
  it('truncates on a word boundary', () => {
    expect(truncate('a '.repeat(200), 50)!.length).toBeLessThanOrEqual(51);
    expect(truncate('short')).toBe('short');
    expect(truncate(undefined)).toBeUndefined();
  });
  it('formats coverage intervals and dates', () => {
    expect(temporalCoverage('2026-07-01', '2026-09-30')).toBe('2026-07/2026-09');
    expect(temporalCoverage('2026-07-01', '2026-07-31')).toBe('2026-07');
    expect(temporalCoverage(null, null)).toBeUndefined();
    expect(isoDate('2026-01-02T03:04:05Z', true)).toBe('2026-01-02');
    expect(isoDate('nope')).toBeUndefined();
  });
});
