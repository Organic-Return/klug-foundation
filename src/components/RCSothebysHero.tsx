'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[] | null;
  mls_number: string;
}

interface RCSothebysHeroProps {
  cities?: string[];
  limit?: number;
  videoUrl?: string;
  fallbackImageUrl?: string;
  officeName?: string;
  minPrice?: number;
  sortBy?: 'date' | 'price';
  initialProperties?: Property[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Left arrow — triangle points left
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right
function NextArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M-0.00140381 172.407L86 86.4058L-0.00141885 0.404426L-0.00140381 172.407Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M86 86.4058L86.7071 87.1129L87.4142 86.4058L86.7071 85.6987L86 86.4058ZM-0.00140381 172.407L-1.0014 172.407L-1.0014 174.821L0.705704 173.114L-0.00140381 172.407ZM-0.00141885 0.404426L0.705689 -0.302681L-1.00142 -2.00979L-1.00142 0.404427L-0.00141885 0.404426ZM85.2929 85.6987L-0.708511 171.7L0.705704 173.114L86.7071 87.1129L85.2929 85.6987ZM-0.708526 1.11153L85.2929 87.1129L86.7071 85.6987L0.705689 -0.302681L-0.708526 1.11153ZM-1.00142 0.404427L-1.0014 172.407L0.998596 172.407L0.998581 0.404426L-1.00142 0.404427Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.2656 87.1572H20.2656L20.2656 85.6572H28.2656L62.3931 85.6572L49.2081 72.4647L50.2656 71.4072L64.5156 85.6572H70.3931L57.2081 72.4647L58.2656 71.4072L73.2656 86.4072L58.2656 101.407L57.2006 100.35L70.3931 87.1572H64.5156L50.2656 101.407L49.2006 100.35L62.3931 87.1572L28.2656 87.1572Z" fill="#002349"/>
    </svg>
  );
}

// Price range options
const PRICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '500000', label: '$500K' },
  { value: '750000', label: '$750K' },
  { value: '1000000', label: '$1M' },
  { value: '1500000', label: '$1.5M' },
  { value: '2000000', label: '$2M' },
  { value: '3000000', label: '$3M' },
  { value: '5000000', label: '$5M' },
  { value: '7500000', label: '$7.5M' },
  { value: '10000000', label: '$10M' },
  { value: '15000000', label: '$15M' },
  { value: '20000000', label: '$20M+' },
];

