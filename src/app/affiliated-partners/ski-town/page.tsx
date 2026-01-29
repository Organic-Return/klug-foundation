import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "../components";
import CTASection from "../CTASection";
import PartnersMapSection from "../PartnersMapSection";

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

const PAGE_CONTENT_QUERY = `*[_type == "affiliatedPartnersPage" && pageType == "ski_town"][0] {
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Ski Town Partners | Klug Properties',
    description: 'Meet our network of trusted real estate professionals specializing in premier ski resort communities across North America.',
    alternates: {
      canonical: `${baseUrl}/affiliated-partners/ski-town`,
    },
    openGraph: {
      title: 'Ski Town Partners | Klug Properties',
      description: 'Meet our network of trusted real estate professionals specializing in premier ski resort communities across North America.',
      url: `${baseUrl}/affiliated-partners/ski-town`,
    },
  };
}

export default async function SkiTownPartnersPage() {
  const [partners, pageContent] = await Promise.all([
    client.fetch<Partner[]>(SKI_TOWN_PARTNERS_QUERY, {}, options),
    client.fetch<PageContent | null>(PAGE_CONTENT_QUERY, {}, options),
  ]);

  // Enrich all partners with agent data from the database
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  const featuredPartners = enrichedPartners.filter(p => p.featured);
  const regularPartners = enrichedPartners.filter(p => !p.featured);

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
            <span className="text-white/80 text-sm font-light">Ski Town</span>
          </div>

          {logoUrl && (
            <div className="mb-8">
              <Image
                src={logoUrl}
                alt="Ski Town Partners Logo"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
          )}

          <h1 className="font-serif text-white mb-6">
            {pageContent?.heroTitle || 'Ski Town Partners'}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            {pageContent?.heroDescription ||
              'Expert agents specializing in premier ski resort communities. From Aspen to Vail, Park City to Jackson Hole, our partners know mountain real estate.'}
          </p>
        </div>
      </section>

      {/* Partner Map Section */}
      <PartnersMapSection
        partners={enrichedPartners}
        title="Find Our Ski Town Partners"
      />

      {/* Featured Partners */}
      {featuredPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
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
