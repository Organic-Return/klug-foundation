import { Metadata } from 'next';
import { client } from '@/sanity/client';
import {
  getListingsByAgentId,
  getMlsNumbersWithSIRMedia,
  type MLSProperty,
} from '@/lib/listings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSiteName, getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from '@/components/AgentListingsGrid';

// Refresh frequently so newest Aspen listings stay current
export const revalidate = 300;

interface ChrisDoc {
  _id: string;
  name: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, baseUrl] = await Promise.all([getSiteName(), getBaseUrl()]);
  const title = `Exclusive and New | ${siteName}`;
  const description = `Chris Klug's current active listings and the 10 newest single family homes for sale in Aspen, Colorado.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/exclusive-and-new` },
    openGraph: { title, description, url: `${baseUrl}/exclusive-and-new` },
  };
}

// Fetch the 10 newest single-family residential listings in Aspen.
async function getNewestAspenSingleFamily(limit = 10): Promise<MLSProperty[]> {
  if (!isSupabaseConfigured()) return [];

  const activeStatuses = [
    'Active',
    'Coming Soon',
    'Active Under Contract',
    'Contingent',
    'Pending',
    'Pending Inspect/Feasib',
    'Active U/C W/ Bump',
    'To Be Built',
  ];

  const { data, error } = await supabase
    .from('graphql_listings')
    .select('*')
    .ilike('city', 'Aspen')
    .in('status', activeStatuses)
    .or(
      'property_sub_type.eq.Single Family Residence,property_sub_type.eq.Site Built-Owned Lot,property_sub_type.eq.Residential,property_sub_type.is.null'
    )
    .not('property_type', 'in', '(Residential Lease,Commercial Lease,Res Vacant Land,RES Vacant Land,Commercial Sale)')
    .not('list_price', 'is', null)
    .order('listing_date', { ascending: false })
    .limit(limit * 2); // overfetch a bit then dedupe

  if (error) {
    console.error('Error fetching newest Aspen single family:', error);
    return [];
  }

  // Lightweight dedupe by listing_id
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const row of data || []) {
    const id = String(row.listing_id || row.id);
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(row);
    if (unique.length >= limit) break;
  }

  // Use the existing transformer via dynamic import path. Easier: re-shape inline.
  // The transform is exported indirectly through enrichment helpers; instead,
  // delegate to getMlsNumbersWithSIRMedia to enrich, but we still need MLSProperty shape.
  // Simplest: import transformListing-like behavior via the MLSProperty fields used by the grid.
  return unique.map((row: any) => ({
    id: row.id,
    mls_number: row.mls_number || row.listing_id,
    status: row.status === 'Closed' ? 'Sold' : row.status,
    list_price: row.list_price,
    sold_price: row.sold_price,
    address: row.address,
    city: row.city,
    state: row.state || row.state_code,
    zip_code: row.postal_code || row.zip_code,
    neighborhood: row.subdivision_name || row.neighborhood,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    bathrooms_full: row.bathrooms_full,
    bathrooms_half: row.bathrooms_half,
    bathrooms_three_quarter: row.bathrooms_three_quarter,
    square_feet: row.square_feet || row.living_area,
    lot_size: row.lot_size_acres,
    year_built: row.year_built,
    property_type: row.property_sub_type || row.property_type,
    listing_date: row.listing_date,
    sold_date: row.close_date,
    days_on_market: row.days_on_market,
    description: row.description,
    features: {},
    agent_name: row.list_agent_full_name,
    agent_email: null,
    photos: Array.isArray(row.media) ? row.media.filter((m: any) => m).map((m: any) => m.url || m).filter(Boolean) : [],
    video_urls: [],
    latitude: row.latitude,
    longitude: row.longitude,
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
    list_agent_full_name: row.list_agent_full_name,
    co_list_agent_mls_id: row.co_list_agent_mls_id,
    buyer_agent_mls_id: row.buyer_agent_mls_id,
    co_buyer_agent_mls_id: row.co_buyer_agent_mls_id,
    list_office_name: row.list_office_name,
    open_house_date: row.open_house_date,
    open_house_start_time: row.open_house_start_time,
    open_house_end_time: row.open_house_end_time,
    open_house_remarks: row.open_house_remarks,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  })) as MLSProperty[];
}

export default async function ExclusiveAndNewPage() {
  // Look up Chris Klug's MLS ID from Sanity (preferred over hardcoded)
  const chris = await client.fetch<ChrisDoc | null>(
    `*[_type == "teamMember" && (slug.current == "chris-klug" || lower(name) == "chris klug")][0]{ _id, name, mlsAgentId, mlsAgentIdSold }`,
    {},
    { next: { revalidate: 300 } }
  );

  const chrisMlsId = chris?.mlsAgentId || '3837';
  const chrisName = chris?.name || 'Chris Klug';

  // Section 1: Chris's active listings
  const chrisListings = await getListingsByAgentId(chrisMlsId, chris?.mlsAgentIdSold, chrisName);

  // Section 2: 10 newest single-family active listings in Aspen
  const newestAspen = await getNewestAspenSingleFamily(10);

  // SIR media enrichment for both sets
  const allMlsNumbers = [
    ...chrisListings.activeListings.map((l) => l.mls_number),
    ...newestAspen.map((l) => l.mls_number),
  ].filter(Boolean) as string[];
  const sirMedia = await getMlsNumbersWithSIRMedia(allMlsNumbers);
  const mlsWithVideos = Array.from(sirMedia.videos);
  const mlsWithMatterport = Array.from(sirMedia.matterports);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="bg-[var(--color-sothebys-blue)] py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[#c9ac77] text-xs tracking-[0.3em] uppercase mb-6">
            Aspen Real Estate
          </p>
          <h1 className="font-serif text-white tracking-wide mb-6">
            Exclusive and New
          </h1>
          <div className="w-16 h-px bg-[#c9ac77] mx-auto mb-6" />
          <p className="text-base md:text-lg text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            Chris Klug&apos;s current exclusive listings, alongside the freshest single
            family homes to hit the Aspen market. Updated continuously from the MLS.
          </p>
        </div>
      </section>

      {/* Section 1: Chris's Exclusive Listings */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-3">
              Chris Klug Exclusive
            </p>
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Current Listings
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto" />
          </div>

          {chrisListings.activeListings.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              No active listings at this time.
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={chrisListings.activeListings}
              soldListings={[]}
              mlsWithVideos={mlsWithVideos}
              mlsWithMatterport={mlsWithMatterport}
            />
          )}
        </div>
      </section>

      {/* Section 2: Newest Single Family in Aspen */}
      <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-3">
              Just Listed
            </p>
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Newest Aspen Single Family Homes
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto mb-6" />
            <p className="text-sm md:text-base text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
              The ten most recently listed single family residences in Aspen, refreshed
              continuously from the Aspen Glenwood MLS.
            </p>
          </div>

          {newestAspen.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              No new Aspen listings available.
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={newestAspen}
              soldListings={[]}
              mlsWithVideos={mlsWithVideos}
              mlsWithMatterport={mlsWithMatterport}
            />
          )}
        </div>
      </section>
    </main>
  );
}
