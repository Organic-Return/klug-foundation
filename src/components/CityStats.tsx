'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface MonthlyData {
  month: string;
  year: number;
  avgSoldPrice: number | null;
  avgSoldPricePerSqFt: number | null;
  salesCount: number;
}

interface CityStatsData {
  city: string;
  totalActiveListings: number;
  totalUnderContract: number;
  avgListPrice: number;
  avgPricePerSqFt: number;
  lowestPrice: number;
  highestPrice: number;
  avgSoldPrice: number | null;
  avgSoldPricePerSqFt: number | null;
  avgDaysOnMarket: number | null;
  monthlyData: MonthlyData[];
  priorYearMonthlyData: MonthlyData[];
  priorYearAvgSoldPrice: number | null;
  priorYearAvgSoldPricePerSqFt: number | null;
}

interface CityStatsProps {
  title?: string;
  subtitle?: string;
  configuredCities?: string[];
}

type PropertyFilter = 'all' | 'single-family' | 'condo-townhome' | 'land';

const PROPERTY_FILTERS: { value: PropertyFilter; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'single-family', label: 'Single Family Homes' },
  { value: 'condo-townhome', label: 'Condos' },
  { value: 'land', label: 'Land' },
];

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

export default function CityStats({
  title = 'Market Insights',
  subtitle = 'Real-time market data across our featured communities',
  configuredCities,
}: CityStatsProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<CityStatsData[]>([]);
  const [activeCity, setActiveCity] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const statsCache = useRef<Record<string, { cities: string[]; stats: CityStatsData[] }>>({});

  const fetchStats = useCallback(async (filter: PropertyFilter) => {
    // Return cached data if available
    const cacheKey = `${filter}-${configuredCities?.join(',') || 'all'}`;
    if (statsCache.current[cacheKey]) {
      const cached = statsCache.current[cacheKey];
      setCities(cached.cities);
      setStats(cached.stats);
      if (cached.cities.length > 0) {
        setActiveCity((prev) => prev && cached.cities.includes(prev) ? prev : cached.cities[0]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Build URL with optional cities parameter
      let url = `/api/city-stats?propertyType=${filter}`;
      if (configuredCities && configuredCities.length > 0) {
        url += `&cities=${encodeURIComponent(configuredCities.join(','))}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      // If configured cities are provided, filter and order the results
      let resultCities = data.cities || [];
      let resultStats = data.stats || [];

      if (configuredCities && configuredCities.length > 0) {
        // Use Map for O(1) lookup instead of find()
        const statsMap = new Map(resultStats.map((s: CityStatsData) => [s.city, s]));
        resultCities = configuredCities.filter(city => resultCities.includes(city));
        resultStats = configuredCities
          .map(city => statsMap.get(city))
          .filter((s): s is CityStatsData => s !== undefined);
      }

      // Cache the result
      statsCache.current[cacheKey] = { cities: resultCities, stats: resultStats };

      setCities(resultCities);
      setStats(resultStats);
      if (resultCities.length > 0) {
        setActiveCity((prev) => {
          if (prev && resultCities.includes(prev)) {
            return prev;
          }
          return resultCities[0];
        });
      } else {
        setActiveCity('');
      }
    } catch (error) {
      console.error('Error fetching city stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [configuredCities]);

  useEffect(() => {
    fetchStats(propertyFilter);
  }, [propertyFilter, fetchStats]);

  const handlePropertyFilterChange = (filter: PropertyFilter) => {
    setPropertyFilter(filter);
  };

  const activeCityStats = stats.find(s => s.city === activeCity);

  if (isLoading && cities.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-[var(--rc-navy)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className="h-3 bg-white/10 rounded w-24 mx-auto mb-6" />
            <div className="h-8 bg-white/10 rounded w-80 mx-auto mb-4" />
            <div className="h-4 bg-white/10 rounded w-96 mx-auto mb-12" />
          </div>
        </div>
      </section>
    );
  }

  if (cities.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-[var(--rc-navy)]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-white mb-4">
            {title}
          </h1>

          <p className="text-white/70 font-light text-[17px] max-w-2xl mx-auto mb-6">
            {subtitle}
          </p>
          <div className="w-12 h-px bg-[#c9ac77] mx-auto" />
        </div>

        {/* Property Type Tabs */}
        <div className="flex justify-center gap-6 mb-10">
          {PROPERTY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handlePropertyFilterChange(filter.value)}
              className={`klug-stats-tab px-1 pb-2 text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-300 border-b-2 ${
                propertyFilter === filter.value
                  ? 'text-[#c9ac77] border-[#c9ac77]'
                  : 'text-white/50 border-transparent hover:text-white hover:border-white/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* City Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cities.slice(0, 10).map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`klug-stats-tab px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-300 border ${
                activeCity === city
                  ? 'bg-[#c9ac77] text-white border-[#c9ac77]'
                  : 'bg-transparent text-white/60 border-white/30 hover:border-[#c9ac77] hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Stats Content */}
        {isLoading ? (
          <div className="bg-white/10 border border-white/20 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-white/10 rounded w-20 mx-auto mb-3" />
                  <div className="h-4 bg-white/10 rounded w-28 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : activeCityStats ? (
          <div>
            {/* Main Stats Card */}
            <div className="bg-white/5 border border-[#c9ac77]/30">
              {/* Top Row - Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#c9ac77]/20">
                <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                  <p className="text-[2rem] md:text-[2.5rem] font-semibold text-[#c9ac77] mb-2">
                    {activeCityStats.totalActiveListings}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Total Active Listings
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20 md:border-r">
                  <p className="text-[2rem] md:text-[2.5rem] font-semibold text-[#c9ac77] mb-2">
                    {activeCityStats.totalUnderContract}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Under Contract
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                  <p className="text-[1.625rem] md:text-[2rem] font-semibold text-white mb-2">
                    {formatPrice(activeCityStats.avgListPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Avg. Price
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center">
                  <p className="text-[1.625rem] md:text-[2rem] font-semibold text-white mb-2">
                    {activeCityStats.avgDaysOnMarket != null ? `${activeCityStats.avgDaysOnMarket}` : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Avg. Days on Market
                  </p>
                </div>
              </div>

              {/* Bottom Row - Secondary Metrics */}
              <div className={`grid ${propertyFilter !== 'land' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
                <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                  <p className="text-[1.375rem] md:text-[1.625rem] font-semibold text-[#c9ac77] mb-2">
                    {formatPrice(activeCityStats.highestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Highest Listing
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                  <p className="text-[1.375rem] md:text-[1.625rem] font-semibold text-white mb-2">
                    {formatPrice(activeCityStats.lowestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Lowest Listing
                  </p>
                </div>

                <div className={`p-6 md:p-8 text-center ${propertyFilter !== 'land' ? 'border-r border-[#c9ac77]/20' : ''}`}>
                  <p className="text-[1.375rem] md:text-[1.625rem] font-semibold text-white mb-2">
                    {activeCityStats.avgSoldPrice ? formatPrice(activeCityStats.avgSoldPrice) : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Avg. Sold Price (1 Yr)
                  </p>
                </div>

                {/* Avg Price/Sq Ft - only for single-family and condos */}
                {propertyFilter !== 'land' && (
                  <div className="p-6 md:p-8 text-center">
                    <p className="text-[1.375rem] md:text-[1.625rem] font-semibold text-white mb-2">
                      {activeCityStats.avgPricePerSqFt ? `$${activeCityStats.avgPricePerSqFt.toLocaleString()}` : 'N/A'}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                      Avg. Price/Sq Ft
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* View Market Reports Link */}
            <div className="text-center mt-10">
              <Link
                href="/listings"
                className="sir-btn sir-btn--gold-light"
              >
                <span>View All Listings</span>
                <span className="sir-arrow" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/50 text-sm font-light tracking-wide">
              No data available for the selected filters
            </p>
          </div>
        )}

        {/* Data Source */}
        <div className="text-center mt-12">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-light">
            Data updated in real-time from MLS
          </p>
        </div>
      </div>
    </section>
  );
}
