import { Metadata } from 'next';
import {
  getListings,
  getListingHref,
  getDistinctCities,
  getDistinctPropertyTypes,
  getDistinctPropertySubTypes,
  getDistinctStatuses,
  getDistinctNeighborhoods,
  getNeighborhoodsByCity,
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
import { getSettings } from '@/lib/settings';
import { client } from '@/sanity/client';
import ListingsContent from '@/components/ListingsContent';
import ListingFilters from '@/components/ListingFilters';
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
  const city = params.city;
  const neighborhood = params.neighborhood;
  const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;
  const beds = params.beds ? parseInt(params.beds, 10) : undefined;
  const baths = params.baths ? parseInt(params.baths, 10) : undefined;
  const sort = params.sort || 'newest';
  const keyword = params.q;
  const ourTeam = params.ourTeam === 'true';

  // Fetch MLS configuration, settings, and data in parallel
  const [mlsConfig, settings, cities, propertyTypes, propertySubTypes, statuses, allNeighborhoods, teamMembers] = await Promise.all([
    getMLSConfiguration(),
    getSettings(),
    getDistinctCities(),
    getDistinctPropertyTypes(),
    getDistinctPropertySubTypes(),
    getDistinctStatuses(),
    getDistinctNeighborhoods(),
    client.fetch<{ name: string; mlsAgentId?: string; mlsAgentIdSold?: string }[]>(
      `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{ name, mlsAgentId, mlsAgentIdSold }`,
      {},
      { next: { revalidate: 3600 } }
    ),
  ]);

  // Fetch neighborhoods filtered by city if a city is selected
  const neighborhoods = city ? await getNeighborhoodsByCity(city) : allNeighborhoods;

  // Get filter lists from MLS configuration
  const excludedPropertyTypes = [...getExcludedPropertyTypes(mlsConfig), 'Commercial Sale'];
  const excludedPropertySubTypes = getExcludedPropertySubTypes(mlsConfig);
  const allowedCities = getAllowedCities(mlsConfig);
  const excludedStatuses = getExcludedStatuses(mlsConfig);

  // Only show active-type statuses in results and dropdown
  const allowedStatusList = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending', 'Pending Inspect/Feasib', 'To Be Built'];

  // Filter dropdown options based on MLS configuration
  // If allowedCities is configured, use those directly for the dropdown
  // This avoids issues with Supabase row limits when fetching distinct cities
  const filteredCities = allowedCities.length > 0 ? allowedCities : cities;
  const filteredPropertyTypes = propertyTypes.filter((t) => !excludedPropertyTypes.includes(t));
  const filteredPropertySubTypes = propertySubTypes.filter((t) => !excludedPropertySubTypes.includes(t));
  const filteredStatuses = statuses.filter(
    (s) => allowedStatusList.includes(s) && !excludedStatuses.includes(s)
  );

  // Collect all team agent MLS IDs and names for "Our Properties Only" filter
  const teamAgentIds = teamMembers
    ? [...new Set(teamMembers.flatMap((m) => [m.mlsAgentId, m.mlsAgentIdSold]).filter(Boolean) as string[])]
    : [];
  const teamAgentNames = teamMembers
    ? [...new Set(teamMembers.map((m) => m.name).filter(Boolean))]
    : [];
  const teamOfficeNames = settings?.teamSync?.offices
    ? settings.teamSync.offices.map((o) => o.officeName).filter(Boolean)
    : [];

  // Fetch listings with filters applied
  const listingsResult = await getListings(page, 24, {
    status,
    propertyType,
    propertySubType,
    city,
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
    allowedStatuses: status ? undefined : allowedStatusList,
    sort,
  });

  const { listings, total, totalPages } = listingsResult;

  // Generate structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const schemas = generateListingsSchema(listings, baseUrl, total);

  // Build current search params for pagination
  const currentSearchParams = new URLSearchParams();
  if (status) currentSearchParams.set('status', status);
  if (propertyType) currentSearchParams.set('type', propertyType);
  if (propertySubType) currentSearchParams.set('subtype', propertySubType);
  if (city) currentSearchParams.set('city', city);
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
      <div className="h-full flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="bg-white shadow-sm flex-shrink-0">
          <div className="px-4 pt-0 pb-1 sm:px-6 lg:px-8">
            <ListingFilters
              keyword={keyword}
              status={status}
              propertyType={propertyType}
              propertySubType={propertySubType}
              city={city}
              neighborhood={neighborhood}
              minPrice={minPrice}
              maxPrice={maxPrice}
              beds={beds}
              baths={baths}
              statuses={filteredStatuses}
              propertyTypes={filteredPropertyTypes}
              propertySubTypes={filteredPropertySubTypes}
              cities={filteredCities}
              initialNeighborhoods={neighborhoods}
              ourTeam={ourTeam}
              showOurTeamFilter={teamAgentIds.length > 0 || teamOfficeNames.length > 0}
            />
          </div>
        </div>

        {/* Listings Content with View Toggle */}
        <ListingsContent
          listings={listings}
          currentPage={page}
          totalPages={totalPages}
          total={total}
          searchParams={currentSearchParams.toString()}
          currentSort={sort}
          hasLocationFilter={!!(city || neighborhood)}
          template={settings?.template || 'classic'}
        />
      </div>
    </>
  );
}
