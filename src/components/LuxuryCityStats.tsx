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
  avgSpLpRatio: number | null;
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
  { value: 'all', label: 'All' },
  { value: 'single-family', label: 'Single Family' },
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
      let url = `/api/city-stats?propertyType=${filter}`;
      if (configuredCities && configuredCities.length > 0) {
        url += `&cities=${encodeURIComponent(configuredCities.join(','))}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      let resultCities = data.cities || [];
      let resultStats = data.stats || [];

      if (configuredCities && configuredCities.length > 0) {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  const activeCityStats = stats.find(s => s.city === activeCity);

  if (isLoading && cities.length === 0) {
    return (
      <section ref={sectionRef} className="py-24 md:py-32 bg-[#f6f1eb]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className="h-3 bg-[var(--color-taupe)] rounded w-24 mx-auto mb-6" />
            <div className="h-8 bg-[var(--color-taupe)] rounded w-80 mx-auto mb-4" />
            <div className="h-4 bg-[var(--color-taupe)] rounded w-96 mx-auto mb-12" />
          </div>
        </div>
      </section>
    );
  }

  if (cities.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-36 bg-[#f6f1eb] relative overflow-hidden">

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative">
        {/* Header */}
        <div
          className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
            Market Data
          </p>
          <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide mb-5">
            {title}
          </h2>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-5" />
          <p className="font-luxury-body text-[var(--color-warm-gray)] font-light max-w-xl mx-auto text-sm tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Controls Row — City tabs + Property filter */}
        <div
          className={`mb-14 md:mb-16 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* City Tabs */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8">
            {cities.slice(0, 10).map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`font-luxury text-sm md:text-base tracking-wide transition-all duration-500 pb-1 border-b ${
                  activeCity === city
                    ? 'text-[var(--color-gold)] border-[var(--color-gold)]'
                    : 'text-[var(--color-warm-gray)] border-transparent hover:text-[var(--color-charcoal)]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Property Filter */}
          <div className="flex justify-center gap-6">
            {PROPERTY_FILTERS.map((filter, index) => (
              <span key={filter.value} className="flex items-center gap-6">
                <button
                  onClick={() => setPropertyFilter(filter.value)}
                  className={`font-luxury-body text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    propertyFilter === filter.value
                      ? 'text-[var(--color-charcoal)]'
                      : 'text-[var(--color-warm-gray)]/50 hover:text-[var(--color-charcoal)]'
                  }`}
                >
                  {filter.label}
                </button>
                {index < PROPERTY_FILTERS.length - 1 && (
                  <span className="w-px h-3 bg-[var(--color-taupe)]" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Content */}
        {isLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-[var(--color-taupe)] rounded w-16 mx-auto mb-3" />
                  <div className="h-3 bg-[var(--color-taupe)]/50 rounded w-20 mx-auto" />
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
            {/* City Name */}
            <div className="text-center mb-12">
              <h3 className="font-luxury text-xl md:text-2xl font-light text-[var(--color-charcoal)] tracking-[0.08em]">
                {activeCityStats.city}
              </h3>
            </div>

            {/* Stats Grid — 6 columns on desktop, 3 on tablet, 2 on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--color-taupe)]/30">
              {/* Active Listings */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-3xl md:text-4xl font-light text-[var(--color-gold)] mb-3">
                  {activeCityStats.totalActiveListings}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Active Listings
                </p>
              </div>

              {/* Under Contract */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-3xl md:text-4xl font-light text-[var(--color-charcoal)] mb-3">
                  {activeCityStats.totalUnderContract}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Under Contract
                </p>
              </div>

              {/* Avg List Price */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-2xl md:text-3xl font-light text-[var(--color-charcoal)] mb-3">
                  {formatPrice(activeCityStats.avgListPrice)}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Avg. List Price
                </p>
              </div>

              {/* Avg Price Per Sq Ft */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-2xl md:text-3xl font-light text-[var(--color-charcoal)] mb-3">
                  ${activeCityStats.avgPricePerSqFt.toLocaleString()}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Avg. Price / Sq Ft
                </p>
              </div>

              {/* Highest Listing */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-2xl md:text-3xl font-light text-[var(--color-gold)] mb-3">
                  {formatPrice(activeCityStats.highestPrice)}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Highest Listing
                </p>
              </div>

              {/* Avg SP/LP Ratio */}
              <div className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                <p className="font-luxury text-2xl md:text-3xl font-light text-[var(--color-charcoal)] mb-3">
                  {activeCityStats.avgSpLpRatio != null ? `${activeCityStats.avgSpLpRatio}%` : 'N/A'}
                </p>
                <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                  Avg. SP/LP Ratio
                </p>
              </div>
            </div>

            {/* Lowest Price footnote */}
            <div className="mt-6 text-center">
              <p className="font-luxury-body text-[10px] text-[var(--color-warm-gray)]/50 tracking-wide">
                Price range: {formatPrice(activeCityStats.lowestPrice)} — {formatPrice(activeCityStats.highestPrice)}
              </p>
            </div>

            {/* View All Listings Link */}
            <div className="text-center mt-12">
              <Link
                href="/listings"
                className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
              >
                <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                  View All Listings
                </span>
                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
            <p className="font-luxury-body text-[var(--color-warm-gray)] text-sm font-light tracking-wide">
              No data available for the selected filters
            </p>
          </div>
        )}

        {/* Data Source */}
        <div
          className={`text-center mt-14 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)]/40 font-light">
            Data updated in real-time from MLS
          </p>
        </div>
      </div>
    </section>
  );
}
