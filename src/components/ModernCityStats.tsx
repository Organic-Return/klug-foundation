'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CityData {
  city: string;
  stats: {
    medianPrice: number;
    activeListings: number;
    avgDaysOnMarket: number;
    priceChange: number;
  };
}

interface ApiCityStat {
  city: string;
  totalActiveListings: number;
  avgListPrice: number;
  avgSoldPrice: number | null;
  avgDaysOnMarket: number | null;
  priorYearAvgSoldPrice: number | null;
}

interface ModernCityStatsProps {
  title?: string;
  subtitle?: string;
  configuredCities?: string[];
}

export default function ModernCityStats({
  title = 'Market Insights',
  subtitle = 'Real-time data from leading markets',
  configuredCities,
}: ModernCityStatsProps) {
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
  }, []);

  useEffect(() => {
    async function fetchCityStats() {
      try {
        const cityParam = configuredCities?.length
          ? `?cities=${configuredCities.join(',')}`
          : '';
        const response = await fetch(`/api/city-stats${cityParam}`);
        if (response.ok) {
          const data = await response.json();
          // Transform the API response to the expected format
          const transformedData: CityData[] = (data.stats || []).map((stat: ApiCityStat) => {
            // Calculate YoY price change
            let priceChange = 0;
            if (stat.avgSoldPrice && stat.priorYearAvgSoldPrice) {
              priceChange = Math.round(
                ((stat.avgSoldPrice - stat.priorYearAvgSoldPrice) / stat.priorYearAvgSoldPrice) * 100
              );
            }

            return {
              city: stat.city,
              stats: {
                medianPrice: stat.avgSoldPrice || stat.avgListPrice,
                activeListings: stat.totalActiveListings,
                avgDaysOnMarket: stat.avgDaysOnMarket || 0,
                priceChange,
              },
            };
          });
          setCityData(transformedData);
        }
      } catch (error) {
        console.error('Error fetching city stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCityStats();
  }, [configuredCities]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <section className="py-24 bg-[var(--modern-gray-bg)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (cityData.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[var(--modern-gray-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-4">
            Analytics
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-dark)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--modern-gray)] mt-4 text-base md:text-lg font-light max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cityData.map((data, index) => (
            <Link
              key={data.city}
              href={`/listings?city=${encodeURIComponent(data.city)}`}
              className={`group bg-white p-8 border border-[var(--modern-gray-lighter)] hover:border-[var(--modern-gold)] transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* City Name */}
              <h3 className="text-xl font-normal text-[var(--modern-dark)] tracking-wide mb-6 pb-4 border-b border-[var(--modern-gray-lighter)]">
                {data.city}
              </h3>

              {/* Stats */}
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--modern-gray)] uppercase tracking-[0.15em]">Median Price</span>
                  <span className="text-lg font-light text-[var(--modern-dark)]">{formatPrice(data.stats.medianPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--modern-gray)] uppercase tracking-[0.15em]">Active Listings</span>
                  <span className="text-lg font-light text-[var(--modern-dark)]">{data.stats.activeListings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--modern-gray)] uppercase tracking-[0.15em]">Avg. Days on Market</span>
                  <span className="text-lg font-light text-[var(--modern-dark)]">{data.stats.avgDaysOnMarket}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--modern-gray)] uppercase tracking-[0.15em]">YoY Change</span>
                  <span className={`text-lg font-light ${data.stats.priceChange >= 0 ? 'text-[var(--modern-green)]' : 'text-red-600'}`}>
                    {data.stats.priceChange >= 0 ? '+' : ''}{data.stats.priceChange}%
                  </span>
                </div>
              </div>

              {/* View arrow */}
              <div className="mt-6 pt-4 border-t border-[var(--modern-gray-lighter)] flex items-center justify-end">
                <span className="text-xs text-[var(--modern-gray)] uppercase tracking-[0.15em] mr-2 group-hover:text-[var(--modern-gold)] transition-colors duration-300">
                  View Listings
                </span>
                <svg
                  className="w-4 h-4 text-[var(--modern-gray)] group-hover:text-[var(--modern-gold)] transform group-hover:translate-x-1 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
