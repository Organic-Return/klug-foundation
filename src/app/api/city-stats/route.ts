import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getMLSConfiguration, getAllowedCities } from '@/lib/mlsConfiguration';

// Cache duration: 24 hours (86400 seconds)
const CACHE_DURATION = 86400;

interface MonthlyData {
  month: string; // Format: "Jan", "Feb", etc.
  year: number;
  avgSoldPrice: number | null;
  avgSoldPricePerSqFt: number | null;
  salesCount: number;
}

interface CityStats {
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

// Property sub-type filters (uses property_sub_type column)
// Includes both RESO standard names and PacMLS-specific names
const PROPERTY_SUB_TYPE_FILTERS: Record<string, string[]> = {
  all: [], // No additional filter - shows all allowed types
  'single-family': ['Single Family Residence', 'Site Built-Owned Lot', 'Residential'],
  'condo-townhome': ['Condominium', 'Townhouse'],
};

// Default cities to show if none configured in Sanity
const DEFAULT_CITIES = [
  'Aspen',
  'Woody Creek',
  'Snowmass Village',
  'Snowmass',
  'Basalt',
  'Carbondale',
];

// Core function to fetch and calculate city stats
async function computeCityStats(propertyFilter: string, requestedCities?: string[]): Promise<{ cities: string[]; stats: CityStats[] }> {
  // If specific cities are requested (from CMS/query params), use those directly
  // Otherwise fall back to MLS configuration or defaults
  let allowedCities: string[];

  if (requestedCities && requestedCities.length > 0) {
    allowedCities = requestedCities;
  } else {
    const mlsConfig = await getMLSConfiguration();
    allowedCities = getAllowedCities(mlsConfig);

    if (allowedCities.length === 0) {
      allowedCities = DEFAULT_CITIES;
    }
  }

  // Calculate date ranges for sold listings query
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];

  // Get property sub-type filter
  const filterSubTypes = PROPERTY_SUB_TYPE_FILTERS[propertyFilter];

  // Build all three queries
  let activeQuery = supabase
    .from('graphql_listings')
    .select('city, list_price, square_feet')
    .eq('status', 'Active')
    .in('city', allowedCities)
    .not('list_price', 'is', null)
    .not('property_type', 'eq', 'Residential Lease')
    .not('property_type', 'eq', 'Commercial Lease')
    .not('property_type', 'eq', 'Fractional')
    .not('property_type', 'eq', 'Res Vacant Land');

  let pendingQuery = supabase
    .from('graphql_listings')
    .select('city')
    .or('status.eq.Pending,status.eq.Under Contract,status.eq.Active Under Contract,status.ilike.Pending%,status.ilike.Active U/C%')
    .in('city', allowedCities)
    .not('property_type', 'eq', 'Residential Lease')
    .not('property_type', 'eq', 'Commercial Lease')
    .not('property_type', 'eq', 'Fractional')
    .not('property_type', 'eq', 'Res Vacant Land');

  let closedQuery = supabase
    .from('graphql_listings')
    .select('city, sold_price, list_price, square_feet, listing_date, close_date')
    .in('status', ['Closed', 'Sold'])
    .in('city', allowedCities)
    .not('sold_price', 'is', null)
    .gte('close_date', twoYearsAgoStr)
    .not('property_type', 'eq', 'Residential Lease')
    .not('property_type', 'eq', 'Commercial Lease')
    .not('property_type', 'eq', 'Fractional')
    .not('property_type', 'eq', 'Res Vacant Land');

  // Apply property sub-type filter if not "all"
  // For single-family, also include NULL sub-types since many MLS systems (e.g. PacMLS)
  // leave this field empty for standard residential listings
  if (filterSubTypes && filterSubTypes.length > 0) {
    const orConditions = filterSubTypes.map(t => `property_sub_type.eq.${t}`).join(',');
    const includeNull = propertyFilter === 'single-family';
    const orFilter = includeNull
      ? `property_sub_type.is.null,${orConditions}`
      : orConditions;
    activeQuery = activeQuery.or(orFilter);
    pendingQuery = pendingQuery.or(orFilter);
    closedQuery = closedQuery.or(orFilter);
  }

