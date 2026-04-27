import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getSiteName, getBaseUrl } from "@/lib/settings";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "./components";
import CTASection from "./CTASection";
import PartnersMapSection from "./PartnersMapSection";
import { isRealogyConfigured, getRealogySupabase } from "@/lib/realogySupabase";
import { formatPrice, toAddressSlug } from "@/lib/listings";

const PARTNERS_QUERY = `*[_type == "affiliatedPartner" && active == true] | order(sortOrder asc, lastName asc) {
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

const PAGE_CONTENT_QUERY = `*[_type == "affiliatedPartnersPage" && pageType == "main"][0] {
  _id,
  pageType,
  heroTitle,
  heroDescription,
  heroImage,
  logo,
  skiTownCard,
  marketLeadersCard,
  featuredSectionTitle,
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
    title: `Affiliated Partners | ${siteName}`,
    description: 'Meet our network of trusted real estate professionals across premier ski towns and market-leading brokerages.',
    alternates: {
      canonical: `${baseUrl}/affiliated-partners`,
    },
    openGraph: {
      title: `Affiliated Partners | ${siteName}`,
      description: 'Meet our network of trusted real estate professionals across premier ski towns and market-leading brokerages.',
      url: `${baseUrl}/affiliated-partners`,
    },
  };
}

interface PartnerListing {
  id: string;
  street_address: string;
  city: string;
  state_province_code: string;
  price_amount: number;
  default_photo_url: string | null;
  media: any[];
  primary_agent_name: string;
  no_of_bedrooms: number | null;
  total_bath: number | null;
  square_footage: number | null;
  listed_on: string | null;
}

function getPartnerListingPhoto(listing: PartnerListing): string | null {
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

async function getLatestPartnerListings(partners: Partner[], limit = 10): Promise<PartnerListing[]> {
  if (!isRealogyConfigured()) return [];
  const supabase = getRealogySupabase();
  if (!supabase) return [];

  const all: PartnerListing[] = [];

  for (const p of partners) {
    const name = `${p.firstName} ${p.lastName}`.trim();
    if (name.length < 3) continue;
    const parts = name.split(/\s+/);
    const pattern = `${parts[0]}%${parts[parts.length - 1]}`;

    const { data } = await supabase
      .from('realogy_listings')
      .select('id, street_address, city, state_province_code, price_amount, default_photo_url, media, primary_agent_name, no_of_bedrooms, total_bath, square_footage, listed_on')
      .ilike('primary_agent_name', pattern)
      .eq('listing_type', 'ForSale')
      .eq('is_active', true)
      .order('listed_on', { ascending: false, nullsFirst: false })
      .limit(5);

    if (data) all.push(...data);
  }

  // Dedupe by id
  const seen = new Set<string>();
  const unique = all.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });

  // Sort by listed_on desc and cap at limit
  unique.sort((a, b) => {
    const da = a.listed_on ? new Date(a.listed_on).getTime() : 0;
    const db = b.listed_on ? new Date(b.listed_on).getTime() : 0;
    return db - da;
  });

  return unique.slice(0, limit);
}

