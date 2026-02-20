import { supabase, isSupabaseConfigured } from './supabase';
import { getRealogySupabase, isRealogyConfigured } from './realogySupabase';

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
  open_house_date: string | null;
  open_house_start_time: string | null;
  open_house_end_time: string | null;
  open_house_remarks: string | null;
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
  video_urls: string[];
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
  open_house_date: string | null;
  open_house_start_time: string | null;
  open_house_end_time: string | null;
  open_house_remarks: string | null;
  created_at: string;
  updated_at: string;
}

// Transform graphql_listings row to MLSProperty format
function transformListing(row: GraphQLListing): MLSProperty {
  // Extract photos from media — handles JSON arrays, JSON strings, and string arrays
  const photos: string[] = [];
  if (row.preferred_photo) {
    photos.push(row.preferred_photo);
  }
  let mediaItems: any[] = [];
  if (row.media) {
    if (Array.isArray(row.media)) {
      mediaItems = row.media;
    } else if (typeof row.media === 'string') {
      // Media may be a JSON string (AWSJSON / text column)
      try {
        const parsed = JSON.parse(row.media);
        mediaItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        // Not valid JSON
      }
    }
  }
  for (const mediaItem of mediaItems) {
    try {
      const parsed = typeof mediaItem === 'string' ? JSON.parse(mediaItem) : mediaItem;
      let url: string | undefined;
      if (typeof parsed === 'string') {
        // Direct URL string
        url = parsed;
      } else {
        url = parsed.MediaURL || parsed.MediaUrl || parsed.mediaUrl || parsed.mediaURL;
      }
      if (url) {
        // Fix protocol-relative URLs (e.g. "//cdn.example.com/...")
        if (url.startsWith('//')) {
          url = `https:${url}`;
        }
        if (!photos.includes(url)) {
          photos.push(url);
        }
      }
    } catch {
      // Skip invalid media items
    }
  }

  // Calculate days on market
  let daysOnMarket: number | null = null;
  if (row.listing_date) {
    const listDate = new Date(row.listing_date);
    const endDate = row.close_date ? new Date(row.close_date) : new Date();
    daysOnMarket = Math.floor((endDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Extract MLS number: prefer listing_id, fall back to description ("MLS# 285075 ...")
  // or photo URL path ("/PACMLS/285075/")
  let mlsNumber: string = row.listing_id || '';
  if (!mlsNumber && row.description) {
    const match = row.description.match(/MLS#\s*(\d+)/i);
    if (match) mlsNumber = match[1];
  }
  if (!mlsNumber && photos.length > 0) {
    const match = photos[0].match(/\/PACMLS\/(\d+)\//);
    if (match) mlsNumber = match[1];
  }

  return {
    id: row.id,
    mls_number: mlsNumber,
    status: row.status,
    list_price: row.list_price || row.sold_price,
    sold_price: row.sold_price,
    address: row.address || [row.street_number, row.street_name].filter(Boolean).join(' ') || null,
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
    video_urls: [],
    latitude: row.latitude != null ? Number(row.latitude) || null : null,
    longitude: row.longitude != null ? Number(row.longitude) || null : null,
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
    open_house_date: row.open_house_date,
    open_house_start_time: row.open_house_start_time,
    open_house_end_time: row.open_house_end_time,
    open_house_remarks: row.open_house_remarks,
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
  // Agent filtering (Our Properties Only)
  agentMlsIds?: string[];
  agentNames?: string[];  // Fallback: also match by agent full name
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
  if (!isSupabaseConfigured()) {
    return { listings: [], total: 0, page, pageSize, totalPages: 0 };
  }

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

  // Filter by team agent MLS IDs and/or names (Our Properties Only)
  if ((filters.agentMlsIds && filters.agentMlsIds.length > 0) || (filters.agentNames && filters.agentNames.length > 0)) {
    const idConditions = (filters.agentMlsIds || [])
      .map((id) => `list_agent_mls_id.eq.${id},co_list_agent_mls_id.eq.${id},buyer_agent_mls_id.eq.${id},co_buyer_agent_mls_id.eq.${id}`)
      .join(',');
    const nameConditions = (filters.agentNames || [])
      .map((name) => `list_agent_full_name.ilike.${name}`)
      .join(',');
    const allConditions = [idConditions, nameConditions].filter(Boolean).join(',');
    query = query.or(allConditions);
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
    // Use OR to also include rows where status is NULL (NOT IN excludes NULLs in SQL)
    query = query.or(`status.not.in.(${filters.excludedStatuses.join(',')}),status.is.null`);
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

// Look up SIR media for a listing by its MLS number, with address/city verification
async function getSIRMediaForListing(
  mlsNumber: string,
  address?: string | null,
  city?: string | null,
): Promise<SIRMediaAssets | null> {
  if (!isRealogyConfigured()) return null;

  const realogySupabase = getRealogySupabase();
  if (!realogySupabase) return null;

  const { data, error } = await realogySupabase
    .from('realogy_listings')
    .select('default_photo_url, media, street_address, city')
    .contains('mls_numbers', JSON.stringify([mlsNumber]))
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[SIR Enrichment] Query error for MLS# ${mlsNumber}:`, error.message);
    return null;
  }
  if (!data) return null;

  // Verify address/city match to prevent cross-MLS-system collisions
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  let verified = false;

  // Check address if both sides have it
  if (address && data.street_address) {
    const sirAddr = normalize(data.street_address);
    const mlsAddr = normalize(address);
    const sirFirst = sirAddr.split(' ').slice(0, 2).join(' ');
    const mlsFirst = mlsAddr.split(' ').slice(0, 2).join(' ');
    if (sirFirst !== mlsFirst) {
      console.warn(
        `[SIR Enrichment] MLS# ${mlsNumber}: Address mismatch — ` +
        `MLS "${address}" vs SIR "${data.street_address}". Skipping SIR photos.`
      );
      return null;
    }
    verified = true;
  }

  // Also check city if both sides have it (even if address already matched)
  if (city && data.city) {
    if (normalize(city) !== normalize(data.city)) {
      console.warn(
        `[SIR Enrichment] MLS# ${mlsNumber}: City mismatch — ` +
        `MLS "${city}" vs SIR "${data.city}". Skipping SIR photos.`
      );
      return null;
    }
    verified = true;
  }

  // If we couldn't verify anything, don't use SIR photos (safety net)
  if (!verified) {
    console.warn(
      `[SIR Enrichment] MLS# ${mlsNumber}: Cannot verify match — ` +
      `no address or city available for comparison. Skipping SIR photos.`
    );
    return null;
  }

  return extractSIRMedia(data);
}

export async function getListingById(id: string): Promise<MLSProperty | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  if (!data) return null;
  const listing = transformListing(data);

  // Enrich with SIR media (better photos, virtual tours, videos)
  const sirMedia = await getSIRMediaForListing(listing.mls_number, listing.address, listing.city);
  return sirMedia ? enrichListingWithSIRMedia(listing, sirMedia) : listing;
}

export async function getListingByMlsNumber(mlsNumber: string): Promise<MLSProperty | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .eq('listing_id', mlsNumber)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  if (!data) return null;
  const listing = transformListing(data);

  // Enrich with SIR media, passing address/city for verification
  const sirMedia = await getSIRMediaForListing(listing.mls_number, listing.address, listing.city);
  return sirMedia ? enrichListingWithSIRMedia(listing, sirMedia) : listing;
}

export async function getOpenHouseListings(cities?: string[]): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured()) return [];

  const today = new Date().toISOString().split('T')[0];

  // Open houses are in a dedicated "open_houses" table with ListingId linking
  // to the listing. Fetch open house records, then join with graphql_listings
  // for full listing data (photos, beds, baths, etc.).

  // Step 1: Get upcoming open house records
  const { data: ohData, error: ohError } = await supabase
    .from('open_houses')
    .select('ListingId, OpenHouseDate, OpenHouseStartTime, OpenHouseEndTime, OpenHouseRemarks')
    .gte('OpenHouseDate', today)
    .lte('OpenHouseDate', '2099-12-31')
    .order('OpenHouseDate', { ascending: true })
    .limit(200);

  if (ohError || !ohData || ohData.length === 0) {
    if (ohError) console.error('Error fetching open house records:', ohError);
    return [];
  }

  // Step 2: Get unique listing IDs and fetch full listing data
  const listingIds = [...new Set(ohData.map((oh) => oh.ListingId).filter(Boolean))];
  if (listingIds.length === 0) return [];

  const { data: listings, error: listError } = await supabase
    .from('graphql_listings')
    .select('*')
    .in('listing_id', listingIds);

  if (listError || !listings) {
    if (listError) console.error('Error fetching open house listing data:', listError);
    return [];
  }

  // Step 3: Merge open house data onto listings
  const listingMap = new Map(listings.map((l) => [l.listing_id, l]));
  const results: MLSProperty[] = [];

  for (const oh of ohData) {
    const listing = listingMap.get(oh.ListingId);
    if (!listing) continue;

    const merged = transformListing({
      ...listing,
      open_house_date: oh.OpenHouseDate,
      open_house_start_time: oh.OpenHouseStartTime,
      open_house_end_time: oh.OpenHouseEndTime,
      open_house_remarks: oh.OpenHouseRemarks,
    });
    results.push(merged);
  }

  // Step 4: Filter by city if specified
  if (cities && cities.length > 0) {
    const citySet = new Set(cities.map(c => c.toLowerCase()));
    return results.filter(r => r.city && citySet.has(r.city.toLowerCase()));
  }

  return results;
}

// Enrich an array of listings with open house data from the open_houses table
async function enrichListingsWithOpenHouses(listings: MLSProperty[]): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured() || listings.length === 0) return listings;

  const listingIds = listings.map(l => l.mls_number).filter(Boolean);
  if (listingIds.length === 0) return listings;

  const today = new Date().toISOString().split('T')[0];
  const { data: ohData, error } = await supabase
    .from('open_houses')
    .select('ListingId, OpenHouseDate, OpenHouseStartTime, OpenHouseEndTime, OpenHouseRemarks')
    .in('ListingId', listingIds)
    .gte('OpenHouseDate', today)
    .order('OpenHouseDate', { ascending: true });

  if (error || !ohData || ohData.length === 0) return listings;

  // Map: ListingId → first upcoming open house
  const ohMap = new Map<string, typeof ohData[0]>();
  for (const oh of ohData) {
    if (!ohMap.has(oh.ListingId)) {
      ohMap.set(oh.ListingId, oh);
    }
  }

  return listings.map(listing => {
    const oh = ohMap.get(listing.mls_number);
    if (!oh) return listing;
    return {
      ...listing,
      open_house_date: oh.OpenHouseDate,
      open_house_start_time: oh.OpenHouseStartTime,
      open_house_end_time: oh.OpenHouseEndTime,
      open_house_remarks: oh.OpenHouseRemarks,
    };
  });
}

export async function getDistinctCities(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  // Try RPC function first (much more efficient — single query for distinct values)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_distinct_cities');
  if (!rpcError && rpcData) {
    return (rpcData as { city: string }[]).map((d) => d.city).filter(Boolean);
  }

  // Fallback: paginate through all rows (Supabase has 1000 row default limit)
  const allCities = new Set<string>();
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('graphql_listings')
      .select('city')
      .not('city', 'is', null)
      .order('city')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching cities:', error);
      break;
    }
    if (!data || data.length === 0) break;

    data.forEach((d) => { if (d.city) allCities.add(d.city); });
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return [...allCities].sort();
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
  if (!isSupabaseConfigured()) return [];

  // Paginate to avoid 1000 row limit
  const allStatuses = new Set<string>();
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('graphql_listings')
      .select('status')
      .not('status', 'is', null)
      .order('status')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching statuses:', error);
      break;
    }
    if (!data || data.length === 0) break;

    data.forEach((d) => { if (d.status) allStatuses.add(d.status); });
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return [...allStatuses].sort();
}