export default function RCSothebysHero({
  cities,
  limit = 8,
  videoUrl,
  fallbackImageUrl,
  officeName,
  minPrice,
  sortBy,
  initialProperties,
}: RCSothebysHeroProps) {
  const resolvedCities = cities || ['Aspen'];
  const router = useRouter();

  // Use server-provided properties immediately if available
  const hasInitial = initialProperties && initialProperties.length > 0;
  const [properties, setProperties] = useState<Property[]>(hasInitial ? initialProperties : []);
  const [activeIndex, setActiveIndex] = useState(() =>
    hasInitial ? Math.floor(Math.random() * initialProperties!.length) : 0
  );
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  // Search state
  const [location, setLocation] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [keyword, setKeyword] = useState('');

  // Only fetch client-side if no initial properties were provided
  useEffect(() => {
    if (hasInitial) return;
    async function fetchProperties() {
      try {
        const citiesParam = resolvedCities.length > 1
          ? `cities=${encodeURIComponent(resolvedCities.join(','))}`
          : `city=${encodeURIComponent(resolvedCities[0] || 'Aspen')}`;
        const officeParam = officeName
          ? `&officeName=${encodeURIComponent(officeName)}`
          : '';
        const minPriceParam = minPrice
          ? `&minPrice=${minPrice}`
          : '';
        const sortByParam = sortBy
          ? `&sortBy=${sortBy}`
          : '';
        const response = await fetch(`/api/featured-properties?${citiesParam}&limit=${limit}${officeParam}${minPriceParam}${sortByParam}`);
        const data = await response.json();
        const fetched = data.properties || [];
        setProperties(fetched);
        // Random starting index
        if (fetched.length > 0) {
          setActiveIndex(Math.floor(Math.random() * fetched.length));
        }
      } catch (error) {
        console.error('Error fetching hero properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, [resolvedCities, limit, officeName, minPrice, sortBy, hasInitial]);

  const goToSlide = useCallback((index: number) => {
    if (properties.length === 0) return;
    if (index < 0) index = properties.length - 1;
    if (index >= properties.length) index = 0;
    setActiveIndex(index);
  }, [properties.length]);

  const handlePrev = () => goToSlide(activeIndex - 1);
  const handleNext = () => goToSlide(activeIndex + 1);

  // Filter by city tab
  const filteredProperties = activeCity
    ? properties.filter(p => p.city.toLowerCase() === activeCity.toLowerCase())
    : properties;

  // Get unique cities from fetched properties
  const uniqueCities = Array.from(new Set(properties.map(p => p.city)));

  // Reset active index when city filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeCity]);

  const currentProperty = filteredProperties[activeIndex] || null;
  const currentPhoto = currentProperty?.photos?.[0] || null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('city', location);
    if (priceMin) params.append('minPrice', priceMin);
    if (priceMax) params.append('maxPrice', priceMax);
    if (keyword.trim()) params.append('q', keyword.trim());
    router.push(`/listings?${params.toString()}`);
  };

  const searchBar = (
    <SearchBar
      location={location}
      setLocation={setLocation}
      priceMin={priceMin}
      setPriceMin={setPriceMin}
      priceMax={priceMax}
      setPriceMax={setPriceMax}
      keyword={keyword}
      setKeyword={setKeyword}
      onSearch={handleSearch}
      cities={resolvedCities}
    />
  );

  // Loading / fallback state — show video or fallback image
  if (isLoading || filteredProperties.length === 0) {
    return (
      <div className="relative w-full overflow-hidden" style={{ height: 'calc(80vh + 120px)' }}>
        <div className="absolute inset-0">
          {videoUrl ? (
            <video
              autoPlay loop muted playsInline
              className="w-full h-full object-cover"
              poster={fallbackImageUrl}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : fallbackImageUrl ? (
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${fallbackImageUrl})` }} />
          ) : (
            <div className="w-full h-full bg-[var(--rc-navy)]" />
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="pt-20 pb-4">
            {/* City Tabs */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
              <div className="relative flex items-center justify-center gap-3 md:gap-6 lg:gap-10 pb-0 mb-0 flex-wrap">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                <button
                  onClick={() => { setActiveCity(null); setLocation(''); }}
                  className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium pb-2 border-b-2 transition-all duration-300 ${
                    !location
                      ? 'text-white border-white font-bold'
                      : 'text-white border-transparent hover:text-white'
                  }`}
                >
                  All {resolvedCities.length > 1 ? 'Cities' : resolvedCities[0]}
                </button>
                {resolvedCities.map(city => (
                  <button
                    key={city}
                    onClick={() => { setActiveCity(city); setLocation(city); }}
                    className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium pb-2 border-b-2 transition-all duration-300 ${
                      location === city
                        ? 'text-white border-white font-bold'
                        : 'text-white border-transparent hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            {searchBar}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(80vh + 120px)' }}>
      {/* Property Images — crossfade slideshow */}
      {filteredProperties.map((property, index) => {
        const photo = property.photos?.[0] || null;
        return (
          <div
            key={property.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {photo ? (
              <Image
                src={photo}
                alt={property.address || 'Featured property'}
                fill
                className="object-cover"
                sizes="100vw"
                quality={90}
                priority={index === 0}
              />
            ) : (
              <div className="w-full h-full bg-[var(--rc-navy)]" />
            )}
          </div>
        );
      })}

      {/* Signature Triangular Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-0 top-[40%] -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
        aria-label="Previous property"
      >
        <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
          <PrevArrow />
        </div>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-0 top-[40%] -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
        aria-label="Next property"
      >
        <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
          <NextArrow />
        </div>
      </button>

      {/* Property Info Card — bottom right */}
      {currentProperty && (
        <Link
          href={`/listings/${currentProperty.id}`}
          className="absolute bottom-44 md:bottom-48 right-4 md:right-8 lg:right-12 z-20 bg-white/95 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 shadow-lg hover:bg-white transition-colors duration-200 max-w-[280px] md:max-w-sm md:w-[380px] hidden sm:block"
        >
          {/* Diamond plus icon — positioned on left edge */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 bg-white border border-[var(--rc-gold)]/40 rotate-45 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-[var(--rc-navy)] -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>

          <div className="flex items-start gap-4">
            {/* Price & Location */}
            <div className="flex-1 min-w-0">
              <div className="text-[var(--rc-navy)] text-xl md:text-2xl font-light tracking-wide">
                {formatPrice(currentProperty.list_price)}
              </div>
              <div className="text-[var(--rc-brown)] text-[11px] mt-0.5 truncate">
                {currentProperty.address}
              </div>
              <div className="text-[var(--rc-brown)] text-xs uppercase tracking-[0.15em] mt-0.5">
                {currentProperty.city}{currentProperty.state ? `, ${currentProperty.state}` : ''}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 flex flex-col gap-1 text-[var(--rc-brown)] text-xs border-l border-gray-200 pl-4">
              {currentProperty.bedrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span>{currentProperty.bedrooms}</span>
                </div>
              )}
              {currentProperty.bathrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{currentProperty.bathrooms}</span>
                </div>
              )}
              {currentProperty.square_feet && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span>{currentProperty.square_feet.toLocaleString()} SQ FT</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* City Tabs + Search Bar — overlaid near bottom of hero with gradient backdrop */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="pt-20 pb-4">
          {/* City Tabs */}
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="relative flex items-center justify-center gap-3 md:gap-6 lg:gap-10 pb-0 mb-0 flex-wrap">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              <button
                onClick={() => { setActiveCity(null); setLocation(''); }}
                className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium pb-2 border-b-2 transition-all duration-300 ${
                  !location
                    ? 'text-white border-white font-bold'
                    : 'text-white border-transparent hover:text-white'
                }`}
              >
                All {resolvedCities.length > 1 ? 'Cities' : resolvedCities[0]}
              </button>
              {resolvedCities.map(city => (
                <button
                  key={city}
                  onClick={() => { setActiveCity(city); setLocation(city); }}
                  className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium pb-2 border-b-2 transition-all duration-300 ${
                    location === city
                      ? 'text-white border-white font-bold'
                      : 'text-white border-transparent hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          {searchBar}
        </div>
      </div>
    </div>
  );
}

// Extracted Search Bar component
function SearchBar({
  location,
  setLocation,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  keyword,
  setKeyword,
  onSearch,
  cities,
}: {
  location: string;
  setLocation: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  keyword: string;
  setKeyword: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  cities: string[];
}) {
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C19B5F'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.25rem center',
    backgroundSize: '1rem',
    paddingRight: '1.75rem',
  } as const;

  return (
    <div className="bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="h-[3px] bg-white" />
      </div>
      <form
        onSubmit={onSearch}
        className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center gap-3 md:gap-4 lg:gap-6"
      >
        {/* Location */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent text-white text-[11px] uppercase tracking-[0.15em] py-2 border-0 border-b border-white focus:border-[var(--rc-gold)] focus:ring-0 outline-none cursor-pointer appearance-none"
            style={selectStyle}
          >
            <option value="" className="text-gray-900 normal-case">Locations</option>
            {cities.map(c => (
              <option key={c} value={c} className="text-gray-900 normal-case">{c}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:block w-px h-6 bg-white" />

        {/* Price Min */}
        <div className="flex-1 min-w-[100px]">
          <select
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full bg-transparent text-white text-[11px] uppercase tracking-[0.15em] py-2 border-0 border-b border-white focus:border-[var(--rc-gold)] focus:ring-0 outline-none cursor-pointer appearance-none"
            style={selectStyle}
          >
            <option value="" className="text-gray-900 normal-case">Min Price</option>
            {PRICE_OPTIONS.slice(1).map(p => (
              <option key={`min-${p.value}`} value={p.value} className="text-gray-900 normal-case">{p.label}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:block w-px h-6 bg-white" />

        {/* Price Max */}
        <div className="flex-1 min-w-[100px]">
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full bg-transparent text-white text-[11px] uppercase tracking-[0.15em] py-2 border-0 border-b border-white focus:border-[var(--rc-gold)] focus:ring-0 outline-none cursor-pointer appearance-none"
            style={selectStyle}
          >
            <option value="" className="text-gray-900 normal-case">Max Price</option>
            {PRICE_OPTIONS.slice(1).map(p => (
              <option key={`max-${p.value}`} value={p.value} className="text-gray-900 normal-case">{p.label}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:block w-px h-6 bg-white" />

        {/* Keyword / MLS# */}
        <div className="flex-[2] min-w-[150px]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="KEYWORD OR MLS#"
            className="w-full bg-transparent text-white text-[11px] uppercase tracking-[0.15em] py-2 border-0 border-b border-white focus:border-[var(--rc-gold)] focus:ring-0 outline-none placeholder:text-white placeholder:uppercase placeholder:tracking-[0.15em]"
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="bg-[var(--rc-gold)] text-white text-[11px] font-black uppercase tracking-[0.1em] px-8 py-3 hover:bg-[var(--rc-gold-hover,#b08a4f)] transition-colors duration-200"
        >
          Search
        </button>
      </form>
    </div>
  );
}