export default async function AffiliatedPartnersPage() {
  const [partners, pageContent] = await Promise.all([
    client.fetch<Partner[]>(PARTNERS_QUERY, {}, options),
    client.fetch<PageContent | null>(PAGE_CONTENT_QUERY, {}, options),
  ]);

  // Count partners by type
  const skiTownCount = partners.filter(p => p.partnerType === 'ski_town').length;
  const marketLeaderCount = partners.filter(p => p.partnerType === 'market_leader').length;

  // Enrich all partners with agent data for the map
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  // Fetch the 10 most recent active listings from any partner
  const latestPartnerListings = await getLatestPartnerListings(partners, 10);

  // Get featured partners for preview
  const enrichedFeaturedPartners = enrichedPartners.filter(p => p.featured).slice(0, 4);

  // Get hero image URL if available
  const heroImageUrl = pageContent?.heroImage
    ? urlFor(pageContent.heroImage)?.width(1920).height(800).url()
    : null;

  // Get logo URL if available
  const logoUrl = pageContent?.logo
    ? urlFor(pageContent.logo)?.width(200).height(80).url()
    : null;

  // Get category card images
  const skiTownCardImageUrl = pageContent?.skiTownCard?.image
    ? urlFor(pageContent.skiTownCard.image)?.width(600).height(400).url()
    : null;
  const marketLeadersCardImageUrl = pageContent?.marketLeadersCard?.image
    ? urlFor(pageContent.marketLeadersCard.image)?.width(600).height(400).url()
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
          {logoUrl && (
            <div className="mb-8">
              <Image
                src={logoUrl}
                alt="Partners Logo"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
          )}
          <h1 className="font-serif text-white mb-6">
            {pageContent?.heroTitle || 'Affiliated Partners'}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            {pageContent?.heroDescription ||
              'Our network of trusted real estate professionals spans premier ski destinations and market-leading brokerages, ensuring you have expert guidance wherever your next property journey takes you.'}
          </p>
        </div>
      </section>

      {/* Partner Categories */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Ski Town Partners Card */}
            <Link
              href="/affiliated-partners/ski-town"
              className="group relative overflow-hidden bg-[#f8f7f5] dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)]/50 transition-all duration-300"
            >
              {skiTownCardImageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={skiTownCardImageUrl}
                    alt="Ski Town Partners"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f8f7f5] dark:from-[#141414] to-transparent" />
                </div>
              )}
              <div className={`relative z-10 p-10 md:p-14 ${skiTownCardImageUrl ? 'pt-6 md:pt-8' : ''}`}>
                {!skiTownCardImageUrl && (
                  pageContent?.skiTownCard?.icon ? (
                    <div
                      className="w-16 h-16 mb-6 text-[var(--color-gold)]"
                      dangerouslySetInnerHTML={{ __html: pageContent.skiTownCard.icon }}
                    />
                  ) : (
                    <div className="w-16 h-16 mb-6 text-[var(--color-gold)]">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )
                )}
                <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  {pageContent?.skiTownCard?.title || 'Ski Town Partners'}
                </h2>
                <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-6 leading-relaxed">
                  {pageContent?.skiTownCard?.description ||
                    'Expert agents specializing in premier ski resort communities across North America. From Aspen to Vail, Park City to Jackson Hole.'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-gold)] text-sm font-light">
                    {skiTownCount} {skiTownCount === 1 ? 'Partner' : 'Partners'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-[#1a1a1a] dark:text-white text-sm font-light group-hover:text-[var(--color-gold)] transition-colors">
                    View All
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Market Leaders Card */}
            <Link
              href="/affiliated-partners/market-leaders"
              className="group relative overflow-hidden bg-[#f8f7f5] dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)]/50 transition-all duration-300"
            >
              {marketLeadersCardImageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={marketLeadersCardImageUrl}
                    alt="Market Leaders"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f8f7f5] dark:from-[#141414] to-transparent" />
                </div>
              )}
              <div className={`relative z-10 p-10 md:p-14 ${marketLeadersCardImageUrl ? 'pt-6 md:pt-8' : ''}`}>
                {!marketLeadersCardImageUrl && (
                  pageContent?.marketLeadersCard?.icon ? (
                    <div
                      className="w-16 h-16 mb-6 text-[var(--color-gold)]"
                      dangerouslySetInnerHTML={{ __html: pageContent.marketLeadersCard.icon }}
                    />
                  ) : (
                    <div className="w-16 h-16 mb-6 text-[var(--color-gold)]">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )
                )}
                <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  {pageContent?.marketLeadersCard?.title || 'Market Leaders'}
                </h2>
                <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-6 leading-relaxed">
                  {pageContent?.marketLeadersCard?.description ||
                    'Top-performing agents and industry leaders who consistently deliver exceptional results in their respective markets.'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-gold)] text-sm font-light">
                    {marketLeaderCount} {marketLeaderCount === 1 ? 'Partner' : 'Partners'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-[#1a1a1a] dark:text-white text-sm font-light group-hover:text-[var(--color-gold)] transition-colors">
                    View All
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Partner Map Section */}
      <PartnersMapSection
        partners={enrichedPartners}
        title="Our Partner Network"
      />

      {/* Latest Partner Listings */}
      {latestPartnerListings.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-10 md:mb-14">
              <p className="text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-3">
                Just Listed
              </p>
              <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                Latest Partner Listings
              </h2>
              <div className="w-16 h-px bg-[var(--color-gold)] mx-auto mb-6" />
              <p className="text-sm md:text-base text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                The newest properties brought to market by our affiliated partner network.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {latestPartnerListings.map((listing) => {
                const photo = getPartnerListingPhoto(listing);
                return (
                  <div key={listing.id} className="group border border-gray-200 overflow-hidden">
                    <Link href={`/affiliated-partners/market-leaders/listings/${toAddressSlug(listing.street_address)}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-taupe)]">
                        {photo ? (
                          <Image
                            src={photo}
                            alt={`${listing.street_address}, ${listing.city}, ${listing.state_province_code}`}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-gray-900 dark:text-white font-semibold" style={{ fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                        {formatPrice(listing.price_amount)}
                      </h3>
                      <p className="leading-snug line-clamp-1 text-sm text-gray-700 dark:text-gray-300" style={{ marginBottom: '0.125rem' }}>
                        {listing.street_address?.trim()}
                      </p>
                      <p className="leading-snug line-clamp-1 text-xs text-gray-500 dark:text-gray-400" style={{ marginBottom: '0.5rem' }}>
                        {listing.city}, {listing.state_province_code}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                        {listing.no_of_bedrooms != null && <span>{listing.no_of_bedrooms} Beds</span>}
                        {listing.no_of_bedrooms != null && listing.total_bath != null && <span className="w-px h-3 bg-gray-300" />}
                        {listing.total_bath != null && <span>{listing.total_bath} Baths</span>}
                        {listing.total_bath != null && listing.square_footage != null && <span className="w-px h-3 bg-gray-300" />}
                        {listing.square_footage != null && <span>{listing.square_footage.toLocaleString()} SF</span>}
                      </div>
                      {listing.primary_agent_name && (
                        <p className="text-xs text-[#c9ac77] font-light mt-2">
                          {listing.primary_agent_name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/affiliated-partners/market-leaders/listings"
                className="sir-btn"
              >
                <span>Search All Partners Listings</span>
                <span className="sir-arrow" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Partners */}
      {enrichedFeaturedPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              {pageContent?.featuredSectionTitle || 'Featured Partners'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {enrichedFeaturedPartners.map((partner) => (
                <PartnerCard key={partner._id} partner={partner} featured />
              ))}
            </div>
          </div>
        </section>
      )}

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
