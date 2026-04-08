'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SoldPriceChart from './SoldPriceChart';

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
}

interface CommunityMarketStatsProps {
  city: string;
  title?: string;
  subtitle?: string;
  variant?: 'classic' | 'luxury';
}

type PropertyFilter = 'all' | 'single-family' | 'condo-townhome' | 'land';

const PROPERTY_FILTERS: { value: PropertyFilter; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'single-family', label: 'Single Family' },
  { value: 'condo-townhome', label: 'Condos' },
  { value: 'land', label: 'Land' },
];

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

export default function CommunityMarketStats({
  city,
  title = 'Market Insights',
  subtitle,
  variant = 'classic',
}: CommunityMarketStatsProps) {
  const [stats, setStats] = useState<CityStatsData | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const isLuxury = variant === 'luxury';

  const fetchStats = useCallback(async (filter: PropertyFilter) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/city-stats?propertyType=${filter}&city=${encodeURIComponent(city)}`);
      const data = await response.json();
      const cityStats = data.stats?.find((s: CityStatsData) => s.city === city);
      setStats(cityStats || null);
    } catch (error) {
      console.error('Error fetching city stats:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    if (city) {
      fetchStats(propertyFilter);
    }
  }, [propertyFilter, city, fetchStats]);

  if (!city) return null;

  const sectionBg = isLuxury ? 'bg-[#f6f1eb]' : 'bg-[var(--rc-navy,#00254a)]';
  const skeletonBg = isLuxury ? 'bg-[var(--color-taupe)]' : 'bg-[#e8e6e3] dark:bg-white/10';

  if (isLoading && !stats) {
    return (
      <section className={`py-24 md:py-32 ${sectionBg}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className={`h-3 ${skeletonBg} rounded w-24 mx-auto mb-6`} />
            <div className={`h-8 ${skeletonBg} rounded w-80 mx-auto mb-4`} />
            <div className={`h-4 ${skeletonBg} rounded w-96 mx-auto mb-12`} />
          </div>
        </div>
      </section>
    );
  }

  if (!stats && !isLoading) {
    return (
      <section className={`py-24 md:py-32 ${sectionBg}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center">
            <h2 className={`text-3xl md:text-4xl mb-4 ${isLuxury ? 'font-luxury font-light text-[var(--color-charcoal)] tracking-wide' : 'font-serif font-light text-white tracking-wide'}`}>
              {title}
            </h2>
            <p className={isLuxury ? 'font-luxury-body text-[var(--color-warm-gray)] font-light' : 'text-white/70 font-light'}>
              No market data available for {city}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-24 md:py-32 ${sectionBg}`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          {isLuxury && (
            <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
              Market Data
            </p>
          )}
          <h2 className={`text-3xl md:text-4xl mb-4 ${isLuxury ? 'font-luxury font-light text-[var(--color-charcoal)] tracking-wide' : 'font-serif font-light text-white tracking-wide'}`}>
            {title}
          </h2>
          {isLuxury && <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-5" />}
          <p className={`max-w-2xl mx-auto mb-6 ${isLuxury ? 'font-luxury-body text-[var(--color-warm-gray)] font-light text-sm tracking-wide' : 'text-white/70 font-light'}`}>
            {subtitle || `Real-time market data for ${city}`}
          </p>
          {!isLuxury && <div className="w-12 h-px bg-[#c9ac77] mx-auto" />}
        </div>

        {/* Property Type Tabs */}
        <div className="flex justify-center mb-12">
          {isLuxury ? (
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
          ) : (
            <div className="flex justify-center gap-6">
              {PROPERTY_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setPropertyFilter(filter.value)}
                  className={`klug-stats-tab px-1 pb-2 text-xs uppercase tracking-[0.15em] font-light transition-all duration-300 border-b-2 ${
                    propertyFilter === filter.value
                      ? 'text-[#c9ac77] border-[#c9ac77]'
                      : 'text-white/50 border-transparent hover:text-white hover:border-white/30'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Content */}
        {isLoading ? (
          <div className={`${isLuxury ? '' : 'bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800'} p-8 md:p-12`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="text-center">
                  <div className={`h-8 ${skeletonBg} rounded w-20 mx-auto mb-3`} />
                  <div className={`h-4 ${skeletonBg}/50 rounded w-28 mx-auto`} />
                </div>
              ))}
            </div>
          </div>
        ) : stats ? (
          <div>
            {isLuxury ? (
              /* Luxury Stats Grid */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-taupe)]/30">
                {[
                  { value: stats.totalActiveListings.toString(), label: 'Active Listings', gold: true, large: true },
                  { value: stats.totalUnderContract.toString(), label: 'Under Contract', large: true },
                  { value: formatPrice(stats.avgListPrice), label: 'Avg. List Price' },
                  { value: `$${stats.avgPricePerSqFt.toLocaleString()}`, label: 'Avg. Price / Sq Ft' },
                  { value: formatPrice(stats.highestPrice), label: 'Highest Listing', gold: true },
                  { value: formatPrice(stats.lowestPrice), label: 'Lowest Listing' },
                  { value: stats.avgSoldPrice ? formatPrice(stats.avgSoldPrice) : 'N/A', label: 'Avg. Sold Price (1 Yr)' },
                  { value: stats.avgDaysOnMarket != null ? `${stats.avgDaysOnMarket}` : 'N/A', label: 'Avg. Days on Market' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#f6f1eb] p-6 md:p-8 text-center">
                    <p className={`font-luxury ${stat.large ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'} font-light ${stat.gold ? 'text-[var(--color-gold)]' : 'text-[var(--color-charcoal)]'} mb-3`}>
                      {stat.value}
                    </p>
                    <p className="font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)] font-light">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Classic Stats Card - matching homepage gold style */
              <div className="bg-white/5 border border-[#c9ac77]/30">
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#c9ac77]/20">
                  <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                    <p className="text-3xl md:text-4xl font-light text-[#c9ac77] mb-2">{stats.totalActiveListings}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Total Active Listings</p>
                  </div>
                  <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                    <p className="text-3xl md:text-4xl font-light text-[#c9ac77] mb-2">{stats.totalUnderContract}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Under Contract</p>
                  </div>
                  <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                    <p className="text-2xl md:text-3xl font-light text-white mb-2">{formatPrice(stats.avgListPrice)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Avg. Price</p>
                  </div>
                  <div className="p-6 md:p-8 text-center">
                    <p className="text-2xl md:text-3xl font-light text-white mb-2">{stats.avgDaysOnMarket != null ? `${stats.avgDaysOnMarket}` : 'N/A'}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Avg. Days on Market</p>
                  </div>
                </div>
                <div className={`grid ${propertyFilter !== 'land' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
                  <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                    <p className="text-xl md:text-2xl font-light text-[#c9ac77] mb-2">{formatPrice(stats.highestPrice)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Highest Listing</p>
                  </div>
                  <div className="p-6 md:p-8 text-center border-r border-[#c9ac77]/20">
                    <p className="text-xl md:text-2xl font-light text-white mb-2">{formatPrice(stats.lowestPrice)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Lowest Listing</p>
                  </div>
                  <div className={`p-6 md:p-8 text-center ${propertyFilter !== 'land' ? 'border-r border-[#c9ac77]/20' : ''}`}>
                    <p className="text-xl md:text-2xl font-light text-white mb-2">{stats.avgSoldPrice ? formatPrice(stats.avgSoldPrice) : 'N/A'}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Avg. Sold Price (1 Yr)</p>
                  </div>
                  {propertyFilter !== 'land' && (
                    <div className="p-6 md:p-8 text-center">
                      <p className="text-xl md:text-2xl font-light text-white mb-2">{stats.avgPricePerSqFt ? `$${stats.avgPricePerSqFt.toLocaleString()}` : 'N/A'}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Avg. Price/Sq Ft</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sold Price Charts */}
            {stats.monthlyData && stats.monthlyData.length > 0 && (
              <div className="mt-12">
                <SoldPriceChart
                  monthlyData={stats.monthlyData}
                  yearlyAvgSoldPrice={stats.avgSoldPrice}
                  yearlyAvgSoldPricePerSqFt={stats.avgSoldPricePerSqFt}
                  variant={isLuxury ? 'luxury' : 'classic'}
                />
              </div>
            )}

            {/* View All Listings Link */}
            <div className="text-center mt-10">
              {isLuxury ? (
                <Link
                  href={`/listings?city=${encodeURIComponent(city)}`}
                  className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
                >
                  <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                    View All {city} Listings
                  </span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/listings?city=${encodeURIComponent(city)}`}
                  className="klug-hero-btn sir-btn sir-btn--light inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-transparent text-white px-8 py-4 border border-white hover:bg-white hover:text-[#0a275d]"
                >
                  <span>View All {city} Listings</span>
                  <span className="sir-arrow" />
                </Link>
              )}
            </div>
          </div>
        ) : null}

        {/* Data Source */}
        <div className="text-center mt-12">
          <p className={isLuxury
            ? 'font-luxury-body text-[9px] uppercase tracking-[0.2em] text-[var(--color-warm-gray)]/40 font-light'
            : 'text-[9px] uppercase tracking-[0.2em] text-white/40 font-light'
          }>
            Data updated in real-time from MLS
          </p>
        </div>
      </div>
    </section>
  );
}