export async function getDistinctNeighborhoods(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const allNeighborhoods = new Set<string>();
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('graphql_listings')
      .select('subdivision_name')
      .not('subdivision_name', 'is', null)
      .order('subdivision_name')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching neighborhoods:', error);
      break;
    }
    if (!data || data.length === 0) break;

    data.forEach((d) => { if (d.subdivision_name) allNeighborhoods.add(d.subdivision_name); });
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return [...allNeighborhoods].sort();
}

export async function getNeighborhoodsByCity(city: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const allNeighborhoods = new Set<string>();
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('graphql_listings')
      .select('subdivision_name')
      .ilike('city', city)
      .not('subdivision_name', 'is', null)
      .order('subdivision_name')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching neighborhoods for city:', error);
      break;
    }
    if (!data || data.length === 0) break;

    data.forEach((d) => { if (d.subdivision_name) allNeighborhoods.add(d.subdivision_name); });
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return [...allNeighborhoods].sort();
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
  limit: number = 4,
  options?: { agentIds?: string[]; officeName?: string; minPrice?: number; sortBy?: 'date' | 'price'; excludeLand?: boolean }
): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('graphql_listings')
    .select('*')
    .ilike('city', city)
    .or('property_type.eq.Residential,property_type.is.null')
    .or('status.not.in.(Closed,Sold),status.is.null')
    .not('list_price', 'is', null);

  if (options?.excludeLand) {
    query = query
      .not('property_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Lot%');
  }

  if (options?.minPrice) {
    query = query.gte('list_price', options.minPrice);
  }

  if (options?.officeName) {
    query = query.ilike('list_office_name', `%${options.officeName}%`);
  } else if (options?.agentIds && options.agentIds.length > 0) {
    const agentFilter = options.agentIds.map(id => `list_agent_mls_id.ilike.${id}`).join(',');
    query = query.or(agentFilter);
  }

  if (options?.sortBy === 'price') {
    query = query.order('list_price', { ascending: false });
  } else {
    query = query
      .order('listing_date', { ascending: false })
      .order('list_price', { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('Error fetching newest high-priced listings:', error);
    return [];
  }

  const listings = (data || []).map(transformListing);
  const withOpenHouses = await enrichListingsWithOpenHouses(listings);
  return enrichListingsWithSIRMedia(withOpenHouses);
}

/**
 * Get price range for a city: lowest priced condo and highest priced single family home
 */
export async function getCommunityPriceRange(
  city: string
): Promise<{ lowestCondo: number | null; highestSingleFamily: number | null }> {
  if (!isSupabaseConfigured()) return { lowestCondo: null, highestSingleFamily: null };

  // Get lowest priced active listing (prefer condos, fall back to any type)
  const { data: condoData, error: condoError } = await supabase
    .from('graphql_listings')
    .select('list_price')
    .ilike('city', city)
    .or('property_sub_type.eq.Condominium,property_sub_type.is.null')
    .eq('status', 'Active')
    .not('list_price', 'is', null)
    .order('list_price', { ascending: true })
    .limit(1);

  if (condoError) {
    console.error('Error fetching lowest condo price:', condoError);
  }

  // Get highest priced active listing (prefer SFR, fall back to any type)
  const { data: sfhData, error: sfhError } = await supabase
    .from('graphql_listings')
    .select('list_price')
    .ilike('city', city)
    .or('property_sub_type.eq.Single Family Residence,property_sub_type.is.null')
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
  limit: number = 8,
  options?: { agentIds?: string[]; officeName?: string; minPrice?: number; sortBy?: 'date' | 'price'; excludeLand?: boolean }
): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured() || !cities || cities.length === 0) {
    return [];
  }

  // Build OR filter for multiple cities (case-insensitive)
  const cityFilters = cities.map(city => `city.ilike.${city}`).join(',');

  let query = supabase
    .from('graphql_listings')
    .select('*')
    .or(cityFilters)
    .or('property_type.eq.Residential,property_type.is.null')
    .or('status.not.in.(Closed,Sold),status.is.null')
    .not('list_price', 'is', null);

  if (options?.excludeLand) {
    query = query
      .not('property_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Lot%');
  }

  if (options?.minPrice) {
    query = query.gte('list_price', options.minPrice);
  }

  if (options?.officeName) {
    query = query.ilike('list_office_name', `%${options.officeName}%`);
  } else if (options?.agentIds && options.agentIds.length > 0) {
    const agentFilter = options.agentIds.map(id => `list_agent_mls_id.ilike.${id}`).join(',');
    query = query.or(agentFilter);
  }

  if (options?.sortBy === 'price') {
    query = query.order('list_price', { ascending: false });
  } else {
    query = query
      .order('listing_date', { ascending: false })
      .order('list_price', { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('Error fetching newest high-priced listings by cities:', error);
    return [];
  }

  const listings = (data || []).map(transformListing);
  const withOpenHouses = await enrichListingsWithOpenHouses(listings);
  return enrichListingsWithSIRMedia(withOpenHouses);
}

/**
 * Fetches newest high-priced listings without city filtering — returns whatever is in the database
 */
export async function getNewestHighPriced(
  limit: number = 8,
  options?: { agentIds?: string[]; officeName?: string; minPrice?: number; sortBy?: 'date' | 'price'; excludeLand?: boolean }
): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('graphql_listings')
    .select('*')
    .or('property_type.eq.Residential,property_type.is.null')
    .or('status.not.in.(Closed,Sold),status.is.null')
    .not('list_price', 'is', null);

  if (options?.excludeLand) {
    query = query
      .not('property_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Land%')
      .not('property_sub_type', 'ilike', '%Lot%');
  }

  if (options?.minPrice) {
    query = query.gte('list_price', options.minPrice);
  }

  if (options?.officeName) {
    query = query.ilike('list_office_name', `%${options.officeName}%`);
  } else if (options?.agentIds && options.agentIds.length > 0) {
    const agentFilter = options.agentIds.map(id => `list_agent_mls_id.ilike.${id}`).join(',');
    query = query.or(agentFilter);
  }

  if (options?.sortBy === 'price') {
    query = query.order('list_price', { ascending: false });
  } else {
    query = query
      .order('listing_date', { ascending: false })
      .order('list_price', { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('Error fetching newest high-priced listings:', error);
    return [];
  }

  const listings = (data || []).map(transformListing);
  const withOpenHouses = await enrichListingsWithOpenHouses(listings);
  return enrichListingsWithSIRMedia(withOpenHouses);
}

// Enrich an array of listings with SIR media in parallel
async function enrichListingsWithSIRMedia(listings: MLSProperty[]): Promise<MLSProperty[]> {
  if (!isRealogyConfigured() || listings.length === 0) return listings;

  return Promise.all(
    listings.map(async (listing) => {
      if (!listing.mls_number) return listing;
      const sirMedia = await getSIRMediaForListing(listing.mls_number, listing.address, listing.city);
      return sirMedia ? enrichListingWithSIRMedia(listing, sirMedia) : listing;
    })
  );
}

// Extract and categorize media from a Realogy/SIR listing row
interface SIRMediaAssets {
  photos: string[];
  videoUrls: string[];
  virtualTourUrl: string | null;
}

function extractSIRMedia(row: any): SIRMediaAssets {
  const photos: string[] = [];
  const videoUrls: string[] = [];
  let virtualTourUrl: string | null = null;

  if (row.default_photo_url) {
    const url = row.default_photo_url.startsWith('//')
      ? `https:${row.default_photo_url}`
      : row.default_photo_url;
    photos.push(url);
  }

  if (row.media && Array.isArray(row.media)) {
    for (const item of row.media) {
      let url = item?.url;
      if (!url) continue;
      if (url.startsWith('//')) url = `https:${url}`;

      if (item.format === '3D Video') {
        // Matterport or similar virtual tour
        if (!virtualTourUrl) virtualTourUrl = url;
      } else if (item.format === 'Video') {
        videoUrls.push(url);
      } else {
        // Image
        if (!photos.includes(url)) photos.push(url);
      }
    }
  }

  return { photos, videoUrls, virtualTourUrl };
}

function enrichListingWithSIRMedia(listing: MLSProperty, sir: SIRMediaAssets): MLSProperty {
  return {
    ...listing,
    photos: sir.photos.length > 0 ? sir.photos : listing.photos,
    virtual_tour_url: sir.virtualTourUrl || listing.virtual_tour_url,
    video_urls: sir.videoUrls.length > 0 ? sir.videoUrls : listing.video_urls,
  };
}

// Transform a Realogy/SIR listing to the MLSProperty format
function transformRealogyListing(row: any): MLSProperty {
  const sir = extractSIRMedia(row);

  let daysOnMarket: number | null = null;
  if (row.listed_on) {
    const listDate = new Date(row.listed_on);
    daysOnMarket = Math.floor((Date.now() - listDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Parse lot_size string like "0.27 AC" to acres number
  let lotSize: number | null = null;
  if (row.lot_size) {
    const match = String(row.lot_size).match(/([\d.]+)/);
    if (match) lotSize = parseFloat(match[1]);
  }

  return {
    id: row.id,
    mls_number: row.rfg_listing_id || row.entity_id || row.id,
    status: row.is_active ? 'Active' : 'Closed',
    list_price: row.price_amount,
    sold_price: row.is_active ? null : row.price_amount,
    address: row.street_address,
    city: row.city,
    state: row.state_province_code,
    zip_code: row.postal_code,
    neighborhood: row.district || null,
    bedrooms: row.no_of_bedrooms,
    bathrooms: row.total_bath,
    bathrooms_full: row.full_bath,
    bathrooms_half: row.half_bath,
    bathrooms_three_quarter: row.three_quarter_bath,
    square_feet: row.square_footage || row.building_area,
    lot_size: lotSize,
    year_built: row.year_built,
    property_type: row.property_type,
    listing_date: row.listed_on,
    sold_date: null,
    days_on_market: daysOnMarket,
    description: null,
    features: {},
    agent_name: row.primary_agent_name,
    agent_email: null,
    photos: sir.photos,
    video_urls: sir.videoUrls,
    latitude: row.latitude,
    longitude: row.longitude,
    subdivision_name: null,
    mls_area_minor: null,
    furnished: null,
    fireplace_yn: null,
    fireplace_features: null,
    fireplace_total: null,
    cooling: null,
    heating: null,
    laundry_features: null,
    attached_garage_yn: null,
    parking_features: null,
    association_amenities: null,
    virtual_tour_url: sir.virtualTourUrl,
    list_agent_mls_id: null,
    co_list_agent_mls_id: null,
    buyer_agent_mls_id: null,
    co_buyer_agent_mls_id: null,
    open_house_date: null,
    open_house_start_time: null,
    open_house_end_time: null,
    open_house_remarks: null,
    created_at: row.created_at || row.synced_at || '',
    updated_at: row.synced_at || '',
  };
}

async function getRealogyListingsByAgentName(agentName: string): Promise<AgentListingsResult> {
  if (!isRealogyConfigured()) return { activeListings: [], soldListings: [] };

  const realogySupabase = getRealogySupabase();
  if (!realogySupabase) return { activeListings: [], soldListings: [] };

  const { data, error } = await realogySupabase
    .from('realogy_listings')
    .select(`
      id, entity_id, rfg_listing_id, is_active, price_amount, street_address,
      city, state_province_code, postal_code, district, no_of_bedrooms, total_bath,
      full_bath, half_bath, three_quarter_bath, square_footage, building_area,
      lot_size, year_built, property_type, listed_on, default_photo_url, media,
      primary_agent_name, latitude, longitude, created_at, synced_at
    `)
    .ilike('primary_agent_name', agentName)
    .order('listed_on', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching Realogy agent listings:', error);
    return { activeListings: [], soldListings: [] };
  }

  const listings = (data || []).map(transformRealogyListing);

  return {
    activeListings: listings.filter((l) => l.status === 'Active'),
    soldListings: listings.filter((l) => l.status !== 'Active'),
  };
}

// Get listings by agent MLS ID, separated into active and sold
export interface AgentListingsResult {
  activeListings: MLSProperty[];
  soldListings: MLSProperty[];
}

export async function getListingsByAgentId(
  agentMlsId: string | null,
  soldAgentMlsId?: string,
  agentName?: string
): Promise<AgentListingsResult> {
  if (!agentMlsId && !agentName) return { activeListings: [], soldListings: [] };

  // Query both sources in parallel and combine results
  const [mlsResult, realogyResult] = await Promise.all([
    // MLS data — only if configured and agent has an MLS ID
    (isSupabaseConfigured() && agentMlsId)
      ? (async () => {
          // Active listings: only match listing agent roles (not buyer agent)
          const buildListingFilter = (id: string) =>
            `list_agent_mls_id.eq.${id},co_list_agent_mls_id.eq.${id}`;
          // Sold listings: match all agent roles
          const buildAllRolesFilter = (id: string) =>
            `list_agent_mls_id.eq.${id},co_list_agent_mls_id.eq.${id},buyer_agent_mls_id.eq.${id},co_buyer_agent_mls_id.eq.${id}`;

          const activeFilter = buildListingFilter(agentMlsId);
          const soldId = soldAgentMlsId || agentMlsId;
          const soldFilter = soldId === agentMlsId
            ? buildAllRolesFilter(agentMlsId)
            : `${buildAllRolesFilter(agentMlsId)},${buildAllRolesFilter(soldId)}`;

          const [activeRes, soldRes] = await Promise.all([
            supabase
              .from('graphql_listings')
              .select('*')
              .or(activeFilter)
              .or('status.in.(Active,Coming Soon,Active Under Contract,Contingent),status.like.Pending*')
              .order('listing_date', { ascending: false })
              .limit(200),
            supabase
              .from('graphql_listings')
              .select('*')
              .or(soldFilter)
              .or('status.eq.Closed,status.eq.Sold')
              .order('sold_price', { ascending: false, nullsFirst: false })
              .limit(200),
          ]);

          if (activeRes.error) console.error('Error fetching active MLS listings:', activeRes.error);
          if (soldRes.error) console.error('Error fetching sold MLS listings:', soldRes.error);

          const dedup = (listings: any[]) => {
            const seenByListingId = new Set<string>();
            const seenByAddress = new Set<string>();
            return listings.filter((row) => {
              // Dedup by listing_id (MLS number) first
              if (row.listing_id) {
                const lid = String(row.listing_id);
                if (seenByListingId.has(lid)) return false;
                seenByListingId.add(lid);
              }
              // Also dedup by normalized address to catch rows without listing_id
              if (row.address) {
                const addr = String(row.address).toLowerCase().trim();
                if (seenByAddress.has(addr)) return false;
                seenByAddress.add(addr);
              }
              return true;
            });
          };

          return {
            activeListings: dedup(activeRes.data || []).map(transformListing),
            soldListings: dedup(soldRes.data || []).map(transformListing),
          };
        })()
      : Promise.resolve({ activeListings: [] as MLSProperty[], soldListings: [] as MLSProperty[] }),

    // Realogy/SIR listings — by agent name
    agentName
      ? getRealogyListingsByAgentName(agentName)
      : Promise.resolve({ activeListings: [] as MLSProperty[], soldListings: [] as MLSProperty[] }),
  ]);

  // Combine both sources — enrich MLS listings with SIR media when matched
  const mergeWithSIRMedia = (mlsListings: MLSProperty[], sirListings: MLSProperty[]) => {
    const sirByKey = new Map<string, MLSProperty>();
    for (const listing of sirListings) {
      const key = `${listing.address}-${listing.city}-${listing.list_price}`.toLowerCase();
      sirByKey.set(key, listing);
    }

    const seen = new Set<string>();
    const result: MLSProperty[] = [];

    // MLS listings first, enriched with SIR media if matched
    for (const listing of mlsListings) {
      const key = `${listing.address}-${listing.city}-${listing.list_price}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const sirMatch = sirByKey.get(key);
      if (sirMatch && sirMatch.photos.length > 0) {
        result.push({
          ...listing,
          photos: sirMatch.photos,
          virtual_tour_url: sirMatch.virtual_tour_url || listing.virtual_tour_url,
          video_urls: sirMatch.video_urls.length > 0 ? sirMatch.video_urls : listing.video_urls,
        });
      } else {
        result.push(listing);
      }
    }

    // SIR-only listings (no MLS match)
    for (const listing of sirListings) {
      const key = `${listing.address}-${listing.city}-${listing.list_price}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(listing);
      }
    }

    return result;
  };

  return {
    activeListings: mergeWithSIRMedia(mlsResult.activeListings, realogyResult.activeListings),
    soldListings: mergeWithSIRMedia(mlsResult.soldListings, realogyResult.soldListings),
  };
}
