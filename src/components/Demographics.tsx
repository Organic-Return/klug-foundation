import { formatCurrency, formatNumber } from '@/lib/census';

interface DemographicsProps {
  demographics?: {
    population?: number;
    households?: number;
    medianAge?: number;
    medianIncome?: number;
    bachelorsDegreePercent?: number;
    ageDistribution?: {
      under18?: number;
      age18to34?: number;
      age35to64?: number;
      age65plus?: number;
    };
    housingUnits?: number;
    occupancyStatus?: {
      totalUnits?: number;
      occupied?: number;
      vacant?: number;
      occupancyRate?: number;
    };
    tenure?: {
      ownerOccupied?: number;
      renterOccupied?: number;
      ownerOccupiedPercent?: number;
    };
    medianHomeValue?: number;
    medianGrossRent?: number;
    elevation?: number;
    lastUpdated?: string;
  };
}

export default function Demographics({ demographics }: DemographicsProps) {
  if (!demographics || !demographics.population) {
    return (
      <div className="bg-[#f8f7f5] dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 p-6">
        <h3 className="text-lg font-serif font-light text-[#1a1a1a] dark:text-white mb-3 tracking-wide">
          Area Demographics
        </h3>
        <p className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light">
          Demographic data is not available for this community.
        </p>
      </div>
    );
  }

  const {
    population,
    households,
    medianAge,
    medianIncome,
    bachelorsDegreePercent,
    ageDistribution,
    housingUnits,
    occupancyStatus,
    tenure,
    medianHomeValue,
    medianGrossRent,
    elevation,
    lastUpdated,
  } = demographics;

  return (
    <div className="bg-[#f8f7f5] dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800">
      {/* Header */}
      <header className="p-5 border-b border-[#e8e6e3] dark:border-gray-800">
        <span className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">
          <span className="w-8 h-px bg-[var(--color-gold)]" />
          Demographics
        </span>
        <h3 className="text-lg font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
          Community Profile
        </h3>
      </header>

      {/* Stats Grid */}
      <div className="p-5 grid grid-cols-2 gap-4">
          {population && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                Population
              </div>
              <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                {formatNumber(population)}
              </div>
            </div>
          )}

          {households && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                Households
              </div>
              <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                {formatNumber(households)}
              </div>
            </div>
          )}

          {medianAge && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                Median Age
              </div>
              <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                {medianAge}
              </div>
            </div>
          )}

          {medianIncome && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                Median Income
              </div>
              <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                {formatCurrency(medianIncome)}
              </div>
            </div>
          )}

          {bachelorsDegreePercent && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                College Educated
              </div>
              <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                {bachelorsDegreePercent}%
              </div>
            </div>
          )}

          {elevation && (
            <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2 block">Elevation</span>
              <span className="text-xl font-light text-[#1a1a1a] dark:text-white">{formatNumber(elevation)} ft</span>
            </div>
          )}
      </div>

      {/* Housing Statistics */}
      {(housingUnits || medianHomeValue || medianGrossRent) && (
        <div className="px-5 pb-5 border-t border-[#e8e6e3] dark:border-gray-800 pt-5">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] mb-4 font-light">
            Housing Market
          </h4>
          <div className="grid grid-cols-2 gap-4">
              {medianHomeValue && medianHomeValue > 0 && (
                <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2">
                    Home Value
                  </div>
                  <div className="text-xl font-light text-[#1a1a1a] dark:text-white">
                    {formatCurrency(medianHomeValue)}
                  </div>
                </div>
              )}

              {medianGrossRent && medianGrossRent > 0 && (
                <div className="p-4 bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#8a8a8a] mb-2 block">Avg. Rent</span>
                  <span className="text-xl font-light text-[#1a1a1a] dark:text-white">{formatCurrency(medianGrossRent)}</span>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Housing Tenure */}
      {tenure && tenure.ownerOccupiedPercent !== undefined && (
        <div className="px-5 pb-5 border-t border-[#e8e6e3] dark:border-gray-800 pt-5">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] mb-4 font-light">Ownership</h4>
          <div className="bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800 p-4">
            <div className="w-full bg-[#e8e6e3] dark:bg-gray-700 h-2 overflow-hidden">
              <div
                className="bg-[var(--color-navy)] dark:bg-[var(--color-gold)] h-full transition-all duration-500"
                style={{ width: `${tenure.ownerOccupiedPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-[0.1em] text-[#6a6a6a] mt-3">
              <span>{tenure.ownerOccupiedPercent}% Owners</span>
              <span>{100 - tenure.ownerOccupiedPercent}% Renters</span>
            </div>
          </div>
        </div>
      )}

      {/* Age Distribution */}
      {ageDistribution && (
        <div className="px-5 pb-5 border-t border-[#e8e6e3] dark:border-gray-800 pt-5">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] mb-4 font-light">Age Distribution</h4>
          <div className="bg-white dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800 p-4 space-y-3">
              {ageDistribution.under18 !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light">Under 18</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-[#e8e6e3] dark:bg-gray-700">
                      <div
                        className="h-full bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-500"
                        style={{ width: `${ageDistribution.under18}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#1a1a1a] dark:text-white font-light w-8 text-right">
                      {ageDistribution.under18}%
                    </span>
                  </div>
                </div>
              )}

              {ageDistribution.age18to34 !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light">18-34</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-[#e8e6e3] dark:bg-gray-700">
                      <div
                        className="h-full bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-500"
                        style={{ width: `${ageDistribution.age18to34}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#1a1a1a] dark:text-white font-light w-8 text-right">
                      {ageDistribution.age18to34}%
                    </span>
                  </div>
                </div>
              )}

              {ageDistribution.age35to64 !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light">35-64</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-[#e8e6e3] dark:bg-gray-700">
                      <div
                        className="h-full bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-500"
                        style={{ width: `${ageDistribution.age35to64}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#1a1a1a] dark:text-white font-light w-8 text-right">
                      {ageDistribution.age35to64}%
                    </span>
                  </div>
                </div>
              )}

              {ageDistribution.age65plus !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light">65+</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-[#e8e6e3] dark:bg-gray-700">
                      <div
                        className="h-full bg-[var(--color-navy)] dark:bg-[var(--color-gold)] transition-all duration-500"
                        style={{ width: `${ageDistribution.age65plus}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#1a1a1a] dark:text-white font-light w-8 text-right">
                      {ageDistribution.age65plus}%
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#e8e6e3] dark:border-gray-800 bg-white/50 dark:bg-[#141414]/50">
        <div className="text-[9px] uppercase tracking-[0.15em] text-[#9a9a9a] font-light">
          Source: U.S. Census Bureau, ACS 5-Year Estimates
          {lastUpdated && (
            <span className="block mt-1">Updated {new Date(lastUpdated).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
