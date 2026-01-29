import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "./components";
import CTASection from "./CTASection";
import PartnersMapSection from "./PartnersMapSection";

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Affiliated Partners | Klug Properties',
    description: 'Meet our network of trusted real estate professionals across premier ski towns and market-leading brokerages.',
    alternates: {
      canonical: `${baseUrl}/affiliated-partners`,
    },
    openGraph: {
      title: 'Affiliated Partners | Klug Properties',
      description: 'Meet our network of trusted real estate professionals across premier ski towns and market-leading brokerages.',
      url: `${baseUrl}/affiliated-partners`,
    },
  };
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