  // Execute all three queries in parallel for better performance
  const [activeResult, pendingResult, closedResult] = await Promise.all([
    activeQuery,
    pendingQuery,
    closedQuery,
  ]);

  const { data: activeListings, error: activeError } = activeResult;
  const { data: pendingListings, error: pendingError } = pendingResult;
  const { data: closedListings, error: closedError } = closedResult;

  if (activeError) {
    console.error('Error fetching active listings:', activeError);
    throw new Error('Failed to fetch active listings');
  }

  if (pendingError) {
    console.error('Error fetching pending listings:', pendingError);
    throw new Error('Failed to fetch pending listings');
  }

  if (closedError) {
    console.error('Error fetching closed listings:', closedError);
    // Don't fail the whole request, just log the error
  }

  // Group listings by city
  const cityData: Record<string, {
    activeListings: Array<{ list_price: number; square_feet: number | null }>;
    pendingCount: number;
    soldListings: Array<{ sold_price: number; list_price: number | null; square_feet: number | null; listing_date: string | null; close_date: string | null }>;
  }> = {};

  // Process active listings
  activeListings?.forEach((listing) => {
    const city = listing.city as string;
    if (!cityData[city]) {
      cityData[city] = { activeListings: [], pendingCount: 0, soldListings: [] };
    }
    cityData[city].activeListings.push({
      list_price: listing.list_price as number,
      square_feet: listing.square_feet as number | null,
    });
  });

  // Process pending listings
  pendingListings?.forEach((listing) => {
    const city = listing.city as string;
    if (!cityData[city]) {
      cityData[city] = { activeListings: [], pendingCount: 0, soldListings: [] };
    }
    cityData[city].pendingCount++;
  });

  // Process closed/sold listings
  closedListings?.forEach((listing) => {
    const city = listing.city as string;
    if (!cityData[city]) {
      cityData[city] = { activeListings: [], pendingCount: 0, soldListings: [] };
    }
    cityData[city].soldListings.push({
      sold_price: listing.sold_price as number,
      list_price: listing.list_price as number | null,
      square_feet: listing.square_feet as number | null,
      listing_date: listing.listing_date as string | null,
      close_date: listing.close_date as string | null,
    });
  });

