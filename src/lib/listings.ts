import { supabase } from './supabase';

// Raw data from graphql_listings table
interface GraphQLListing {
  id: string;
  listing_id: string;
  status: string;
  list_price: number | null;
  sold_price: number | null;
  address: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  unit_number: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  zip_code: string | null;
  bedrooms: number | null;
  bathrooms_total: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  bathrooms_three_quarter: number | null;
  square_feet: number | null;
  living_area: number | null;
  lot_size_square_feet: number | null;
  lot_size_acres: number | null;
  year_built: string | null;
  property_type: string | null;
  property_sub_type: string | null;
  listing_date: string | null;
  close_date: string | null;
  original_list_price: number | null;
  description: string | null;
  subdivision_name: string | null;
  mls_area_major: string | null;
  mls_area_minor: string | null;
  preferred_photo: string | null;
  media: string[] | null;
  latitude: number | null;
  longitude: number | null;
  list_office_name: string | null;
  list_agent_mls_id: string | null;
  co_list_agent_mls_id: string | null;
  buyer_agent_mls_id: string | null;
  co_buyer_agent_mls_id: string | null;
  virtual_tour_url: string | null;
  furnished: string | null;
  fireplace_yn: boolean | null;
  fireplace_features: string[] | null;
  fireplace_total: number | null;
  cooling: string[] | null;
  heating: string[] | null;
  laundry_features: string[] | null;
  attached_garage_yn: boolean | null;
  parking_features: string[] | null;
  association_amenities: string[] | null;
  created_at: string;
  updated_at: string;
}

// Normalized property interface used throughout the app
export interface MLSProperty {
  id: string;
  mls_number: string;
  status: string;
  list_price: number | null;
  sold_price: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  bathrooms_three_quarter: number | null;
  square_feet: number | null;
  lot_size: number | null;
  year_built: number | null;
  property_type: string | null;
  listing_date: string | null;
  sold_date: string | null;
  days_on_market: number | null;
  description: string | null;
  features: Record<string, any>;
  agent_name: string | null;
  agent_email: string | null;
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  // Additional property details
  subdivision_name: string | null;
  mls_area_minor: string | null;
  furnished: string | null;
  fireplace_yn: boolean | null;
  fireplace_features: string[] | null;
  fireplace_total: number | null;
  cooling: string[] | null;
  heating: string[] | null;
  laundry_features: string[] | null;
  attached_garage_yn: boolean | null;
  parking_features: string[] | null;
  association_amenities: string[] | null;
  virtual_tour_url: string | null;
  list_agent_mls_id: string | null;
  co_list_agent_mls_id: string | null;
  buyer_agent_mls_id: string | null;
  co_buyer_agent_mls_id: string | null;
  created_at: string;
  updated_at: string;
}

