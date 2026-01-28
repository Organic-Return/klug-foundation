/**
 * US Census Bureau API integration for demographic data
 *
 * This utility fetches demographic data from the Census API based on coordinates.
 * You'll need a Census API key from: https://api.census.gov/data/key_signup.html
 * Set it in your .env.local as CENSUS_API_KEY or in Sanity Site Settings
 */

import { getCensusApiKey } from './settings';

interface CensusData {
  population: number;
  households: number;
  medianAge: number;
  medianIncome: number;
  bachelorsDegreePercent: number;
  ageDistribution: {
    under18: number;
    age18to34: number;
    age35to64: number;
    age65plus: number;
  };
  housingUnits: number;
  occupancyStatus: {
    totalUnits: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
  };
  tenure: {
    ownerOccupied: number;
    renterOccupied: number;
    ownerOccupiedPercent: number;
  };
  medianHomeValue: number;
  medianGrossRent: number;
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Fetches demographic data for a given location from the US Census API
 * Uses the American Community Survey (ACS) 5-Year estimates
 */
export async function fetchDemographicData(coordinates: Coordinates): Promise<CensusData | null> {
  const apiKey = await getCensusApiKey();

  console.log('🔍 Fetching demographic data for coordinates:', coordinates);
  console.log('🔑 API Key configured:', apiKey ? 'Yes' : 'No');

  if (!apiKey) {
    console.warn('⚠️  CENSUS_API_KEY not configured. Demographic data will not be fetched.');
    return null;
  }

  try {
    // First, get the FIPS code (state and county) from coordinates using Census Geocoder
    const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${coordinates.lng}&y=${coordinates.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    console.log('📍 Geocoding URL:', geocodeUrl);

    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    console.log('📊 Geocode response:', JSON.stringify(geocodeData, null, 2));

    if (!geocodeData.result?.geographies?.['Census Tracts']?.[0]) {
      console.error('❌ Unable to geocode coordinates');
      return null;
    }

    const tract = geocodeData.result.geographies['Census Tracts'][0];
    const state = tract.STATE;
    const county = tract.COUNTY;
    const tractCode = tract.TRACT;

    // Fetch demographic data from ACS 5-Year estimates
    // Optimized to stay under 50 variable limit (currently at 44 variables)
    const variables = [
      'B01003_001E', // Total Population
      'B11001_001E', // Total Households
      'B01002_001E', // Median Age
      'B19013_001E', // Median Household Income
      'B15003_022E', // Bachelor's degree
      'B15003_023E', // Master's degree
      'B15003_025E', // Doctorate degree
      'B15003_001E', // Total 25+ for education %
      'B09001_001E', // Population under 18 years
      'B25001_001E', // Total housing units
      'B25002_002E', // Occupied housing units
      'B25002_003E', // Vacant housing units
      'B25003_002E', // Owner-occupied housing units
      'B25003_003E', // Renter-occupied housing units
      'B25077_001E', // Median home value
      'B25064_001E', // Median gross rent
      // 18-34 age group (male + female): 18-19, 20-24, 25-29, 30-34
      'B01001_007E', 'B01001_009E', 'B01001_010E', 'B01001_011E',
      'B01001_031E', 'B01001_033E', 'B01001_034E', 'B01001_035E',
      // 35-64 age group (male + female): 35-44, 45-54, 55-64
      'B01001_013E', 'B01001_014E', 'B01001_016E', 'B01001_017E',
      'B01001_037E', 'B01001_038E', 'B01001_040E', 'B01001_041E',
      // 65+ age group (male + female): 65-66, 67-69, 70-74, 75-79, 80-84, 85+
      'B01001_020E', 'B01001_021E', 'B01001_022E', 'B01001_023E', 'B01001_024E', 'B01001_025E',
      'B01001_044E', 'B01001_045E', 'B01001_046E', 'B01001_047E', 'B01001_048E', 'B01001_049E',
      // Note: Removed professional degree (B15003_024E) to stay under 50 variable limit
    ].join(',');

    const censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=tract:${tractCode}&in=state:${state}+county:${county}&key=${apiKey}`;
    console.log('📊 Census API URL:', censusUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const censusResponse = await fetch(censusUrl);
    const responseText = await censusResponse.text();
    console.log('📥 Census API response text:', responseText.substring(0, 200));

    const censusData = JSON.parse(responseText);
    console.log('✅ Census data received, rows:', censusData?.length);

    if (!censusData || censusData.length < 2) {
      console.error('❌ No census data returned');
      return null;
    }

    // Parse the response (first row is headers, second row is data)
    const headers = censusData[0];
    const values = censusData[1];

    const dataMap = new Map<string, number>();
    headers.forEach((header: string, index: number) => {
      const value = parseInt(values[index]);
      dataMap.set(header, isNaN(value) || value < 0 ? 0 : value);
    });

    // Calculate age distributions
    const under18 = dataMap.get('B09001_001E') || 0;

    const age18to34 =
      (dataMap.get('B01001_007E') || 0) + (dataMap.get('B01001_009E') || 0) +
      (dataMap.get('B01001_010E') || 0) + (dataMap.get('B01001_011E') || 0) +
      (dataMap.get('B01001_031E') || 0) + (dataMap.get('B01001_033E') || 0) +
      (dataMap.get('B01001_034E') || 0) + (dataMap.get('B01001_035E') || 0);

    const age35to64 =
      (dataMap.get('B01001_013E') || 0) + (dataMap.get('B01001_014E') || 0) +
      (dataMap.get('B01001_016E') || 0) + (dataMap.get('B01001_017E') || 0) +
      (dataMap.get('B01001_037E') || 0) + (dataMap.get('B01001_038E') || 0) +
      (dataMap.get('B01001_040E') || 0) + (dataMap.get('B01001_041E') || 0);

    const age65plus =
      (dataMap.get('B01001_020E') || 0) + (dataMap.get('B01001_021E') || 0) +
      (dataMap.get('B01001_022E') || 0) + (dataMap.get('B01001_023E') || 0) +
      (dataMap.get('B01001_024E') || 0) + (dataMap.get('B01001_025E') || 0) +
      (dataMap.get('B01001_044E') || 0) + (dataMap.get('B01001_045E') || 0) +
      (dataMap.get('B01001_046E') || 0) + (dataMap.get('B01001_047E') || 0) +
      (dataMap.get('B01001_048E') || 0) + (dataMap.get('B01001_049E') || 0);

    const totalPopulation = dataMap.get('B01003_001E') || 1;

    // Calculate education percentage (Bachelor's or higher)
    const bachelors = dataMap.get('B15003_022E') || 0;
    const masters = dataMap.get('B15003_023E') || 0;
    const doctorate = dataMap.get('B15003_025E') || 0;
    const total25Plus = dataMap.get('B15003_001E') || 1;
    const bachelorsDegreePercent = ((bachelors + masters + doctorate) / total25Plus) * 100;

    // Calculate housing statistics
    const housingUnits = dataMap.get('B25001_001E') || 0;

    // Calculate occupancy status
    const occupiedUnits = dataMap.get('B25002_002E') || 0;
    const vacantUnits = dataMap.get('B25002_003E') || 0;
    const totalUnits = occupiedUnits + vacantUnits; // Calculated from occupied + vacant
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Calculate tenure (owner vs renter)
    const ownerOccupied = dataMap.get('B25003_002E') || 0;
    const renterOccupied = dataMap.get('B25003_003E') || 0;
    const totalOccupiedForTenure = ownerOccupied + renterOccupied; // Calculated from owner + renter
    const ownerOccupiedPercent = totalOccupiedForTenure > 0 ? (ownerOccupied / totalOccupiedForTenure) * 100 : 0;

    // Get median values
    const medianHomeValue = dataMap.get('B25077_001E') || 0;
    const medianGrossRent = dataMap.get('B25064_001E') || 0;

    const result = {
      population: totalPopulation,
      households: dataMap.get('B11001_001E') || 0,
      medianAge: dataMap.get('B01002_001E') || 0,
      medianIncome: dataMap.get('B19013_001E') || 0,
      bachelorsDegreePercent: Math.round(bachelorsDegreePercent * 10) / 10,
      ageDistribution: {
        under18: Math.round((under18 / totalPopulation) * 1000) / 10,
        age18to34: Math.round((age18to34 / totalPopulation) * 1000) / 10,
        age35to64: Math.round((age35to64 / totalPopulation) * 1000) / 10,
        age65plus: Math.round((age65plus / totalPopulation) * 1000) / 10,
      },
      housingUnits,
      occupancyStatus: {
        totalUnits,
        occupied: occupiedUnits,
        vacant: vacantUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      tenure: {
        ownerOccupied,
        renterOccupied,
        ownerOccupiedPercent: Math.round(ownerOccupiedPercent * 10) / 10,
      },
      medianHomeValue,
      medianGrossRent,
    };

    console.log('✅ Successfully fetched demographic data:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching demographic data:', error);
    return null;
  }
}

/**
 * Formats currency values for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats population numbers with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
