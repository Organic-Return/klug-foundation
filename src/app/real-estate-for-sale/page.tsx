import { Metadata } from 'next';
import {
  getListings,
  getListingHref,
  getDistinctCities,
  getMlsNumbersWithSIRMedia,
  getDistinctPropertyTypes,
  getDistinctPropertySubTypes,
  getDistinctStatuses,
  getNeighborhoodsByCity,
  getNeighborhoodsByCities,
  formatPrice,
  type SortOption,
  type MLSProperty,
} from '@/lib/listings';
import {
  getMLSConfiguration,
  getExcludedPropertyTypes,
  getExcludedPropertySubTypes,
  getAllowedCities,
  getExcludedStatuses,
} from '@/lib/mlsConfiguration';
import { getSettings, getGoogleMapsApiKey } from '@/lib/settings';
import { client } from '@/sanity/client';
import ListingsSearchClient from '@/components/ListingsSearchClient';
import StructuredData from '@/components/StructuredData';

// Generate ItemList schema for listings
function generateListingsSchema(listings: MLSProperty[], baseUrl: string, total: number) {
  // ItemList schema for search results
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Property Listings',
    description: 'Browse all available property listings',
    numberOfItems: total,
    itemListElement: listings.slice(0, 10).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'RealEstateListing',
        '@id': `${baseUrl}${getListingHref(listing)}`,
        url: `${baseUrl}${getListingHref(listing)}`,
        name: listing.address || `Property ${listing.mls_number}`,
        description: listing.description || `${listing.property_type || 'Property'} in ${listing.city}, ${listing.state}`,
        ...(listing.list_price && {
          offers: {
            '@type': 'Offer',
            price: listing.list_price,
            priceCurrency: 'USD',
          },
        }),
        ...(listing.photos && listing.photos.length > 0 && {
          image: listing.photos[0],
        }),
        address: {
          '@type': 'PostalAddress',
          streetAddress: listing.address,
          addressLocality: listing.city,
          addressRegion: listing.state,
          postalCode: listing.zip_code,
          addressCountry: 'US',
        },
      },
    })),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Listings',
        item: `${baseUrl}/listings`,
      },
    ],
  };

  // CollectionPage schema
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${baseUrl}/listings`,
    name: 'Property Listings',
    description: 'Browse all available property listings from the MLS database.',
    url: `${baseUrl}/listings`,
    mainEntity: {
      '@id': `${baseUrl}/listings#itemlist`,
    },
  };

  return [itemListSchema, breadcrumbSchema, collectionPageSchema];
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Property Listings | MLS Listings',
    description: 'Browse all available property listings from the MLS database.',
    alternates: {
      canonical: `${baseUrl}/listings`,
    },
    openGraph: {
      title: 'Property Listings | MLS Listings',
      description: 'Browse all available property listings from the MLS database.',
      url: `${baseUrl}/listings`,
    },
  };
}

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

