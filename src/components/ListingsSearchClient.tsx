'use client';

import { useState, useCallback, useTransition } from 'react';
import ListingFilters from './ListingFilters';
import ListingsContent from './ListingsContent';
import type { MLSProperty, SortOption } from '@/lib/listings';

interface ListingsSearchClientProps {
  // Initial server-rendered data
  initialListings: MLSProperty[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  initialSearchParams: string;
  initialSort: SortOption;
  // Filter state from URL
  keyword?: string;
  status?: string;
  propertyType?: string;
  propertySubType?: string;
  selectedCities: string[];
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  ourTeam?: boolean;
  // Dropdown options
  statuses: string[];
  propertyTypes: string[];
  propertySubTypes: string[];
  cities: string[];
  neighborhoods: string[];
  showOurTeamFilter: boolean;
  hasLocationFilter: boolean;
  template: string;
  listingsPerRow?: 2 | 3;
  googleMapsApiKey?: string;
}

export default function ListingsSearchClient({
  initialListings,
  initialTotal,
  initialTotalPages,
  initialPage,
  initialSearchParams,
  initialSort,
  keyword,
  status,
  propertyType,
  propertySubType,
  selectedCities,
  neighborhood,
  minPrice,
  maxPrice,
  beds,
  baths,
  ourTeam,
  statuses,
  propertyTypes,
  propertySubTypes,
  cities,
  neighborhoods,
  showOurTeamFilter,
  hasLocationFilter,
  template,
  listingsPerRow,
  googleMapsApiKey,
}: ListingsSearchClientProps) {
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [searchParams, setSearchParams] = useState(initialSearchParams);
  const [loading, setLoading] = useState(false);
  const [locationFilter, setLocationFilter] = useState(hasLocationFilter);

  const fetchListings = useCallback(async (params: URLSearchParams, { keepPage }: { keepPage?: boolean } = {}) => {
    if (!keepPage) {
      params.delete('page');
    }

    // Update URL without navigation
    const qs = params.toString();
    const url = qs ? `/listings?${qs}` : '/listings';
    window.history.replaceState(null, '', url);

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      setListings(data.listings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(parseInt(params.get('page') || '1', 10));
      setCurrentSort((params.get('sort') as SortOption) || 'newest');
      setSearchParams(params.toString());
      setLocationFilter(!!(params.get('city') || params.get('neighborhood')));
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback((params: URLSearchParams) => {
    fetchListings(params);
  }, [fetchListings]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    fetchListings(params, { keepPage: true });
  }, [searchParams, fetchListings]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    params.delete('page');
    fetchListings(params);
  }, [searchParams, fetchListings]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-4 pt-0 pb-1 sm:px-6 lg:px-8">
          <ListingFilters
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
            statuses={statuses}
            propertyTypes={propertyTypes}
            propertySubTypes={propertySubTypes}
            cities={cities}
            initialNeighborhoods={neighborhoods}
            ourTeam={ourTeam}
            showOurTeamFilter={showOurTeamFilter}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Listings Content with loading overlay */}
      <div className="relative flex-1 min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-20">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading listings...</span>
            </div>
          </div>
        )}
        <ListingsContent
          listings={listings}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          searchParams={searchParams}
          currentSort={currentSort}
          hasLocationFilter={locationFilter}
          template={template as any}
          listingsPerRow={listingsPerRow}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          googleMapsApiKey={googleMapsApiKey}
        />
      </div>
    </div>
  );
}