  // Calculate statistics for each city
  const cityStats: CityStats[] = Object.entries(cityData)
    .map(([city, data]) => {
      const { activeListings, pendingCount, soldListings } = data;

      if (activeListings.length === 0) {
        return null;
      }

      const prices = activeListings.map(l => l.list_price);
      const totalPrice = prices.reduce((sum, price) => sum + price, 0);
      const avgListPrice = totalPrice / prices.length;

      // Calculate price per sq ft for listings with square footage
      const listingsWithSqFt = activeListings.filter(l => l.square_feet && l.square_feet > 0);
      let avgPricePerSqFt = 0;
      if (listingsWithSqFt.length > 0) {
        const totalPricePerSqFt = listingsWithSqFt.reduce((sum, l) => {
          return sum + (l.list_price / (l.square_feet as number));
        }, 0);
        avgPricePerSqFt = totalPricePerSqFt / listingsWithSqFt.length;
      }

      // Split sold listings into current year (last 12 months) and prior year
      const now = new Date();
      const oneYearAgoDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Start of 12-month window

      const currentYearSoldListings = soldListings.filter(l => {
        if (!l.close_date) return false;
        const closeDate = new Date(l.close_date);
        return closeDate >= oneYearAgoDate;
      });

      const priorYearSoldListings = soldListings.filter(l => {
        if (!l.close_date) return false;
        const closeDate = new Date(l.close_date);
        const priorYearStart = new Date(oneYearAgoDate.getFullYear() - 1, oneYearAgoDate.getMonth(), 1);
        return closeDate >= priorYearStart && closeDate < oneYearAgoDate;
      });

      // Calculate average sold price for the last year
      let avgSoldPrice: number | null = null;
      if (currentYearSoldListings.length > 0) {
        const totalSoldPrice = currentYearSoldListings.reduce((sum, l) => sum + l.sold_price, 0);
        avgSoldPrice = Math.round(totalSoldPrice / currentYearSoldListings.length);
      }

      // Calculate average sold price per sq ft for the last year
      let avgSoldPricePerSqFt: number | null = null;
      const soldWithSqFt = currentYearSoldListings.filter(l => l.square_feet && l.square_feet > 0);
      if (soldWithSqFt.length > 0) {
        const totalSoldPricePerSqFt = soldWithSqFt.reduce((sum, l) => {
          return sum + (l.sold_price / (l.square_feet as number));
        }, 0);
        avgSoldPricePerSqFt = Math.round(totalSoldPricePerSqFt / soldWithSqFt.length);
      }

      // Calculate prior year averages
      let priorYearAvgSoldPrice: number | null = null;
      if (priorYearSoldListings.length > 0) {
        const totalPriorSoldPrice = priorYearSoldListings.reduce((sum, l) => sum + l.sold_price, 0);
        priorYearAvgSoldPrice = Math.round(totalPriorSoldPrice / priorYearSoldListings.length);
      }

      let priorYearAvgSoldPricePerSqFt: number | null = null;
      const priorSoldWithSqFt = priorYearSoldListings.filter(l => l.square_feet && l.square_feet > 0);
      if (priorSoldWithSqFt.length > 0) {
        const totalPriorPricePerSqFt = priorSoldWithSqFt.reduce((sum, l) => {
          return sum + (l.sold_price / (l.square_feet as number));
        }, 0);
        priorYearAvgSoldPricePerSqFt = Math.round(totalPriorPricePerSqFt / priorSoldWithSqFt.length);
      }

      // Calculate average days on market for the last year
      let avgDaysOnMarket: number | null = null;
      const soldWithDates = currentYearSoldListings.filter(l => l.listing_date && l.close_date);
      if (soldWithDates.length > 0) {
        const totalDaysOnMarket = soldWithDates.reduce((sum, l) => {
          const listDate = new Date(l.listing_date as string);
          const closeDate = new Date(l.close_date as string);
          const days = Math.floor((closeDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, days); // Ensure non-negative
        }, 0);
        avgDaysOnMarket = Math.round(totalDaysOnMarket / soldWithDates.length);
      }

      // Calculate average SP/LP ratio for the last year
      let avgSpLpRatio: number | null = null;
      const soldWithListPrice = currentYearSoldListings.filter(l => l.list_price && l.list_price > 0);
      if (soldWithListPrice.length > 0) {
        const totalSpLpRatio = soldWithListPrice.reduce((sum, l) => {
          return sum + (l.sold_price / (l.list_price as number));
        }, 0);
        avgSpLpRatio = Math.round((totalSpLpRatio / soldWithListPrice.length) * 10000) / 100; // e.g. 97.45%
      }

      // Calculate monthly data for the last 12 months (current year)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData: MonthlyData[] = [];
      const priorYearMonthlyData: MonthlyData[] = [];

      // Generate last 12 months for current year and prior year
      for (let i = 11; i >= 0; i--) {
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const priorMonthDate = new Date(now.getFullYear() - 1, now.getMonth() - i, 1);

        // Current year month data
        const currentMonthSales = soldListings.filter(l => {
          if (!l.close_date) return false;
          const closeDate = new Date(l.close_date);
          return closeDate.getFullYear() === currentMonthDate.getFullYear() &&
                 closeDate.getMonth() === currentMonthDate.getMonth();
        });

        let currentMonthAvgSoldPrice: number | null = null;
        let currentMonthAvgSoldPricePerSqFt: number | null = null;

        if (currentMonthSales.length > 0) {
          const totalMonthPrice = currentMonthSales.reduce((sum, l) => sum + l.sold_price, 0);
          currentMonthAvgSoldPrice = Math.round(totalMonthPrice / currentMonthSales.length);

          const monthSalesWithSqFt = currentMonthSales.filter(l => l.square_feet && l.square_feet > 0);
          if (monthSalesWithSqFt.length > 0) {
            const totalMonthPricePerSqFt = monthSalesWithSqFt.reduce((sum, l) => {
              return sum + (l.sold_price / (l.square_feet as number));
            }, 0);
            currentMonthAvgSoldPricePerSqFt = Math.round(totalMonthPricePerSqFt / monthSalesWithSqFt.length);
          }
        }

        monthlyData.push({
          month: monthNames[currentMonthDate.getMonth()],
          year: currentMonthDate.getFullYear(),
          avgSoldPrice: currentMonthAvgSoldPrice,
          avgSoldPricePerSqFt: currentMonthAvgSoldPricePerSqFt,
          salesCount: currentMonthSales.length,
        });

        // Prior year month data (same month, one year earlier)
        const priorMonthSales = soldListings.filter(l => {
          if (!l.close_date) return false;
          const closeDate = new Date(l.close_date);
          return closeDate.getFullYear() === priorMonthDate.getFullYear() &&
                 closeDate.getMonth() === priorMonthDate.getMonth();
        });

        let priorMonthAvgSoldPrice: number | null = null;
        let priorMonthAvgSoldPricePerSqFt: number | null = null;

        if (priorMonthSales.length > 0) {
          const totalPriorMonthPrice = priorMonthSales.reduce((sum, l) => sum + l.sold_price, 0);
          priorMonthAvgSoldPrice = Math.round(totalPriorMonthPrice / priorMonthSales.length);

          const priorMonthSalesWithSqFt = priorMonthSales.filter(l => l.square_feet && l.square_feet > 0);
          if (priorMonthSalesWithSqFt.length > 0) {
            const totalPriorMonthPricePerSqFt = priorMonthSalesWithSqFt.reduce((sum, l) => {
              return sum + (l.sold_price / (l.square_feet as number));
            }, 0);
            priorMonthAvgSoldPricePerSqFt = Math.round(totalPriorMonthPricePerSqFt / priorMonthSalesWithSqFt.length);
          }
        }

        priorYearMonthlyData.push({
          month: monthNames[priorMonthDate.getMonth()],
          year: priorMonthDate.getFullYear(),
          avgSoldPrice: priorMonthAvgSoldPrice,
          avgSoldPricePerSqFt: priorMonthAvgSoldPricePerSqFt,
          salesCount: priorMonthSales.length,
        });
      }

      return {
        city,
        totalActiveListings: activeListings.length,
        totalUnderContract: pendingCount,
        avgListPrice: Math.round(avgListPrice),
        avgPricePerSqFt: Math.round(avgPricePerSqFt),
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        avgSoldPrice,
        avgSoldPricePerSqFt,
        avgDaysOnMarket,
        avgSpLpRatio,
        monthlyData,
        priorYearMonthlyData,
        priorYearAvgSoldPrice,
        priorYearAvgSoldPricePerSqFt,
      };
    })
    .filter((stat): stat is CityStats => stat !== null)
    .sort((a, b) => b.totalActiveListings - a.totalActiveListings);

  // Get list of cities (sorted by number of active listings)
  const cities = cityStats.map(stat => stat.city);

  return {
    cities,
    stats: cityStats,
  };
}

// Create cached version of the stats function for each property filter type
const getCachedCityStats = (propertyFilter: string) => {
  return unstable_cache(
    async () => computeCityStats(propertyFilter),
    [`city-stats-${propertyFilter}`],
    {
      revalidate: CACHE_DURATION,
      tags: [`city-stats`, `city-stats-${propertyFilter}`],
    }
  );
};

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ cities: [], stats: [] });
  }

  try {
    // Get property type filter and optional city filters from query params
    const { searchParams } = new URL(request.url);
    const propertyFilter = searchParams.get('propertyType') || 'all';
    const cityFilter = searchParams.get('city'); // Single city filter
    const citiesFilter = searchParams.get('cities'); // Multiple cities filter (comma-separated)

    // If specific cities are requested, compute stats for those cities directly
    // This ensures cities outside the MLS config are still queryable
    if (cityFilter) {
      const result = await computeCityStats(propertyFilter, [cityFilter]);
      return NextResponse.json(result);
    }

    if (citiesFilter) {
      const requestedCities = citiesFilter.split(',').map(c => c.trim());
      const result = await computeCityStats(propertyFilter, requestedCities);
      return NextResponse.json(result);
    }

    // No specific cities requested — use cached default (MLS config cities)
    const cachedFn = getCachedCityStats(propertyFilter);
    const result = await cachedFn();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in city-stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