interface ListingsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    subtype?: string;
    city?: string;
    neighborhood?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    sort?: SortOption;
    q?: string;
    ourTeam?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const status = params.status;
  const propertyType = params.type;
  const propertySubType = params.subtype;
  const selectedCities = params.city ? params.city.split(',').map(c => c.trim()).filter(Boolean) : [];
  const neighborhood = params.neighborhood;
  const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;
  const beds = params.beds ? parseInt(params.beds, 10) : undefined;
  const baths = params.baths ? parseInt(params.baths, 10) : undefined;
  const sort = params.sort || 'newest';
  const keyword = params.q;
  const ourTeam = params.ourTeam === 'true';

  // Only show active-type statuses in results and dropdown
  const allowedStatusList = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending', 'Pending Inspect/Feasib', 'To Be Built'];

  // Phase 1: Fast Sanity queries (CDN-cached, ~50-100ms) to get filter config.
  // Each call is wrapped in a per-call catch so a single transient Sanity 502 /
  // Supabase timeout doesn't reject the whole Promise.all and surface the
  // error boundary. Non-critical lookups degrade to safe defaults instead.
  const [mlsConfig, settings, teamMembers, googleMapsApiKey] = await Promise.all([
    getMLSConfiguration().catch((e) => { console.error('[listings] mlsConfig fetch failed:', e); return null; }),
    getSettings().catch((e) => { console.error('[listings] settings fetch failed:', e); return null; }),
    client.fetch<{ name: string; mlsAgentId?: string; mlsAgentIdSold?: string }[]>(
      `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{ name, mlsAgentId, mlsAgentIdSold }`,
      {},
      { next: { revalidate: 3600 } }
    ).catch((e) => { console.error('[listings] teamMembers fetch failed:', e); return []; }),
    // Fall back to the public env var (not '') so we never hand the
    // Google Maps loader an empty key — that would race with other
    // components that DID get the real key and throw "Loader must not
    // be called again with different options".
    getGoogleMapsApiKey().catch((e) => {
      console.error('[listings] gmaps key fetch failed:', e);
      return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    }),
  ]);

  // Compute filters from MLS configuration (instant, no async)
  const excludedPropertyTypes = [...getExcludedPropertyTypes(mlsConfig), 'Commercial Sale'];
  const excludedPropertySubTypes = getExcludedPropertySubTypes(mlsConfig);
  const allowedCities = getAllowedCities(mlsConfig);
  const excludedStatuses = getExcludedStatuses(mlsConfig);

  const teamAgentIds = teamMembers
    ? [...new Set(teamMembers.flatMap((m) => [m.mlsAgentId, m.mlsAgentIdSold]).filter(Boolean) as string[])]
    : [];
  const teamAgentNames = teamMembers
    ? [...new Set(teamMembers.map((m) => m.name).filter(Boolean))]
    : [];
  const teamOfficeNames = settings?.teamSync?.offices
    ? settings.teamSync.offices.map((o) => o.officeName).filter(Boolean)
    : [];

  // Phase 2: Run listings query + dropdown data in parallel. Dropdown
  // queries fall back to empty arrays on transient failure so a Supabase
  // hiccup only loses the filter options, not the entire page render.
  const [listingsResult, cities, propertyTypes, propertySubTypes, statuses, neighborhoods] = await Promise.all([
    getListings(page, 24, {
      status,
      propertyType,
      propertySubType,
      cities: selectedCities.length > 0 ? selectedCities : undefined,
      neighborhood,
      minPrice,
      maxPrice,
      minBeds: beds,
      minBaths: baths,
      keyword,
      agentMlsIds: ourTeam ? teamAgentIds : undefined,
      agentNames: ourTeam ? teamAgentNames : undefined,
      officeNames: ourTeam ? teamOfficeNames : undefined,
      excludedPropertyTypes,
      excludedPropertySubTypes,
      allowedCities,
      allowedStatuses: allowedStatusList,
      sort,
    }).catch((e) => {
      console.error('[listings] primary getListings failed:', e);
      return { listings: [] as MLSProperty[], total: 0, totalPages: 0 };
    }),
    getDistinctCities().catch((e) => { console.error('[listings] cities failed:', e); return [] as string[]; }),
    getDistinctPropertyTypes().catch((e) => { console.error('[listings] propertyTypes failed:', e); return [] as string[]; }),
    getDistinctPropertySubTypes().catch((e) => { console.error('[listings] propertySubTypes failed:', e); return [] as string[]; }),
    getDistinctStatuses().catch((e) => { console.error('[listings] statuses failed:', e); return [] as string[]; }),
    (selectedCities.length > 0
      ? (selectedCities.length === 1
          ? getNeighborhoodsByCity(selectedCities[0])
          : getNeighborhoodsByCities(selectedCities))
      : Promise.resolve([])
    ).catch((e) => { console.error('[listings] neighborhoods failed:', e); return [] as string[]; }),
  ]);

  // Filter dropdown options based on MLS configuration
  const filteredCities = allowedCities.length > 0 ? allowedCities : cities;
  const filteredPropertyTypes = propertyTypes.filter((t) => !excludedPropertyTypes.includes(t));
  const filteredPropertySubTypes = propertySubTypes.filter((t) => !excludedPropertySubTypes.includes(t));
  const filteredStatuses = statuses.filter(
    (s) => allowedStatusList.includes(s) && !excludedStatuses.includes(s)
  );

  const { listings, total, totalPages } = listingsResult;

  // Check which team listings have SIR videos and Matterport tours
  const teamListingMlsNumbers = listings
    .filter(l => l.mls_number && l.list_agent_mls_id && teamAgentIds.includes(l.list_agent_mls_id))
    .map(l => l.mls_number);
  const sirMedia = teamListingMlsNumbers.length > 0
    ? await getMlsNumbersWithSIRMedia(teamListingMlsNumbers).catch((e) => {
        console.error('[listings] sirMedia fetch failed:', e);
        return { videos: new Set<string>(), matterports: new Set<string>() };
      })
    : { videos: new Set<string>(), matterports: new Set<string>() };

  // Generate structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const schemas = generateListingsSchema(listings, baseUrl, total);

  // Build current search params for pagination
  const currentSearchParams = new URLSearchParams();
  if (status) currentSearchParams.set('status', status);
  if (propertyType) currentSearchParams.set('type', propertyType);
  if (propertySubType) currentSearchParams.set('subtype', propertySubType);
  if (selectedCities.length > 0) currentSearchParams.set('city', selectedCities.join(','));
  if (neighborhood) currentSearchParams.set('neighborhood', neighborhood);
  if (minPrice) currentSearchParams.set('minPrice', minPrice.toString());
  if (maxPrice) currentSearchParams.set('maxPrice', maxPrice.toString());
  if (beds) currentSearchParams.set('beds', beds.toString());
  if (baths) currentSearchParams.set('baths', baths.toString());
  if (sort && sort !== 'newest') currentSearchParams.set('sort', sort);
  if (keyword) currentSearchParams.set('q', keyword);
  if (ourTeam) currentSearchParams.set('ourTeam', 'true');

  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
      <ListingsSearchClient
        initialListings={listings}
        initialTotal={total}
        initialTotalPages={totalPages}
        initialPage={page}
        initialSearchParams={currentSearchParams.toString()}
        initialSort={sort}
        keyword={keyword}
        status={status}
        propertyType={propertyType}
        propertySubType={propertySubType}
        selectedCities={selectedCities}
        neighborhood={neighborhood}
        minPrice={minPrice}
        maxPrice={maxPrice}
        beds={beds}
        baths={baths}
        ourTeam={ourTeam}
        statuses={filteredStatuses}
        propertyTypes={filteredPropertyTypes}
        propertySubTypes={filteredPropertySubTypes}
        cities={filteredCities}
        neighborhoods={neighborhoods}
        showOurTeamFilter={teamAgentIds.length > 0 || teamOfficeNames.length > 0}
        hasLocationFilter={!!(selectedCities.length > 0 || neighborhood)}
        template={settings?.template || 'classic'}
        listingsPerRow={settings?.listingsPerRow}
        googleMapsApiKey={googleMapsApiKey}
        mlsWithVideos={Array.from(sirMedia.videos)}
        mlsWithMatterport={Array.from(sirMedia.matterports)}
        teamAgentMlsIds={teamAgentIds}
      />
    </>
  );
}
