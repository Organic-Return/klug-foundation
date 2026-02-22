'use client';

import { useState, useEffect, useCallback } from 'react';
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
    <section className="py-16 md:py-24 bg-[var(--rc-navy)]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-white mb-4">
            {title}
          </h1>

          <p className="text-white/70 font-light text-[17px] max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Property Type Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex border border-white/20">
            {PROPERTY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handlePropertyFilterChange(filter.value)}
                className={`px-6 py-3 text-xs uppercase tracking-[0.15em] font-light transition-all duration-300 ${
                  propertyFilter === filter.value
                    ? 'bg-white text-[var(--rc-navy)]'
                    : 'bg-transparent text-white/60 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* City Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cities.slice(0, 10).map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`px-5 py-2.5 text-xs uppercase tracking-[0.15em] font-light transition-all duration-300 border ${
                activeCity === city
                  ? 'bg-white text-[var(--rc-navy)] border-white'
                  : 'bg-transparent text-white/60 border-white/30 hover:border-white hover:text-white'
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
            <div className="bg-white/10 border border-white/20">
              {/* Top Row - Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/20">
                <div className="p-6 md:p-8 text-center border-r border-white/20">
                  <p className="text-3xl md:text-4xl font-light text-white mb-2">
                    {activeCityStats.totalActiveListings}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Total Active Listings
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-white/20 md:border-r">
                  <p className="text-3xl md:text-4xl font-light text-white mb-2">
                    {activeCityStats.totalUnderContract}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Under Contract
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-white/20">
                  <p className="text-2xl md:text-3xl font-light text-white mb-2">
                    {formatPrice(activeCityStats.avgListPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Avg. Price
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center">
                  <p className="text-2xl md:text-3xl font-light text-white mb-2">
                    ${activeCityStats.avgPricePerSqFt.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Avg. Price/Sq Ft
                  </p>
                </div>
              </div>

              {/* Bottom Row - Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-6 md:p-8 text-center border-r border-white/20">
                  <p className="text-xl md:text-2xl font-light text-[var(--rc-gold)] mb-2">
                    {formatPrice(activeCityStats.highestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Highest Listing
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-white/20 md:border-r">
                  <p className="text-xl md:text-2xl font-light text-white mb-2">
                    {formatPrice(activeCityStats.lowestPrice)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Lowest Listing
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center border-r border-white/20">
                  <p className="text-xl md:text-2xl font-light text-white mb-2">
                    {activeCityStats.avgSoldPrice ? formatPrice(activeCityStats.avgSoldPrice) : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Avg. Sold Price (1 Yr)
                  </p>
                </div>

                <div className="p-6 md:p-8 text-center">
                  <p className="text-xl md:text-2xl font-light text-white mb-2">
                    {activeCityStats.avgDaysOnMarket != null ? `${activeCityStats.avgDaysOnMarket} days` : 'N/A'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Avg. Days on Market
                  </p>
                </div>
              </div>
            </div>

            {/* View Market Reports Link */}
            <div className="text-center mt-10">
              <Link
                href="/listings"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--rc-gold)] text-white px-8 py-4 border border-[var(--rc-gold)] hover:bg-transparent hover:border-white hover:text-white"
              >
                View All Listings
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
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
