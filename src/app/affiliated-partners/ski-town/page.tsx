import { client } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard } from "../components";

const SKI_TOWN_PARTNERS_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "ski_town"] | order(sortOrder asc, lastName asc) {
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
  title: 'Ski Town Partners | Klug Properties',
  description: 'Meet our network of trusted real estate professionals specializing in premier ski resort communities across North America.',
};

export default async function SkiTownPartnersPage() {
  const partners = await client.fetch<Partner[]>(SKI_TOWN_PARTNERS_QUERY, {}, options);

  // Enrich all partners with agent data from the database
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  const featuredPartners = enrichedPartners.filter(p => p.featured);
  const regularPartners = enrichedPartners.filter(p => !p.featured);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-navy)] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/affiliated-partners" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Affiliated Partners
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">Ski Town</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white tracking-wide mb-6">
            Ski Town Partners
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            Expert agents specializing in premier ski resort communities. From Aspen to Vail,
            Park City to Jackson Hole, our partners know mountain real estate.
          </p>
        </div>
      </section>

      {/* Featured Partners */}
      {featuredPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              Featured Ski Town Partners
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
                  All Ski Town Partners
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
                No ski town partners yet. Check back soon!
              </p>
              <Link href="/affiliated-partners" className="text-[var(--color-gold)] hover:underline">
                View All Partners
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Other Partners CTA */}
      <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
            Looking for Market Leaders?
          </h2>
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8 max-w-2xl mx-auto">
            Explore our network of top-performing agents and industry leaders in their respective markets.
          </p>
          <Link
            href="/affiliated-partners/market-leaders"
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-8 py-3 border border-[var(--color-gold)] hover:bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a] dark:hover:border-white dark:hover:text-white"
          >
            View Market Leaders
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

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
