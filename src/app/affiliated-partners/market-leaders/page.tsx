import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "../components";
import CTASection from "../CTASection";
import PartnersMapSection from "../PartnersMapSection";
import { getSiteName, getBaseUrl } from "@/lib/settings";
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';
import { formatPrice } from '@/lib/listings';

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
}

async function getMarketLeaderListingsWithVideos(agentNames: string[]): Promise<{ active: MLListing[]; sold: MLListing[] }> {
  if (!isRealogyConfigured() || agentNames.length === 0) return { active: [], sold: [] };
  const supabase = getRealogySupabase();
  if (!supabase) return { active: [], sold: [] };

  // Build OR filter for all agent names with wildcard matching
  const namePatterns = agentNames.map(name => {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]}%${parts[parts.length - 1]}`;
  });

  // Fetch listings with media (which may contain videos)
  const { data, error } = await supabase
    .from('realogy_listings')
    .select('id, street_address, city, state_province_code, price_amount, is_active, default_photo_url, media, primary_agent_name')
    .eq('listing_type', 'ForSale')
    .not('media', 'is', null)
    .order('price_amount', { ascending: false })
    .limit(500);

  if (error || !data) return { active: [], sold: [] };

  // Filter: must match an agent name AND have video in media
  const filtered = data.filter(listing => {
    const agentName = (listing.primary_agent_name || '').toLowerCase();
    const matchesAgent = namePatterns.some(pattern => {
      const parts = pattern.toLowerCase().split('%');
      return parts.every(part => agentName.includes(part));
    });
    if (!matchesAgent) return false;

    // Check for video in media
    const media = Array.isArray(listing.media) ? listing.media : [];
    return media.some((m: any) => m?.format === 'Video' || m?.format === '3D Video');
  });

  const active = filtered.filter(l => l.is_active).slice(0, 8);
  const sold = filtered.filter(l => !l.is_active).slice(0, 8);

  return { active, sold };
}

function getPhotoUrl(listing: MLListing): string | null {
  if (listing.default_photo_url) {
    const url = listing.default_photo_url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.includes('anywhere.re')) return null; // broken CDN for listing photos
    return url;
  }
  const media = Array.isArray(listing.media) ? listing.media : [];
  const image = media.find((m: any) => m?.format === 'Image' && m?.url);
  if (image?.url) {
    const url = image.url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.includes('anywhere.re')) return null;
    return url;
  }
  return null;
}

const MARKET_LEADERS_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "market_leader"] | order(sortOrder asc, lastName asc) {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  latitude,
  longitude,
  email,
  phone,
  website,
  overridePhoto,
  overrideBio,
  specialties,
  featured
}`;

const PAGE_CONTENT_QUERY = `*[_type == "affiliatedPartnersPage" && pageType == "market_leaders"][0] {
  _id,
  pageType,
  heroTitle,
  heroDescription,
  heroImage,
  logo,
  ctaTitle,
  ctaDescription,
  ctaButtonText,
  ctaButtonAction,
  ctaButtonLink
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);

  return {
    title: `Market Leaders | ${siteName}`,
    description: 'Meet our network of top-performing agents and industry leaders in their respective real estate markets.',
    alternates: {
      canonical: `${baseUrl}/affiliated-partners/market-leaders`,
    },
    openGraph: {
      title: `Market Leaders | ${siteName}`,
      description: 'Meet our network of top-performing agents and industry leaders in their respective real estate markets.',
      url: `${baseUrl}/affiliated-partners/market-leaders`,
    },
  };
}

export default async function MarketLeadersPage() {
  const [partners, pageContent] = await Promise.all([
    client.fetch<Partner[]>(MARKET_LEADERS_QUERY, {}, options),
    client.fetch<PageContent | null>(PAGE_CONTENT_QUERY, {}, options),
  ]);

  // Enrich all partners with agent data from the database
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  const featuredPartners = enrichedPartners.filter(p => p.featured);
  const regularPartners = enrichedPartners.filter(p => !p.featured);

  // Fetch market leader listings with videos
  const agentNames = partners.map(p => `${p.firstName} ${p.lastName}`).filter(n => n.trim().length > 1);
  const { active: activeVideoListings, sold: soldVideoListings } = await getMarketLeaderListingsWithVideos(agentNames);

  // Get hero image URL if available
  const heroImageUrl = pageContent?.heroImage
    ? urlFor(pageContent.heroImage)?.width(1920).height(800).url()
    : null;

  // Get logo URL if available
  const logoUrl = pageContent?.logo
    ? urlFor(pageContent.logo)?.width(200).height(80).url()
    : null;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-navy)] py-20 md:py-28">
        {heroImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={heroImageUrl}
              alt=""
              fill
              className="object-cover opacity-30"
              priority
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/affiliated-partners" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Affiliated Partners
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">Market Leaders</span>
          </div>

          {logoUrl && (
            <div className="mb-8">
              <Image
                src={logoUrl}
                alt="Market Leaders Logo"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
          )}

          <h1 className="font-serif text-white mb-6">
            {pageContent?.heroTitle || 'Market Leaders'}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            {pageContent?.heroDescription ||
              'Top-performing agents and industry leaders who consistently deliver exceptional results in their respective markets across the country.'}
          </p>
        </div>
      </section>

      {/* SIR Market Leaders Intro */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[#c9ac77] text-[11px] uppercase tracking-[0.3em] font-light mb-6">
            It takes true masters to represent a masterpiece
          </p>
          <div className="w-12 h-px bg-[#c9ac77] mx-auto mb-8" />
          <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-base md:text-lg leading-relaxed mb-12 max-w-4xl mx-auto">
            Market Leaders, an exclusive Sotheby&apos;s International Realty group, is the first and only global agent association of its kind. Composed of some of the industry&apos;s most prolific agents across the world&apos;s most prestigious destinations, Market Leaders provides industry intelligence, thought leadership and strategic introductions for its clients.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-serif font-light text-[#c9ac77] mb-2">50</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">Market Leaders</p>
            </div>
            <div className="text-center border-x border-[#e8e6e3] dark:border-gray-700">
              <p className="text-4xl md:text-5xl font-serif font-light text-[#c9ac77] mb-2">$500M+</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">Buyer-Seller Connections</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-serif font-light text-[#c9ac77] mb-2">$8.2B+</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-light">Annual Transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newest Market Leader Listings (with video) */}
      {activeVideoListings.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                Newest Market Leader Listings
              </h2>
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
                Featured properties with video tours from our Market Leaders
              </p>
              <div className="w-12 h-px bg-[#c9ac77] mx-auto mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeVideoListings.map((listing) => {
                const photo = getPhotoUrl(listing);
                return (
                  <div key={listing.id} className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 overflow-hidden group">
                    <div className="relative aspect-[16/10] bg-[#f0f0f0] dark:bg-gray-800 overflow-hidden">
                      {photo ? (
                        <Image src={photo} alt={listing.street_address || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-green-600 text-white text-[10px] uppercase tracking-wider px-2 py-1">Active</span>
                        <span className="bg-[#c9ac77] text-white text-[10px] uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          Video
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-1">
                        {formatPrice(listing.price_amount)}
                      </p>
                      <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light line-clamp-1 mb-2">
                        {listing.street_address?.trim()}, {listing.city}
                      </p>
                      <p className="text-xs text-[#c9ac77] font-light">
                        {listing.primary_agent_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recently Sold by Market Leaders (with video) */}
      {soldVideoListings.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                Recently Sold by Market Leaders
              </h2>
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
                Notable recent transactions with video showcases
              </p>
              <div className="w-12 h-px bg-[#c9ac77] mx-auto mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {soldVideoListings.map((listing) => {
                const photo = getPhotoUrl(listing);
                return (
                  <div key={listing.id} className="bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 overflow-hidden">
                    <div className="relative aspect-[16/10] bg-[#f0f0f0] dark:bg-gray-800 overflow-hidden">
                      {photo ? (
                        <Image src={photo} alt={listing.street_address || ''} fill className="object-cover grayscale-[30%]" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-[#8a8a8a] text-white text-[10px] uppercase tracking-wider px-2 py-1">Sold</span>
                        <span className="bg-[#c9ac77] text-white text-[10px] uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          Video
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-1">
                        {formatPrice(listing.price_amount)}
                      </p>
                      <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light line-clamp-1 mb-2">
                        {listing.street_address?.trim()}, {listing.city}
                      </p>
                      <p className="text-xs text-[#c9ac77] font-light">
                        {listing.primary_agent_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Partner Map Section */}
      <PartnersMapSection
        partners={enrichedPartners}
        title="Find Our Market Leaders"
      />

      {/* Featured Partners */}
      {featuredPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              Featured Market Leaders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {featuredPartners.map((partner) => (
                <PartnerCard key={partner._id} partner={partner} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Partners */}
      <section className={`py-16 md:py-24 ${featuredPartners.length > 0 ? 'bg-[#f8f7f5] dark:bg-[#141414]' : 'bg-white dark:bg-[#1a1a1a]'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {regularPartners.length > 0 ? (
            <>
              {featuredPartners.length > 0 && (
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
                  All Market Leaders
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {regularPartners.map((partner) => (
                  <PartnerCard key={partner._id} partner={partner} />
                ))}
              </div>
            </>
          ) : featuredPartners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
                No market leaders yet. Check back soon!
              </p>
              <Link href="/affiliated-partners" className="text-[var(--color-gold)] hover:underline">
                View All Partners
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title={pageContent?.ctaTitle}
        description={pageContent?.ctaDescription}
        buttonText={pageContent?.ctaButtonText}
        buttonAction={pageContent?.ctaButtonAction}
        buttonLink={pageContent?.ctaButtonLink}
      />
    </main>
  );
}
