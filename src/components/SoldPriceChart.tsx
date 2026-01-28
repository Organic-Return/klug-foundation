'use client';

import { useMemo } from 'react';

interface MonthlyData {
  month: string;
  year: number;
  avgSoldPrice: number | null;
  avgSoldPricePerSqFt: number | null;
  salesCount: number;
}

interface SoldPriceChartProps {
  monthlyData: MonthlyData[];
  yearlyAvgSoldPrice: number | null;
  yearlyAvgSoldPricePerSqFt: number | null;
  variant?: 'classic' | 'luxury';
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `$${Math.round(price / 1000)}K`;
  }
  return `$${price.toLocaleString()}`;
}

export default function SoldPriceChart({
  monthlyData,
  yearlyAvgSoldPrice,
  yearlyAvgSoldPricePerSqFt,
  variant = 'classic',
}: SoldPriceChartProps) {
  // Calculate max values for scaling
  const { maxSoldPrice, maxPricePerSqFt } = useMemo(() => {
    let maxPrice = 0;
    let maxPsf = 0;
    monthlyData.forEach((d) => {
      if (d.avgSoldPrice && d.avgSoldPrice > maxPrice) maxPrice = d.avgSoldPrice;
      if (d.avgSoldPricePerSqFt && d.avgSoldPricePerSqFt > maxPsf) maxPsf = d.avgSoldPricePerSqFt;
    });
    // Add 20% padding to max
    return {
      maxSoldPrice: maxPrice * 1.2,
      maxPricePerSqFt: maxPsf * 1.2,
    };
  }, [monthlyData]);

  // Calculate bar height as percentage
  const getBarHeight = (value: number | null, max: number): number => {
    if (!value || max === 0) return 0;
    return Math.max(5, (value / max) * 100);
  };

  // Calculate baseline position as percentage from bottom
  const getBaselinePosition = (avg: number | null, max: number): number => {
    if (!avg || max === 0) return 0;
    return (avg / max) * 100;
  };

  const isLuxury = variant === 'luxury';

  // Check if we have any data
  const hasData = monthlyData.some((d) => d.avgSoldPrice !== null);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 p-8">
        <p className="text-center text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
          No sold data available for the selected period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800">
      {/* Section Header */}
      <div className="p-6 border-b border-[#e8e6e3] dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-[var(--color-gold)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
            Sales Trends
          </span>
        </div>
      </div>

      {/* Chart Grid - Two charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Average Sold Price Chart */}
        <div className="p-6 md:p-8 md:border-r border-b md:border-b-0 border-[#e8e6e3] dark:border-gray-800">
          <h4 className="text-xs uppercase tracking-[0.15em] text-[#6a6a6a] dark:text-gray-400 font-light mb-6 text-center">
            Avg. Sold Price by Month
          </h4>
          <div className="relative h-32">
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-full h-px bg-[#e8e6e3] dark:bg-gray-800" />
              ))}
            </div>

            {/* Baseline */}
            {yearlyAvgSoldPrice && maxSoldPrice > 0 && (
              <div
                className="absolute left-0 right-0 flex items-center z-10"
                style={{ bottom: `${getBaselinePosition(yearlyAvgSoldPrice, maxSoldPrice)}%` }}
              >
                <div className="h-px flex-1 bg-[var(--color-gold)]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-gold) 0, var(--color-gold) 4px, transparent 4px, transparent 8px)' }} />
                <span className="ml-2 text-[9px] uppercase tracking-[0.1em] text-[var(--color-gold)] font-light whitespace-nowrap">
                  {formatPrice(yearlyAvgSoldPrice)}
                </span>
              </div>
            )}

            {/* Bars */}
            <div className="flex items-end justify-between h-full gap-1 relative z-0">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip */}
                  {d.avgSoldPrice && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 text-[10px] text-[#1a1a1a] dark:text-white font-light bg-white dark:bg-[#2a2a2a] px-1.5 py-0.5 border border-[#e8e6e3] dark:border-gray-700 shadow-sm">
                      {formatPrice(d.avgSoldPrice)}
                    </div>
                  )}
                  {/* Bar */}
                  <div
                    className="w-full max-w-[24px] bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-300 hover:opacity-80"
                    style={{ height: `${getBarHeight(d.avgSoldPrice, maxSoldPrice)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Month labels */}
          <div className="flex justify-between mt-3 px-0.5">
            {monthlyData.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] uppercase tracking-[0.05em] text-[#8a8a8a] font-light">
                {d.month}
              </span>
            ))}
          </div>
        </div>

        {/* Average Price Per Sq Ft Chart */}
        <div className="p-6 md:p-8">
          <h4 className="text-xs uppercase tracking-[0.15em] text-[#6a6a6a] dark:text-gray-400 font-light mb-6 text-center">
            Avg. Sold $/Sq Ft by Month
          </h4>
          <div className="relative h-32">
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-full h-px bg-[#e8e6e3] dark:bg-gray-800" />
              ))}
            </div>

            {/* Baseline */}
            {yearlyAvgSoldPricePerSqFt && maxPricePerSqFt > 0 && (
              <div
                className="absolute left-0 right-0 flex items-center z-10"
                style={{ bottom: `${getBaselinePosition(yearlyAvgSoldPricePerSqFt, maxPricePerSqFt)}%` }}
              >
                <div className="h-px flex-1 bg-[var(--color-gold)]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-gold) 0, var(--color-gold) 4px, transparent 4px, transparent 8px)' }} />
                <span className="ml-2 text-[9px] uppercase tracking-[0.1em] text-[var(--color-gold)] font-light whitespace-nowrap">
                  ${yearlyAvgSoldPricePerSqFt}
                </span>
              </div>
            )}

            {/* Bars */}
            <div className="flex items-end justify-between h-full gap-1 relative z-0">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip */}
                  {d.avgSoldPricePerSqFt && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 text-[10px] text-[#1a1a1a] dark:text-white font-light bg-white dark:bg-[#2a2a2a] px-1.5 py-0.5 border border-[#e8e6e3] dark:border-gray-700 shadow-sm">
                      ${d.avgSoldPricePerSqFt}
                    </div>
                  )}
                  {/* Bar */}
                  <div
                    className="w-full max-w-[24px] bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-300 hover:opacity-80"
                    style={{ height: `${getBarHeight(d.avgSoldPricePerSqFt, maxPricePerSqFt)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Month labels */}
          <div className="flex justify-between mt-3 px-0.5">
            {monthlyData.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] uppercase tracking-[0.05em] text-[#8a8a8a] font-light">
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-[#e8e6e3] dark:border-gray-800 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--color-navy)] dark:bg-[var(--color-gold)]" />
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#6a6a6a] dark:text-gray-400 font-light">
            Monthly Average
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-px bg-[var(--color-gold)]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-gold) 0, var(--color-gold) 4px, transparent 4px, transparent 8px)' }} />
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#6a6a6a] dark:text-gray-400 font-light">
            12-Month Average
          </span>
        </div>
      </div>
    </div>
  );
}
