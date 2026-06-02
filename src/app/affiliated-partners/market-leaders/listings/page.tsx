import { client } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";
import { getSiteName, getBaseUrl } from "@/lib/settings";
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';
import MarketLeaderListingCard from './MarketLeaderListingCard';

export const revalidate = 60;

interface MLListing {
  id: string;
  street_address: string;
  city: string;
  state_province_code: string;
  price_amount: number;
  is_active: boolean;
  default_photo_url: string | null;
  media: any[];
  primary_agent_name: string;
  no_of_bedrooms: number | null;
  total_bath: number | null;
  square_footage: number | null;
  property_type: string | null;
}

const PARTNERS_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "market_leader"]{firstName, lastName}`;

function getPhotoUrl(listing: MLListing): string | null {
  if (listing.default_photo_url) {
    const url = listing.default_photo_url;
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  }
  const media = Array.isArray(listing.media) ? listing.media : [];
  const image = media.find((m: any) => m?.format === 'Image' && m?.url);
  if (image?.url) {
    const url = image.url;
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  }
  return null;
}

async function getAllMarketLeaderListings(): Promise<MLListing[]> {
  if (!isRealogyConfigured()) return [];
  const supabase = getRealogySupabase();
  if (!supabase) return [];

  const partners = await client.fetch<{ firstName: string; lastName: string }[]>(PARTNERS_QUERY);
  const allListings: MLListing[] = [];

  for (const p of partners) {
    const name = `${p.firstName} ${p.lastName}`.trim();
    if (name.length < 3) continue;
    const parts = name.split(/\s+/);
    const pattern = `${parts[0]}%${parts[parts.length - 1]}`;

    const { data } = await supabase
      .from('realogy_listings')
      .select('id, street_address, city, state_province_code, price_amount, is_active, default_photo_url, media, primary_agent_name, no_of_bedrooms, total_bath, square_footage, property_type')
      .ilike('primary_agent_name', pattern)
      .eq('listing_type', 'ForSale')
      .order('price_amount', { ascending: false })
      .limit(10);

    if (data) allListings.push(...data);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allListings.filter(l => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });

  // Sort by price desc
  unique.sort((a, b) => (b.price_amount || 0) - (a.price_amount || 0));
  return unique;
}

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Market Leader Listings | ${siteName}`,
    description: 'Browse all properties from our network of Sotheby\'s International Realty Market Leaders.',
    alternates: { canonical: `${baseUrl}/affiliated-partners/market-leaders/listings` },
  };
}

export default async function MarketLeaderListingsPage() {
  const allListings = await getAllMarketLeaderListings();
  // Hide listings whose row has no usable photo URL anywhere (no
  // default_photo_url and no media[] Image entry). We don't HEAD-check
  // the URL — Realogy's CDN refuses requests from some IPs and would
  // wrongly mark every tile as broken — instead we rely on next/image's
  // own onError + the upstream sync keeping the column truthful.
  const listings = allListings.filter((l) => getPhotoUrl(l));
  const activeListings = listings.filter(l => l.is_active);
  const soldListings = listings.filter(l => !l.is_active);

  return (
    <main className="-mt-20 min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--color-sothebys-blue)] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <div className="mb-6">
            <Link href="/affiliated-partners/market-leaders" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Market Leaders
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">All Listings</span>
          </div>
          <h1 className="font-serif text-white mb-4">Market Leader Properties</h1>
          <p className="text-white/60 font-light max-w-2xl mx-auto">
            {activeListings.length} active {activeListings.length === 1 ? 'listing' : 'listings'} from our Market Leaders network
          </p>
          <div className="w-12 h-px bg-[#c9ac77] mx-auto mt-6" />
        </div>
      </section>

      {/* Active Listings */}
      {activeListings.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-8">
              Active Listings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {activeListings.map((listing) => {
                const photo = getPhotoUrl(listing);
                if (!photo) return null;
                return (
                  <MarketLeaderListingCard
                    key={listing.id}
                    listing={listing}
                    photoUrl={photo}
                    variant="active"
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sold Listings */}
      {soldListings.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-8">
              Recently Sold ({soldListings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {soldListings.map((listing) => {
                const photo = getPhotoUrl(listing);
                if (!photo) return null;
                return (
                  <MarketLeaderListingCard
                    key={listing.id}
                    listing={listing}
                    photoUrl={photo}
                    variant="sold"
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Back */}
      <section className="py-12 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <Link
            href="/affiliated-partners/market-leaders"
            className="klug-nav-link inline-flex items-center gap-3 text-sm font-light text-[#1a1a1a] dark:text-white hover:text-[#c9ac77] transition-colors"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Back to Market Leaders
          </Link>
        </div>
      </section>
    </main>
  );
}
