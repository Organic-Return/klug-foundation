import { Metadata } from 'next';
import {
  getListings,
  getDistinctCities,
  getDistinctPropertyTypes,
  getDistinctPropertySubTypes,
  getDistinctStatuses,
  getDistinctNeighborhoods,
  getNeighborhoodsByCity,
  type SortOption,
} from '@/lib/listings';
import {
  getMLSConfiguration,
  getExcludedPropertyTypes,
  getExcludedPropertySubTypes,
  getAllowedCities,
  getExcludedStatuses,
} from '@/lib/mlsConfiguration';
import ListingsContent from '@/components/ListingsContent';
import ListingFilters from '@/components/ListingFilters';

export const metadata: Metadata = {
  title: 'Property Listings | MLS Listings',
  description: 'Browse all available property listings from the MLS database.',
};

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

  // Fetch MLS configuration and data in parallel
  const [mlsConfig, cities, propertyTypes, propertySubTypes, statuses, allNeighborhoods] = await Promise.all([
    getMLSConfiguration(),
    getDistinctCities(),
    getDistinctPropertyTypes(),
    getDistinctPropertySubTypes(),
    getDistinctStatuses(),
    getDistinctNeighborhoods(),
  ]);

  // Fetch neighborhoods filtered by city if a city is selected
  const neighborhoods = city ? await getNeighborhoodsByCity(city) : allNeighborhoods;

  // Get filter lists from MLS configuration
  const excludedPropertyTypes = getExcludedPropertyTypes(mlsConfig);
  const excludedPropertySubTypes = getExcludedPropertySubTypes(mlsConfig);
  const allowedCities = getAllowedCities(mlsConfig);
  const excludedStatuses = getExcludedStatuses(mlsConfig);

  // Always exclude "Closed" listings from search results (dedupe in case Closed is already configured)
  const allExcludedStatuses = [...new Set([...excludedStatuses, 'Closed'])];

  // Filter dropdown options based on MLS configuration
  // If allowedCities is configured, use those directly for the dropdown
  // This avoids issues with Supabase row limits when fetching distinct cities
  const filteredCities = allowedCities.length > 0 ? allowedCities : cities;
  const filteredPropertyTypes = propertyTypes.filter((t) => !excludedPropertyTypes.includes(t));
  const filteredPropertySubTypes = propertySubTypes.filter((t) => !excludedPropertySubTypes.includes(t));
  // Filter out excluded statuses and also hide "Closed" from dropdown (closed properties still show on site)
  const filteredStatuses = statuses.filter((s) => !excludedStatuses.includes(s) && s !== 'Closed');

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
    excludedPropertyTypes,
    excludedPropertySubTypes,
    allowedCities,
    excludedStatuses: allExcludedStatuses,
    sort,
  });

  const { listings, total, totalPages } = listingsResult;

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
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
          />
        </div>
      </div>

      {/* Listings Content with View Toggle */}
      <ListingsContent
        listings={listings}
        currentPage={page}
        totalPages={totalPages}
        total={total}
        searchParams={currentSearchParams}
        currentSort={sort}
      />
    </div>
  );
}