// Transform graphql_listings row to MLSProperty format
function transformListing(row: GraphQLListing): MLSProperty {
  // Extract photos from media array
  const photos: string[] = [];
  if (row.preferred_photo) {
    photos.push(row.preferred_photo);
  }
  if (row.media && Array.isArray(row.media)) {
    for (const mediaItem of row.media) {
      try {
        const parsed = typeof mediaItem === 'string' ? JSON.parse(mediaItem) : mediaItem;
        if (parsed.MediaURL && !photos.includes(parsed.MediaURL)) {
          photos.push(parsed.MediaURL);
        }
      } catch {
        // Skip invalid media items
      }
    }
  }

  // Calculate days on market
  let daysOnMarket: number | null = null;
  if (row.listing_date) {
    const listDate = new Date(row.listing_date);
    const endDate = row.close_date ? new Date(row.close_date) : new Date();
    daysOnMarket = Math.floor((endDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    id: row.id,
    mls_number: row.listing_id,
    status: row.status,
    list_price: row.list_price,
    sold_price: row.sold_price,
    address: row.address,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
    neighborhood: row.subdivision_name || row.mls_area_minor || null,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms_total,
    bathrooms_full: row.bathrooms_full,
    bathrooms_half: row.bathrooms_half,
    bathrooms_three_quarter: row.bathrooms_three_quarter,
    square_feet: row.square_feet || row.living_area,
    lot_size: row.lot_size_acres,
    year_built: row.year_built ? parseInt(row.year_built, 10) : null,
    property_type: row.property_sub_type || row.property_type,
    listing_date: row.listing_date,
    sold_date: row.close_date,
    days_on_market: daysOnMarket,
    description: row.description,
    features: {},
    agent_name: row.list_office_name,
    agent_email: null,
    photos,
    latitude: row.latitude,
    longitude: row.longitude,
    // Additional property details
    subdivision_name: row.subdivision_name,
    mls_area_minor: row.mls_area_minor,
    furnished: row.furnished,
    fireplace_yn: row.fireplace_yn,
    fireplace_features: row.fireplace_features,
    fireplace_total: row.fireplace_total,
    cooling: row.cooling,
    heating: row.heating,
    laundry_features: row.laundry_features,
    attached_garage_yn: row.attached_garage_yn,
    parking_features: row.parking_features,
    association_amenities: row.association_amenities,
    virtual_tour_url: row.virtual_tour_url,
    list_agent_mls_id: row.list_agent_mls_id,
    co_list_agent_mls_id: row.co_list_agent_mls_id,
    buyer_agent_mls_id: row.buyer_agent_mls_id,
    co_buyer_agent_mls_id: row.co_buyer_agent_mls_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type SortOption = 'newest' | 'price_low' | 'price_high' | 'beds_low' | 'beds_high';

export interface ListingsFilters {
  status?: string;
  propertyType?: string;      // Main property type (e.g., Residential, Commercial Sale)
  propertySubType?: string;   // Property subtype (e.g., Single Family Residence, Condominium)
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  // Keyword search (MLS# or address)
  keyword?: string;
  // Filters from MLS Configuration
  excludedPropertyTypes?: string[];      // Excluded main property types
  excludedPropertySubTypes?: string[];   // Excluded property subtypes
  allowedCities?: string[];  // If set, only show listings from these cities
  excludedStatuses?: string[];
  // Sorting
  sort?: SortOption;
}

export interface ListingsResult {
  listings: MLSProperty[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getListings(
  page: number = 1,
  pageSize: number = 24,
  filters: ListingsFilters = {}
): Promise<ListingsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('graphql_listings')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.propertyType) {
    // Match against main property_type column
    query = query.eq('property_type', filters.propertyType);
  }
  if (filters.propertySubType) {
    // Match against property_sub_type column
    query = query.eq('property_sub_type', filters.propertySubType);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.neighborhood) {
    // Search subdivision_name or mls_area_minor
    query = query.or(`subdivision_name.ilike.%${filters.neighborhood}%,mls_area_minor.ilike.%${filters.neighborhood}%`);
  }
  if (filters.minPrice) {
    query = query.gte('list_price', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('list_price', filters.maxPrice);
  }
  if (filters.minBeds) {
    query = query.gte('bedrooms', filters.minBeds);
  }
  if (filters.maxBeds) {
    query = query.lte('bedrooms', filters.maxBeds);
  }
  if (filters.minBaths) {
    query = query.gte('bathrooms_total', filters.minBaths);
  }
  if (filters.maxBaths) {
    query = query.lte('bathrooms_total', filters.maxBaths);
  }
  if (filters.minSqft) {
    query = query.gte('square_feet', filters.minSqft);
  }
  if (filters.maxSqft) {
    query = query.lte('square_feet', filters.maxSqft);
  }
  if (filters.keyword) {
    // Search by MLS number (listing_id) or address
    query = query.or(`listing_id.ilike.%${filters.keyword}%,address.ilike.%${filters.keyword}%`);
  }

  // Apply filters from MLS Configuration
  if (filters.excludedPropertyTypes && filters.excludedPropertyTypes.length > 0) {
    query = query.not('property_type', 'in', `(${filters.excludedPropertyTypes.join(',')})`);
  }
  if (filters.excludedPropertySubTypes && filters.excludedPropertySubTypes.length > 0) {
    query = query.not('property_sub_type', 'in', `(${filters.excludedPropertySubTypes.join(',')})`);
  }
  // If allowedCities is set, only show listings from those cities
  if (filters.allowedCities && filters.allowedCities.length > 0) {
    query = query.in('city', filters.allowedCities);
  }
  if (filters.excludedStatuses && filters.excludedStatuses.length > 0) {
    query = query.not('status', 'in', `(${filters.excludedStatuses.join(',')})`);
  }

  // Apply sorting
  const sort = filters.sort || 'newest';
  switch (sort) {
    case 'price_low':
      query = query.order('list_price', { ascending: true, nullsFirst: false });
      break;
    case 'price_high':
      query = query.order('list_price', { ascending: false, nullsFirst: false });
      break;
    case 'beds_low':
      query = query.order('bedrooms', { ascending: true, nullsFirst: false });
      break;
    case 'beds_high':
      query = query.order('bedrooms', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('listing_date', { ascending: false, nullsFirst: false });
      break;
  }

  // Apply pagination
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching listings:', error);
    return {
      listings: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const listings = (data || []).map(transformListing);

  // Debug logging for count mismatch investigation
  console.log(`[Listings] Page ${page}: count=${count}, data.length=${data?.length || 0}, filters:`, {
    city: filters.city || 'all',
    status: filters.status || 'all',
    excludedStatuses: filters.excludedStatuses,
    excludedPropertyTypes: filters.excludedPropertyTypes?.length || 0,
    allowedCities: filters.allowedCities?.length || 0,
  });

  return {
    listings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getListingById(id: string): Promise<MLSProperty | null> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  return data ? transformListing(data) : null;
}

export async function getListingByMlsNumber(mlsNumber: string): Promise<MLSProperty | null> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .eq('listing_id', mlsNumber)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  return data ? transformListing(data) : null;
}

export async function getDistinctCities(): Promise<string[]> {
  // Note: Supabase has a 1000 row limit, so this may not return all cities
  // If allowedCities is configured in MLS settings, those are used directly instead
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('city')
    .not('city', 'is', null)
    .order('city')
    .limit(10000);

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  // Get unique cities
  const cities = [...new Set(data?.map(d => d.city).filter(Boolean) as string[])];
  return cities;
}

// Main property types from database (property_type column)
// Hardcoded to avoid Supabase 1000 row limit issues
const PROPERTY_TYPES = [
  'Commercial Land',
  'Commercial Lease',
  'Commercial Sale',
  'Fractional',
  'RES Vacant Land',
  'Residential',
  'Residential Lease',
];

// Property subtypes from database (property_sub_type column)
const PROPERTY_SUB_TYPES = [
  'Agricultural',
  'Agriculture',
  'Business with Real Estate',
  'Business with/RE',
  'Commercial',
  'Commercial Land',
  'Condominium',
  'Development',
  'Duplex',
  'Half Duplex',
  'Leasehold',
  'Mobile Home',
  'Multi-Family Lot',
  'Other',
  'Residential Income',
  'Seasonal & Remote',
  'Single Family Lot',
  'Single Family Residence',
  'Townhouse',
];

export async function getDistinctPropertyTypes(): Promise<string[]> {
  // Return hardcoded list to avoid Supabase 1000 row limit issues
  return PROPERTY_TYPES;
}

export async function getDistinctPropertySubTypes(): Promise<string[]> {
  // Return hardcoded list to avoid Supabase 1000 row limit issues
  return PROPERTY_SUB_TYPES;
}

export async function getDistinctStatuses(): Promise<string[]> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .order('status')
    .limit(10000);

  if (error) {
    console.error('Error fetching statuses:', error);
    return [];
  }

  const statuses = [...new Set(data?.map(d => d.status).filter(Boolean) as string[])];
  return statuses;
}

export async function getDistinctNeighborhoods(): Promise<string[]> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('subdivision_name')
    .not('subdivision_name', 'is', null)
    .order('subdivision_name')
    .limit(10000);

  if (error) {
    console.error('Error fetching neighborhoods:', error);
    return [];
  }

  const neighborhoods = [...new Set(data?.map(d => d.subdivision_name).filter(Boolean) as string[])];
  return neighborhoods;
}

export async function getNeighborhoodsByCity(city: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('subdivision_name')
    .ilike('city', city)
    .not('subdivision_name', 'is', null)
    .order('subdivision_name')
    .limit(10000);

  if (error) {
    console.error('Error fetching neighborhoods for city:', error);
    return [];
  }

  const neighborhoods = [...new Set(data?.map(d => d.subdivision_name).filter(Boolean) as string[])];
  return neighborhoods;
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Price N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft) + ' sq ft';
}

export function formatLotSize(acres: number | null): string {
  if (!acres) return '';
  if (acres >= 1) {
    return acres.toFixed(2) + ' acres';
  }
  // Convert to sq ft for smaller lots
  const sqft = acres * 43560;
  return new Intl.NumberFormat('en-US').format(Math.round(sqft)) + ' sq ft lot';
}

// Get newest highest-priced properties for a specific city
export async function getNewestHighPricedByCity(
  city: string,
  limit: number = 4
): Promise<MLSProperty[]> {
  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .ilike('city', city)
    .eq('property_type', 'Residential')
    .eq('property_sub_type', 'Single Family Residence')
    .not('status', 'eq', 'Closed')
    .not('list_price', 'is', null)
    .order('listing_date', { ascending: false })
    .order('list_price', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching newest high-priced listings:', error);
    return [];
  }

  return (data || []).map(transformListing);
}

/**
 * Get price range for a city: lowest priced condo and highest priced single family home
 */
export async function getCommunityPriceRange(
  city: string
): Promise<{ lowestCondo: number | null; highestSingleFamily: number | null }> {
  // Get lowest priced active condo
  const { data: condoData, error: condoError } = await supabase
    .from('graphql_listings')
    .select('list_price')
    .ilike('city', city)
    .eq('property_sub_type', 'Condominium')
    .eq('status', 'Active')
    .not('list_price', 'is', null)
    .order('list_price', { ascending: true })
    .limit(1);

  if (condoError) {
    console.error('Error fetching lowest condo price:', condoError);
  }

  // Get highest priced active single family home
  const { data: sfhData, error: sfhError } = await supabase
    .from('graphql_listings')
    .select('list_price')
    .ilike('city', city)
    .eq('property_sub_type', 'Single Family Residence')
    .eq('status', 'Active')
    .not('list_price', 'is', null)
    .order('list_price', { ascending: false })
    .limit(1);

  if (sfhError) {
    console.error('Error fetching highest single family price:', sfhError);
  }

  return {
    lowestCondo: condoData?.[0]?.list_price ?? null,
    highestSingleFamily: sfhData?.[0]?.list_price ?? null,
  };
}

/**
 * Fetches newest high-priced Single Family Residential properties from multiple cities
 */
export async function getNewestHighPricedByCities(
  cities: string[],
  limit: number = 8
): Promise<MLSProperty[]> {
  if (!cities || cities.length === 0) {
    return [];
  }

  // Build OR filter for multiple cities (case-insensitive)
  const cityFilters = cities.map(city => `city.ilike.${city}`).join(',');

  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .or(cityFilters)
    .eq('property_type', 'Residential')
    .eq('property_sub_type', 'Single Family Residence')
    .not('status', 'eq', 'Closed')
    .not('list_price', 'is', null)
    .order('listing_date', { ascending: false })
    .order('list_price', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching newest high-priced listings by cities:', error);
    return [];
  }

  return (data || []).map(transformListing);
}

// Get listings by agent MLS ID, separated into active and sold
export interface AgentListingsResult {
  activeListings: MLSProperty[];
  soldListings: MLSProperty[];
}

export async function getListingsByAgentId(
  agentMlsId: string,
  soldAgentMlsId?: string
): Promise<AgentListingsResult> {
  const buildFilter = (id: string) =>
    `list_agent_mls_id.eq.${id},co_list_agent_mls_id.eq.${id},buyer_agent_mls_id.eq.${id},co_buyer_agent_mls_id.eq.${id}`;

  const activeFilter = buildFilter(agentMlsId);
  const soldId = soldAgentMlsId || agentMlsId;
  const soldFilter = soldId === agentMlsId
    ? activeFilter
    : `${buildFilter(agentMlsId)},${buildFilter(soldId)}`;

  const [activeResult, soldResult] = await Promise.all([
    supabase
      .from('graphql_listings')
      .select('*')
      .or(activeFilter)
      .not('status', 'eq', 'Closed')
      .order('listing_date', { ascending: false })
      .limit(200),
    supabase
      .from('graphql_listings')
      .select('*')
      .or(soldFilter)
      .eq('status', 'Closed')
      .order('sold_price', { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  if (activeResult.error) {
    console.error('Error fetching active agent listings:', activeResult.error);
  }
  if (soldResult.error) {
    console.error('Error fetching sold agent listings:', soldResult.error);
  }

  // Deduplicate in case agent appears in multiple roles on the same listing
  const dedup = (listings: any[]) => {
    const seen = new Set<string>();
    return listings.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  };

  return {
    activeListings: dedup(activeResult.data || []).map(transformListing),
    soldListings: dedup(soldResult.data || []).map(transformListing),
  };
}
