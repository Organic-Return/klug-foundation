'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface LuxuryCityStatsProps {
  title?: string;
  subtitle?: string;
  configuredCities?: string[];
}

type PropertyFilter = 'all' | 'single-family' | 'condo-townhome';

const PROPERTY_FILTERS: { value: PropertyFilter; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'single-family', label: 'Single Family Homes' },
  { value: 'condo-townhome', label: 'Condos' },
];

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

export default function LuxuryCityStats({
  title = 'Market Intelligence',
  subtitle = 'Real-time insights across our distinguished markets',
  configuredCities,
}: LuxuryCityStatsProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<CityStatsData[]>([]);
  const [activeCity, setActiveCity] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const fetchStats = useCallback(async (filter: PropertyFilter) => {
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
        // Filter to only include configured cities and maintain the configured order
        resultCities = configuredCities.filter(city => resultCities.includes(city));
        resultStats = configuredCities
          .map(city => resultStats.find((s: CityStatsData) => s.city === city))
          .filter((s): s is CityStatsData => s !== undefined);
      }

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePropertyFilterChange = (filter: PropertyFilter) => {
    setPropertyFilter(filter);
  };

  const activeCityStats = stats.find(s => s.city === activeCity);

  if (isLoading && cities.length === 0) {
    return (
      <section className="py-24 md:py-32 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className="h-3 bg-[#e8e6e3] dark:bg-white/10 rounded w-24 mx-auto mb-6" />
            <div className="h-8 bg-[#e8e6e3] dark:bg-white/10 rounded w-80 mx-auto mb-4" />
            <div className="h-4 bg-[#e8e6e3] dark:bg-white/10 rounded w-96 mx-auto mb-12" />
          </div>
        </div>
      </section>
    );
  }

  if (cities.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#f8f7f5] dark:bg-[#141414]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
            {title}
          </h2>

          <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Property Type Tabs */}
        <div
          className={`flex justify-center mb-10 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex border border-[#e8e6e3] dark:border-gray-700">
            {PROPERTY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handlePropertyFilterChange(filter.value)}
                className={`px-6 py-3 text-xs uppercase tracking-[0.15em] font-light transition-all duration-300 ${
                  propertyFilter === filter.value
                    ? 'bg-[var(--color-navy)] dark:bg-[var(--color-gold)] text-white'
                    : 'bg-white dark:bg-[#1a1a1a] text-[#6a6a6a] dark:text-gray-400 hover:text-[#1a1a1a] dark:hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* City Tabs */}
        <div
          className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {cities.slice(0, 10).map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-light transition-all duration-300 border ${
                activeCity === city
                  ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] border-[#1a1a1a] dark:border-white'
                  : 'bg-transparent text-[#6a6a6a] dark:text-gray-400 border-[#d0d0d0] dark:border-gray-600 hover:border-[#1a1a1a] dark:hover:border-white hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Stats Content */}
        {isLoading ? (
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-[#e8e6e3] dark:bg-white/10 rounded w-20 mx-auto mb-3" />
                  <div className="h-4 bg-[#e8e6e3] dark:bg-white/10 rounded w-28 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : activeCityStats ? (
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Main Stats Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800">
              {/* Top Row - Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#e8e6e3] dark:border-gray-800">
                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800">
                  <p className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {activeCityStats.totalActiveListings}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Total Active Listings
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800 md:border-r">
                  <p className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {activeCityStats.totalUnderContract}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Under Contract
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800">
                  <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {formatPrice(activeCityStats.avgListPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Avg. Price
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center">
                  <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    ${activeCityStats.avgPricePerSqFt.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Avg. Price/Sq Ft
                  </p>
                </div>
              </div>

              {/* Bottom Row - Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800">
                  <p className="text-xl md:text-2xl font-light text-[var(--color-gold)] mb-2">
                    {formatPrice(activeCityStats.highestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Highest Listing
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800 md:border-r">
                  <p className="text-xl md:text-2xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {formatPrice(activeCityStats.lowestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Lowest Listing
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-[#e8e6e3] dark:border-gray-800">
                  <p className="text-xl md:text-2xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {activeCityStats.avgSoldPrice ? formatPrice(activeCityStats.avgSoldPrice) : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Avg. Sold Price (1 Yr)
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center">
                  <p className="text-xl md:text-2xl font-light text-[#1a1a1a] dark:text-white mb-2">
                    {activeCityStats.avgDaysOnMarket != null ? `${activeCityStats.avgDaysOnMarket} days` : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
                    Avg. Days on Market
                  </p>
                </div>
              </div>
            </div>

            {/* View Market Reports Link */}
            <div className="text-center mt-10">
              <Link
                href="/listings"
                className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-light text-[#1a1a1a] dark:text-white hover:text-[var(--color-gold)] transition-colors duration-300"
              >
                View All Listings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className={`text-center py-16 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light tracking-wide">
              No data available for the selected filters
            </p>
          </div>
        )}

        {/* Data Source */}
        <div
          className={`text-center mt-12 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#9a9a9a] font-light">
            Data updated in real-time from MLS
          </p>
        </div>
      </div>
    </section>
  );
}
