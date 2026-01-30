'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ListingFiltersProps {
  // Current values from URL
  keyword?: string;
  status?: string;
  propertyType?: string;
  propertySubType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  // Available options
  statuses: string[];
  propertyTypes: string[];
  propertySubTypes: string[];
  cities: string[];
  initialNeighborhoods: string[];
}

export default function ListingFilters({
  keyword: initialKeyword,
  status: initialStatus,
  propertyType: initialPropertyType,
  propertySubType: initialPropertySubType,
  city: initialCity,
  neighborhood: initialNeighborhood,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  beds: initialBeds,
  baths: initialBaths,
  statuses,
  propertyTypes,
  propertySubTypes,
  cities,
  initialNeighborhoods,
}: ListingFiltersProps) {
  const router = useRouter();

  // Local state for all filters
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [propertyType, setPropertyType] = useState(initialPropertyType || '');
  const [propertySubType, setPropertySubType] = useState(initialPropertySubType || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [beds, setBeds] = useState(initialBeds?.toString() || '');
  const [baths, setBaths] = useState(initialBaths?.toString() || '');

  const [neighborhoods, setNeighborhoods] = useState<string[]>(initialNeighborhoods);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Sync state when URL params change (e.g., on back navigation)
  useEffect(() => {
    setKeyword(initialKeyword || '');
    setStatus(initialStatus || '');
    setPropertyType(initialPropertyType || '');
    setPropertySubType(initialPropertySubType || '');
    setSelectedCity(initialCity || '');
    setSelectedNeighborhood(initialNeighborhood || '');
    setMinPrice(initialMinPrice?.toString() || '');
    setMaxPrice(initialMaxPrice?.toString() || '');
    setBeds(initialBeds?.toString() || '');
    setBaths(initialBaths?.toString() || '');
  }, [
    initialKeyword,
    initialStatus,
    initialPropertyType,
    initialPropertySubType,
    initialCity,
    initialNeighborhood,
    initialMinPrice,
    initialMaxPrice,
    initialBeds,
    initialBaths,
  ]);

  // Build URL and navigate
  const navigateWithFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (keyword) params.set('q', keyword);
    if (status) params.set('status', status);
    if (propertyType) params.set('type', propertyType);
    if (propertySubType) params.set('subtype', propertySubType);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);

    const queryString = params.toString();
    router.push(queryString ? `/listings?${queryString}` : '/listings');
  }, [keyword, status, propertyType, propertySubType, selectedCity, selectedNeighborhood, minPrice, maxPrice, beds, baths, router]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    async function fetchNeighborhoods() {
      if (!selectedCity) {
        setNeighborhoods(initialNeighborhoods);
        return;
      }

      setLoadingNeighborhoods(true);
      try {
        const response = await fetch(`/api/neighborhoods?city=${encodeURIComponent(selectedCity)}`);
        const data = await response.json();
        setNeighborhoods(data.neighborhoods || []);
        // Clear neighborhood selection if it's not in the new list
        if (selectedNeighborhood && !data.neighborhoods?.includes(selectedNeighborhood)) {
          setSelectedNeighborhood('');
        }
      } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        setNeighborhoods([]);
      } finally {
        setLoadingNeighborhoods(false);
      }
    }

    fetchNeighborhoods();
  }, [selectedCity, initialNeighborhoods, selectedNeighborhood]);

  // Auto-submit when select filters change (immediate)
  const handleSelectChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
  };

  // For city, we need to handle it specially to trigger navigation after neighborhoods load
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    // Clear neighborhood when city changes
    setSelectedNeighborhood('');
  };

  // Auto-navigate on filter changes (except for text inputs which use debounce)
  useEffect(() => {
    // Skip on initial mount by checking if we're changing from initial values
    const isInitialState =
      status === (initialStatus || '') &&
      propertyType === (initialPropertyType || '') &&
      propertySubType === (initialPropertySubType || '') &&
      selectedCity === (initialCity || '') &&
      selectedNeighborhood === (initialNeighborhood || '') &&
      beds === (initialBeds?.toString() || '') &&
      baths === (initialBaths?.toString() || '');

    if (!isInitialState) {
      navigateWithFilters();
    }
  }, [status, propertyType, propertySubType, selectedCity, selectedNeighborhood, beds, baths]);

  // Debounced navigation for text inputs (keyword, price)
  useEffect(() => {
    const isInitialKeyword = keyword === (initialKeyword || '');
    const isInitialMinPrice = minPrice === (initialMinPrice?.toString() || '');
    const isInitialMaxPrice = maxPrice === (initialMaxPrice?.toString() || '');

    if (isInitialKeyword && isInitialMinPrice && isInitialMaxPrice) return;

    const timer = setTimeout(() => {
      navigateWithFilters();
    }, 500); // 500ms debounce for text inputs

    return () => clearTimeout(timer);
  }, [keyword, minPrice, maxPrice]);

  const hasFilters = keyword || status || propertyType || propertySubType || selectedCity || selectedNeighborhood || minPrice || maxPrice || beds || baths;

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPropertyType('');
    setPropertySubType('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setMinPrice('');
    setMaxPrice('');
    setBeds('');
    setBaths('');
    router.push('/listings');
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Keyword Search */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search MLS# or address..."
        className="w-48 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Status Filter */}
      <select
        value={status}
        onChange={handleSelectChange(setStatus)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Property Type Filter (Main Types) */}
      <select
        value={propertyType}
        onChange={handleSelectChange(setPropertyType)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Types</option>
        {propertyTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Property SubType Filter */}
      <select
        value={propertySubType}
        onChange={handleSelectChange(setPropertySubType)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Subtypes</option>
        {propertySubTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* City Filter */}
      <select
        value={selectedCity}
        onChange={handleCityChange}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Neighborhood Filter - Dynamic based on city */}
      {neighborhoods.length > 0 ? (
        <select
          value={selectedNeighborhood}
          onChange={handleSelectChange(setSelectedNeighborhood)}
          disabled={loadingNeighborhoods}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">
            {loadingNeighborhoods ? 'Loading...' : selectedCity ? `Neighborhoods in ${selectedCity}` : 'All Neighborhoods'}
          </option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
          placeholder={selectedCity ? `Search in ${selectedCity}...` : 'Search neighborhood...'}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {/* Price Range */}
      <input
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        placeholder="Min Price"
        className="w-32 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        placeholder="Max Price"
        className="w-32 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Beds/Baths */}
      <select
        value={beds}
        onChange={handleSelectChange(setBeds)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Any Beds</option>
        <option value="1">1+ Beds</option>
        <option value="2">2+ Beds</option>
        <option value="3">3+ Beds</option>
        <option value="4">4+ Beds</option>
        <option value="5">5+ Beds</option>
      </select>

      <select
        value={baths}
        onChange={handleSelectChange(setBaths)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Any Baths</option>
        <option value="1">1+ Baths</option>
        <option value="2">2+ Baths</option>
        <option value="3">3+ Baths</option>
        <option value="4">4+ Baths</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-6 py-2 text-gray-600 font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
