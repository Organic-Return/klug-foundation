/**
 * GraphQL Listings Client
 *
 * Fetches MLS listings directly from an AppSync GraphQL API when
 * API_LISTINGS_URL and API_LISTINGS_KEY environment variables are set.
 * Used as an alternative data source to Supabase for specific deployments
 * (e.g. skk-foundation).
 *
 * All listings are fetched and cached in memory, then filtered/sorted/paginated
 * in JavaScript since the API has limited query capabilities.
 */

// Raw listing shape from the GraphQL API (PascalCase fields)
interface APIListing {
  ListingId: string;
  MlsStatus: string | null;
  ListPrice: number | null;
  ClosePrice: number | null;
  UnparsedAddress: string | null;
  StreetNumber: string | null;
  StreetName: string | null;
  StreetSuffix: string | null;
  StreetDirPrefix: string | null;
  UnitNumber: string | null;
  City: string | null;
  StateOrProvince: string | null;
  PostalCode: string | null;
  BedroomsTotal: number | null;
  BathroomsTotalInteger: number | null;
  BathroomsFull: number | null;
  BathroomsHalf: number | null;
  BathroomsThreeQuarter: number | null;
  BuildingAreaTotal: number | null;
  LivingArea: number | null;
  LotSizeAcres: number | null;
  YearBuilt: string | null;
  PropertyType: string | null;
  PropertySubType: string | null;
  OnMarketDate: string | null;
  CloseDate: string | null;
  OriginalListPrice: number | null;
  PublicRemarks: string | null;
  SubdivisionName: string | null;
  MLSAreaMajor: string | null;
  MLSAreaMinor: string | null;
  PrefferedPhoto: string | null;
  Media: string | null; // AWSJSON
  Latitude: number | null;
  Longitude: number | null;
  ListOfficeName: string | null;
  ListAgentMlsId: string | null;
  CoListAgentMlsId: string | null;
  BuyerAgentMlsId: string | null;
  CoBuyerAgentMlsId: string | null;
  VirtualTourURLUnbranded: string | null;
  Furnished: string | null;
  FireplaceYN: boolean | null;
  FireplacesTotal: number | null;
  Cooling: string | null; // AWSJSON
  Heating: string | null; // AWSJSON
  LaundryFeatures: string | null; // AWSJSON
  AttachedGarageYN: boolean | null;
  ParkingFeatures: string | null; // AWSJSON
  AssociationAmenities: string | null; // AWSJSON
  StandardStatus: string | null;
}

