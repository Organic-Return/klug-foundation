'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ListingFiltersProps {
  // Current values from URL
  keyword?: string;
  status?: string;
  propertyType?: string;
  propertySubType?: string;
  selectedCities?: string[];
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  ourTeam?: boolean;
  // Available options
  statuses: string[];
  propertyTypes: string[];
  propertySubTypes: string[];
  cities: string[];
  initialNeighborhoods: string[];
  // Show "Our Listings" checkbox (only when team data is available)
  showOurTeamFilter?: boolean;
  // Client-side mode: call this instead of router.push
  onFilterChange?: (params: URLSearchParams) => void;
}

const PRICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '100000', label: '$100,000' },
  { value: '200000', label: '$200,000' },
  { value: '300000', label: '$300,000' },
  { value: '400000', label: '$400,000' },
  { value: '500000', label: '$500,000' },
  { value: '600000', label: '$600,000' },
  { value: '750000', label: '$750,000' },
  { value: '1000000', label: '$1,000,000' },
  { value: '1500000', label: '$1,500,000' },
  { value: '2000000', label: '$2,000,000' },
  { value: '3000000', label: '$3,000,000' },
  { value: '5000000', label: '$5,000,000' },
  { value: '10000000', label: '$10,000,000' },
];

export default function ListingFilters({
  keyword: initialKeyword,
  status: initialStatus,
  propertyType: initialPropertyType,
  propertySubType: initialPropertySubType,
  selectedCities: initialSelectedCities,
  neighborhood: initialNeighborhood,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  beds: initialBeds,
  baths: initialBaths,
  ourTeam: initialOurTeam,
  statuses,
  propertyTypes,
  propertySubTypes,
  cities,
  initialNeighborhoods,
  showOurTeamFilter,
  onFilterChange,
}: ListingFiltersProps) {
  const router = useRouter();

  // Local state for all filters
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [propertyType, setPropertyType] = useState(initialPropertyType || '');
  const [propertySubType, setPropertySubType] = useState(initialPropertySubType || '');
  const [selectedCities, setSelectedCities] = useState<string[]>(initialSelectedCities || []);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [beds, setBeds] = useState(initialBeds?.toString() || '');
  const [baths, setBaths] = useState(initialBaths?.toString() || '');

  const [ourTeam, setOurTeam] = useState(initialOurTeam || false);

  const [neighborhoods, setNeighborhoods] = useState<string[]>(initialNeighborhoods);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Dropdown open states
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [bedsDropdownOpen, setBedsDropdownOpen] = useState(false);
  const [bathsDropdownOpen, setBathsDropdownOpen] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);

  // Refs for click-outside handling
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const bedsDropdownRef = useRef<HTMLDivElement>(null);
  const bathsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
        setCitySearch('');
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target as Node)) {
        setPriceDropdownOpen(false);
      }
      if (bedsDropdownRef.current && !bedsDropdownRef.current.contains(e.target as Node)) {
        setBedsDropdownOpen(false);
      }
      if (bathsDropdownRef.current && !bathsDropdownRef.current.contains(e.target as Node)) {
        setBathsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when advanced modal is open
  useEffect(() => {
    if (advancedModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [advancedModalOpen]);

  // Close advanced modal on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && advancedModalOpen) {
        setAdvancedModalOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [advancedModalOpen]);

  // Stable key for comparing selectedCities in effects
  const selectedCitiesKey = JSON.stringify(selectedCities);
  const initialSelectedCitiesKey = JSON.stringify(initialSelectedCities || []);

  // Sync state when URL params change (e.g., on back navigation)
  useEffect(() => {
    setKeyword(initialKeyword || '');
    setStatus(initialStatus || '');
    setPropertyType(initialPropertyType || '');
    setPropertySubType(initialPropertySubType || '');
    setSelectedCities(initialSelectedCities || []);
    setSelectedNeighborhood(initialNeighborhood || '');
    setMinPrice(initialMinPrice?.toString() || '');
    setMaxPrice(initialMaxPrice?.toString() || '');
    setBeds(initialBeds?.toString() || '');
    setBaths(initialBaths?.toString() || '');
    setOurTeam(initialOurTeam || false);
  }, [
    initialKeyword,
    initialStatus,
    initialPropertyType,
    initialPropertySubType,
    initialSelectedCitiesKey,
    initialNeighborhood,
    initialMinPrice,
    initialMaxPrice,
    initialBeds,
    initialBaths,
    initialOurTeam,
  ]);

  // Build URL and navigate (or call onFilterChange if in client-side mode)
  const navigateWithFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (keyword) params.set('q', keyword);
    if (status) params.set('status', status);
    if (propertyType) params.set('type', propertyType);
    if (propertySubType) params.set('subtype', propertySubType);
    if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);
    if (ourTeam) params.set('ourTeam', 'true');

    if (onFilterChange) {
      onFilterChange(params);
    } else {
      const queryString = params.toString();
      router.push(queryString ? `/listings?${queryString}` : '/listings');
    }
  }, [keyword, status, propertyType, propertySubType, selectedCitiesKey, selectedNeighborhood, minPrice, maxPrice, beds, baths, ourTeam, router, onFilterChange]);

  // Fetch neighborhoods when selected cities change
  useEffect(() => {
    async function fetchNeighborhoods() {
      if (selectedCities.length === 0) {
        setNeighborhoods(initialNeighborhoods);
        return;
      }

      setLoadingNeighborhoods(true);
      try {
        const response = await fetch(`/api/neighborhoods?city=${encodeURIComponent(selectedCities.join(','))}`);
        const data = await response.json();
        setNeighborhoods(data.neighborhoods || []);
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
  }, [selectedCitiesKey, initialNeighborhoods, selectedNeighborhood]);

  // Toggle a city in the multi-select
  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city);
      } else {
        return [...prev, city];
      }
    });
    setSelectedNeighborhood('');
  };

  // Auto-navigate on filter changes (except for text inputs which use debounce)
  useEffect(() => {
    const isInitialState =
      status === (initialStatus || '') &&
      propertyType === (initialPropertyType || '') &&
      propertySubType === (initialPropertySubType || '') &&
      selectedCitiesKey === initialSelectedCitiesKey &&
      selectedNeighborhood === (initialNeighborhood || '') &&
      beds === (initialBeds?.toString() || '') &&
      baths === (initialBaths?.toString() || '') &&
      ourTeam === (initialOurTeam || false);

    if (!isInitialState) {
      navigateWithFilters();
    }
  }, [status, propertyType, propertySubType, selectedCitiesKey, selectedNeighborhood, beds, baths, ourTeam]);

  // Debounced navigation for text inputs (keyword, price)
  useEffect(() => {
    const isInitialKeyword = keyword === (initialKeyword || '');
    const isInitialMinPrice = minPrice === (initialMinPrice?.toString() || '');
    const isInitialMaxPrice = maxPrice === (initialMaxPrice?.toString() || '');

    if (isInitialKeyword && isInitialMinPrice && isInitialMaxPrice) return;

    const timer = setTimeout(() => {
      navigateWithFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, minPrice, maxPrice]);

  const hasFilters = keyword || status || propertyType || propertySubType || selectedCities.length > 0 || selectedNeighborhood || minPrice || maxPrice || beds || baths || ourTeam;

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPropertyType('');
    setPropertySubType('');
    setSelectedCities([]);
    setSelectedNeighborhood('');
    setMinPrice('');
    setMaxPrice('');
    setBeds('');
    setBaths('');
    setOurTeam(false);
    if (onFilterChange) {
      onFilterChange(new URLSearchParams());
    } else {
      router.push('/listings');
    }
  };

  // City dropdown label
  const cityButtonLabel = selectedCities.length === 0
    ? 'All Cities'
    : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities.length} Cities`;

  // Filter cities by search term
  const filteredDropdownCities = citySearch
    ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  // Neighborhood placeholder text
  const neighborhoodPlaceholder = loadingNeighborhoods
    ? 'Loading...'
    : selectedCities.length === 1
      ? `Neighborhoods in ${selectedCities[0]}`
      : selectedCities.length > 1
        ? `Neighborhoods in ${selectedCities.length} cities`
        : 'All Neighborhoods';

  // Price display label
  const priceLabel = (() => {
    if (minPrice && maxPrice) {
      return `$${Number(minPrice).toLocaleString()} - $${Number(maxPrice).toLocaleString()}`;
    }
    if (minPrice) return `$${Number(minPrice).toLocaleString()}+`;
    if (maxPrice) return `Up to $${Number(maxPrice).toLocaleString()}`;
    return 'Price';
  })();

  // Beds/Baths display labels
  const bedsLabel = beds ? `${beds}+ Beds` : 'Beds';
  const bathsLabel = baths ? `${baths}+ Baths` : 'Baths';

  // Count active advanced filters
  const advancedFilterCount = [status, propertyType, propertySubType, selectedNeighborhood, ourTeam].filter(Boolean).length;

  // Shared dropdown button style
  const dropdownBtnClass = "h-[42px] px-4 border border-gray-200 bg-white text-sm text-gray-700 flex items-center justify-between gap-2 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer";
  const dropdownActiveClass = "border-[var(--rc-navy,#002349)] ring-1 ring-[var(--rc-navy,#002349)]";

  return (
    <>
      <div className="space-y-3">
        {/* Main Filters Row */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Keyword Search - Double width */}
          <div className="relative flex-shrink-0 w-full sm:w-auto sm:min-w-[320px] sm:flex-[2]  max-w-[480px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by address, MLS#, or keyword..."
              className="w-full h-[42px] pl-10 pr-4 border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 placeholder:italic focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none transition-colors"
            />
          </div>

          {/* City Multi-Select Dropdown */}
          <div ref={cityDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setCityDropdownOpen(!cityDropdownOpen);
                setPriceDropdownOpen(false);
                setBedsDropdownOpen(false);
                setBathsDropdownOpen(false);
                if (!cityDropdownOpen) setCitySearch('');
              }}
              className={`${dropdownBtnClass} min-w-[150px] ${cityDropdownOpen ? dropdownActiveClass : ''} ${selectedCities.length > 0 ? 'font-medium text-[var(--rc-navy,#002349)]' : ''}`}
            >
              <span className="truncate">{cityButtonLabel}</span>
              <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 shadow-xl" style={{ maxHeight: '380px' }}>
                <div className="p-2.5 border-b border-gray-100">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search cities..."
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                    autoFocus
                  />
                </div>
                {selectedCities.length > 0 && (
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-xs text-gray-500 font-medium">{selectedCities.length} selected</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedCities([]); setSelectedNeighborhood(''); }}
                      className="text-xs text-[var(--rc-navy,#002349)] hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                )}
                <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                  {filteredDropdownCities.map((city) => (
                    <label
                      key={city}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city)}
                        onChange={() => handleCityToggle(city)}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--rc-navy,#002349)] focus:ring-[var(--rc-navy,#002349)]"
                      />
                      <span className="text-gray-700">{city}</span>
                    </label>
                  ))}
                  {filteredDropdownCities.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-400 text-center">No cities found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Dropdown */}
          <div ref={priceDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setPriceDropdownOpen(!priceDropdownOpen);
                setCityDropdownOpen(false);
                setBedsDropdownOpen(false);
                setBathsDropdownOpen(false);
              }}
              className={`${dropdownBtnClass} min-w-[130px] ${priceDropdownOpen ? dropdownActiveClass : ''} ${minPrice || maxPrice ? 'font-medium text-[var(--rc-navy,#002349)]' : ''}`}
            >
              <span className="truncate">{priceLabel}</span>
              <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${priceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {priceDropdownOpen && (
              <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Min Price</label>
                    <select
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full h-[38px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                    >
                      {PRICE_OPTIONS.map(opt => (
                        <option key={`min-${opt.value}`} value={opt.value}>{opt.value ? opt.label : 'No Min'}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-gray-300 mt-5">—</span>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Max Price</label>
                    <select
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full h-[38px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                    >
                      {PRICE_OPTIONS.map(opt => (
                        <option key={`max-${opt.value}`} value={opt.value}>{opt.value ? opt.label : 'No Max'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                    className="mt-3 text-xs text-[var(--rc-navy,#002349)] hover:underline font-medium"
                  >
                    Clear price
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Beds Dropdown */}
          <div ref={bedsDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setBedsDropdownOpen(!bedsDropdownOpen);
                setCityDropdownOpen(false);
                setPriceDropdownOpen(false);
                setBathsDropdownOpen(false);
              }}
              className={`${dropdownBtnClass} min-w-[100px] ${bedsDropdownOpen ? dropdownActiveClass : ''} ${beds ? 'font-medium text-[var(--rc-navy,#002349)]' : ''}`}
            >
              <span>{bedsLabel}</span>
              <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${bedsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {bedsDropdownOpen && (
              <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 shadow-xl">
                {[
                  { value: '', label: 'Any Beds' },
                  { value: '1', label: '1+ Beds' },
                  { value: '2', label: '2+ Beds' },
                  { value: '3', label: '3+ Beds' },
                  { value: '4', label: '4+ Beds' },
                  { value: '5', label: '5+ Beds' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setBeds(opt.value); setBedsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${beds === opt.value ? 'bg-gray-50 font-medium text-[var(--rc-navy,#002349)]' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Baths Dropdown */}
          <div ref={bathsDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setBathsDropdownOpen(!bathsDropdownOpen);
                setCityDropdownOpen(false);
                setPriceDropdownOpen(false);
                setBedsDropdownOpen(false);
              }}
              className={`${dropdownBtnClass} min-w-[100px] ${bathsDropdownOpen ? dropdownActiveClass : ''} ${baths ? 'font-medium text-[var(--rc-navy,#002349)]' : ''}`}
            >
              <span>{bathsLabel}</span>
              <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${bathsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {bathsDropdownOpen && (
              <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 shadow-xl">
                {[
                  { value: '', label: 'Any Baths' },
                  { value: '1', label: '1+ Baths' },
                  { value: '2', label: '2+ Baths' },
                  { value: '3', label: '3+ Baths' },
                  { value: '4', label: '4+ Baths' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setBaths(opt.value); setBathsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${baths === opt.value ? 'bg-gray-50 font-medium text-[var(--rc-navy,#002349)]' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Search Button */}
          <button
            type="button"
            onClick={() => setAdvancedModalOpen(true)}
            className="h-[42px] px-5 bg-[var(--rc-navy,#002349)] text-white text-sm font-medium tracking-wide uppercase flex items-center gap-2 hover:bg-[var(--rc-navy,#002349)]/90 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            More Filters
            {advancedFilterCount > 0 && (
              <span className="ml-0.5 w-5 h-5 bg-white text-[var(--rc-navy,#002349)] rounded-full text-xs font-bold flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-[42px] px-4 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCities.map(city => (
              <FilterTag key={city} label={city} onRemove={() => setSelectedCities(prev => prev.filter(c => c !== city))} />
            ))}
            {status && <FilterTag label={status} onRemove={() => setStatus('')} />}
            {propertyType && <FilterTag label={propertyType} onRemove={() => setPropertyType('')} />}
            {propertySubType && <FilterTag label={propertySubType} onRemove={() => setPropertySubType('')} />}
            {selectedNeighborhood && <FilterTag label={selectedNeighborhood} onRemove={() => setSelectedNeighborhood('')} />}
            {minPrice && <FilterTag label={`Min $${Number(minPrice).toLocaleString()}`} onRemove={() => setMinPrice('')} />}
            {maxPrice && <FilterTag label={`Max $${Number(maxPrice).toLocaleString()}`} onRemove={() => setMaxPrice('')} />}
            {beds && <FilterTag label={`${beds}+ Beds`} onRemove={() => setBeds('')} />}
            {baths && <FilterTag label={`${baths}+ Baths`} onRemove={() => setBaths('')} />}
            {ourTeam && <FilterTag label="Our Listings" onRemove={() => setOurTeam(false)} />}
          </div>
        )}
      </div>

      {/* Advanced Search Modal */}
      {advancedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdvancedModalOpen(false)} />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--rc-navy,#002349)] text-white px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-light uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}>
                Advanced Search
              </h2>
              <button
                type="button"
                onClick={() => setAdvancedModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-[42px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-[42px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                >
                  <option value="">All Types</option>
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Property SubType */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Property Subtype</label>
                <select
                  value={propertySubType}
                  onChange={(e) => setPropertySubType(e.target.value)}
                  className="w-full h-[42px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                >
                  <option value="">All Subtypes</option>
                  {propertySubTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Neighborhoods */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Neighborhood</label>
                {neighborhoods.length > 0 ? (
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    disabled={loadingNeighborhoods}
                    className="w-full h-[42px] px-3 border border-gray-200 text-sm bg-white focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="">{neighborhoodPlaceholder}</option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    placeholder={selectedCities.length > 0 ? `Search in ${selectedCities.length === 1 ? selectedCities[0] : selectedCities.length + ' cities'}...` : 'Select a city first to see neighborhoods'}
                    className="w-full h-[42px] px-3 border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:border-[var(--rc-navy,#002349)] focus:ring-1 focus:ring-[var(--rc-navy,#002349)] focus:outline-none"
                  />
                )}
                {selectedCities.length === 0 && neighborhoods.length === 0 && (
                  <p className="mt-1.5 text-xs text-gray-400">Select a city above to see available neighborhoods</p>
                )}
              </div>

              {/* Our Listings Toggle */}
              {showOurTeamFilter && (
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Our Listings Only</span>
                    <p className="text-xs text-gray-400 mt-0.5">Show only properties listed by our team</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ourTeam}
                    onClick={() => setOurTeam(!ourTeam)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${ourTeam ? 'bg-[var(--rc-navy,#002349)]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${ourTeam ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStatus('');
                  setPropertyType('');
                  setPropertySubType('');
                  setSelectedNeighborhood('');
                  setOurTeam(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setAdvancedModalOpen(false)}
                className="h-[42px] px-8 bg-[var(--rc-navy,#002349)] text-white text-sm font-medium uppercase tracking-wide hover:bg-[var(--rc-navy,#002349)]/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Small tag component for active filters
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-xs text-gray-600 font-medium">
      {label}
      <button type="button" onClick={onRemove} className="text-gray-400 hover:text-gray-600 ml-0.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
