'use client';

import { useState, useEffect } from 'react';

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
}

interface CustomOneMarketStatsProps {
  city: string;
  title?: string;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

export default function CustomOneMarketStats({
  city,
  title = 'Market Insights',
}: CustomOneMarketStatsProps) {
  const [sfStats, setSfStats] = useState<CityStatsData | null>(null);
  const [condoStats, setCondoStats] = useState<CityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    async function fetchBoth() {
      setIsLoading(true);
      try {
        const [sfRes, condoRes] = await Promise.all([
          fetch(`/api/city-stats?propertyType=single-family&city=${encodeURIComponent(city)}`),
          fetch(`/api/city-stats?propertyType=condo-townhome&city=${encodeURIComponent(city)}`),
        ]);

        const sfData = await sfRes.json();
        const condoData = await condoRes.json();

        setSfStats(sfData.stats?.find((s: CityStatsData) => s.city === city) || null);
        setCondoStats(condoData.stats?.find((s: CityStatsData) => s.city === city) || null);
      } catch (error) {
        console.error('Error fetching market stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoth();
  }, [city]);

  if (!city) return null;

  const renderColumn = (label: string, stats: CityStatsData | null) => {
    const metrics = stats
      ? [
          { value: stats.totalActiveListings.toString(), label: 'Active Listings' },
          { value: stats.totalUnderContract.toString(), label: 'Under Contract' },
          { value: `$${stats.avgPricePerSqFt.toLocaleString()}`, label: 'Avg. Price / Sq Ft' },
          { value: formatPrice(stats.avgListPrice), label: 'Avg. Price' },
        ]
      : [];

    return (
      <div>
        <h3 className="text-xl md:text-2xl font-light text-white tracking-wide mb-8 text-center">
          {label}
        </h3>
        <div className="w-10 h-[1px] bg-[var(--modern-gold)] mx-auto mb-10" />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center py-6">
                <div className="h-8 bg-white/10 rounded w-20 mx-auto mb-3" />
                <div className="h-3 bg-white/5 rounded w-28 mx-auto" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
            {metrics.map((metric, i) => (
              <div key={i} className="bg-[var(--modern-black)] p-6 md:p-8 text-center">
                <p className="text-2xl md:text-3xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                  {metric.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-sm font-light text-center">
            No data available
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="py-24 md:py-32 bg-[var(--modern-black)] relative overflow-hidden">
      {/* Textured background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
          }}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide">
            {title}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-24">
          {/* Vertical divider on desktop */}
          <div className="relative">
            {renderColumn('Single Family Homes', sfStats)}
          </div>
          <div className="relative md:border-l md:border-white/[0.06] md:pl-12 lg:pl-24">
            {renderColumn('Condos & Townhomes', condoStats)}
          </div>
        </div>
      </div>
    </section>
  );
}