// Matches the GraphQLListing interface from listings.ts (snake_case)
interface NormalizedListing {
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
  media: any[] | null;
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

// Parse AWSJSON string to array
function parseAWSJSON(json: string | null): any[] | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Transform API listing to normalized format
function transformAPIListing(item: APIListing): NormalizedListing {
  const now = new Date().toISOString();
  const media = parseAWSJSON(item.Media);

  return {
    id: item.ListingId,
    listing_id: item.ListingId,
    status: item.MlsStatus || item.StandardStatus || 'Unknown',
    list_price: item.ListPrice,
    sold_price: item.ClosePrice,
    address: item.UnparsedAddress,
    street_number: item.StreetNumber,
    street_name: item.StreetName,
    street_suffix: item.StreetSuffix,
    unit_number: item.UnitNumber,
    city: item.City,
    state: item.StateOrProvince,
    county: null,
    zip_code: item.PostalCode,
    bedrooms: item.BedroomsTotal,
    bathrooms_total: item.BathroomsTotalInteger,
    bathrooms_full: item.BathroomsFull,
    bathrooms_half: item.BathroomsHalf,
    bathrooms_three_quarter: item.BathroomsThreeQuarter,
    square_feet: item.BuildingAreaTotal,
    living_area: item.LivingArea,
    lot_size_square_feet: null,
    lot_size_acres: item.LotSizeAcres,
    year_built: item.YearBuilt,
    property_type: item.PropertyType,
    property_sub_type: item.PropertySubType,
    listing_date: item.OnMarketDate,
    close_date: item.CloseDate,
    original_list_price: item.OriginalListPrice,
    description: item.PublicRemarks,
    subdivision_name: item.SubdivisionName,
    mls_area_major: item.MLSAreaMajor,
    mls_area_minor: item.MLSAreaMinor,
    preferred_photo: item.PrefferedPhoto,
    media,
    latitude: item.Latitude,
    longitude: item.Longitude,
    list_office_name: item.ListOfficeName,
    list_agent_mls_id: item.ListAgentMlsId,
    co_list_agent_mls_id: item.CoListAgentMlsId,
    buyer_agent_mls_id: item.BuyerAgentMlsId,
    co_buyer_agent_mls_id: item.CoBuyerAgentMlsId,
    virtual_tour_url: item.VirtualTourURLUnbranded,
    furnished: item.Furnished,
    fireplace_yn: item.FireplaceYN,
    fireplace_features: null,
    fireplace_total: item.FireplacesTotal,
    cooling: parseAWSJSON(item.Cooling) as string[] | null,
    heating: parseAWSJSON(item.Heating) as string[] | null,
    laundry_features: parseAWSJSON(item.LaundryFeatures) as string[] | null,
    attached_garage_yn: item.AttachedGarageYN,
    parking_features: parseAWSJSON(item.ParkingFeatures) as string[] | null,
    association_amenities: parseAWSJSON(item.AssociationAmenities) as string[] | null,
    created_at: now,
    updated_at: now,
  };
}

const LISTING_FIELDS = `
  ListingId
  MlsStatus
  ListPrice
  ClosePrice
  UnparsedAddress
  StreetNumber
  StreetName
  StreetSuffix
  StreetDirPrefix
  UnitNumber
  City
  StateOrProvince
  PostalCode
  BedroomsTotal
  BathroomsTotalInteger
  BathroomsFull
  BathroomsHalf
  BathroomsThreeQuarter
  BuildingAreaTotal
  LivingArea
  LotSizeAcres
  YearBuilt
  PropertyType
  PropertySubType
  OnMarketDate
  CloseDate
  OriginalListPrice
  PublicRemarks
  SubdivisionName
  MLSAreaMajor
  MLSAreaMinor
  PrefferedPhoto
  Media
  Latitude
  Longitude
  ListOfficeName
  ListAgentMlsId
  CoListAgentMlsId
  BuyerAgentMlsId
  CoBuyerAgentMlsId
  VirtualTourURLUnbranded
  Furnished
  FireplaceYN
  FireplacesTotal
  Cooling
  Heating
  LaundryFeatures
  AttachedGarageYN
  ParkingFeatures
  AssociationAmenities
  StandardStatus
`;

// In-memory cache
let cachedListings: NormalizedListing[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getConfig() {
  const url = process.env.API_LISTINGS_URL;
  const key = process.env.API_LISTINGS_KEY;
  const limit = parseInt(process.env.API_LISTINGS_LIMIT || '1000', 10);
  return { url, key, limit };
}

export function isGraphQLEnabled(): boolean {
  const { url, key } = getConfig();
  return !!url && !!key;
}

async function fetchPage(
  url: string,
  key: string,
  limit: number,
  nextToken?: string
): Promise<{ items: APIListing[]; nextToken?: string }> {
  const query = `
    query ListAllListings($limit: Int, $nextToken: String) {
      listListings(limit: $limit, nextToken: $nextToken) {
        items {
          ${LISTING_FIELDS}
        }
        nextToken
      }
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify({
      query,
      variables: { limit, nextToken: nextToken || null },
    }),
    next: { revalidate: 300 }, // Next.js fetch cache: 5 min
  });

  if (!response.ok) {
    throw new Error(`GraphQL API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  const data = json.data?.listListings;
  return {
    items: data?.items || [],
    nextToken: data?.nextToken || undefined,
  };
}

export async function getAllListings(): Promise<NormalizedListing[]> {
  // Return cached data if still fresh
  if (cachedListings && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedListings;
  }

  const { url, key, limit } = getConfig();
  if (!url || !key) {
    console.error('[GraphQL] Missing API_LISTINGS_URL or API_LISTINGS_KEY');
    return [];
  }

  console.log('[GraphQL] Fetching all listings from AppSync API...');

  const allItems: APIListing[] = [];
  let nextToken: string | undefined;
  let pageCount = 0;
  const maxPages = 20; // Safety limit

  do {
    const page = await fetchPage(url, key, limit, nextToken);
    allItems.push(...page.items);
    nextToken = page.nextToken;
    pageCount++;
    console.log(`[GraphQL] Page ${pageCount}: ${page.items.length} items (total: ${allItems.length})`);
  } while (nextToken && pageCount < maxPages);

  console.log(`[GraphQL] Fetched ${allItems.length} total listings in ${pageCount} page(s)`);

  // Transform and cache
  cachedListings = allItems.map(transformAPIListing);
  cacheTimestamp = Date.now();

  return cachedListings;
}

// Case-insensitive string match helper
function ilike(value: string | null, pattern: string): boolean {
  if (!value) return false;
  // Handle SQL ILIKE patterns: %pattern% means contains
  const clean = pattern.replace(/%/g, '').toLowerCase();
  return value.toLowerCase().includes(clean);
}

function eqCI(value: string | null, target: string): boolean {
  if (!value) return false;
  return value.toLowerCase() === target.toLowerCase();
}

export type { NormalizedListing };
export { ilike, eqCI };
