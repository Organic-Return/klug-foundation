import { client } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard } from "./components";

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
  email,
  phone,
  website,
  overridePhoto,
  overrideBio,
  specialties,
  featured
}`;

const options = { next: { revalidate: 60 } };

export const metadata: Metadata = {
  title: 'Affiliated Partners | Klug Properties',
  description: 'Meet our network of trusted real estate professionals across premier ski towns and market-leading brokerages.',
};

export default async function AffiliatedPartnersPage() {
  const partners = await client.fetch<Partner[]>(PARTNERS_QUERY, {}, options);

  // Count partners by type
  const skiTownCount = partners.filter(p => p.partnerType === 'ski_town').length;
  const marketLeaderCount = partners.filter(p => p.partnerType === 'market_leader').length;

  // Get featured partners for preview
  const featuredPartners = partners.filter(p => p.featured).slice(0, 4);

  // Enrich featured partners with agent data
  const enrichedFeaturedPartners = await Promise.all(
    featuredPartners.map(partner => enrichPartnerWithAgentData(partner))
  );

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-navy)] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white tracking-wide mb-6">
            Affiliated Partners
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            Our network of trusted real estate professionals spans premier ski destinations and market-leading brokerages,
            ensuring you have expert guidance wherever your next property journey takes you.
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
              className="group relative overflow-hidden bg-[#f8f7f5] dark:bg-[#141414] p-10 md:p-14 border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)]/50 transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 text-[var(--color-gold)]">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  Ski Town Partners
                </h2>
                <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-6 leading-relaxed">
                  Expert agents specializing in premier ski resort communities across North America.
                  From Aspen to Vail, Park City to Jackson Hole.
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
              className="group relative overflow-hidden bg-[#f8f7f5] dark:bg-[#141414] p-10 md:p-14 border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)]/50 transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 text-[var(--color-gold)]">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  Market Leaders
                </h2>
                <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-6 leading-relaxed">
                  Top-performing agents and industry leaders who consistently deliver exceptional results
                  in their respective markets.
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

      {/* Featured Partners */}
      {enrichedFeaturedPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              Featured Partners
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
      <section className="py-20 md:py-28 bg-[var(--color-navy)]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            Looking to Partner With Us?
          </h2>
          <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            We&apos;re always looking to connect with exceptional real estate professionals who share our commitment to excellence.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            Get in Touch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
