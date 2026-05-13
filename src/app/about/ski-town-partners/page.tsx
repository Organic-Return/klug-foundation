import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "@/app/affiliated-partners/components";
import CTASection from "@/app/affiliated-partners/CTASection";
import PartnersMapSection from "@/app/affiliated-partners/PartnersMapSection";
import { getSiteName, getBaseUrl, getDefaultHeroImageUrl } from "@/lib/settings";

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

const PAGE_CONTENT_QUERY = `*[_type == "affiliatedPartnersPage" && _id == "affiliatedPartnersPageSkiTown"][0] {
  _id,
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

// Refresh promptly when editors publish in Sanity Studio
export const revalidate = 10;
const options = { next: { revalidate: 10 } };

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);

  return {
    title: `Ski Town Partners | ${siteName}`,
    description: 'Meet our network of trusted real estate professionals specializing in premier ski resort communities across North America.',
    alternates: {
      canonical: `${baseUrl}/affiliated-partners/ski-town`,
    },
    openGraph: {
      title: `Ski Town Partners | ${siteName}`,
      description: 'Meet our network of trusted real estate professionals specializing in premier ski resort communities across North America.',
      url: `${baseUrl}/affiliated-partners/ski-town`,
    },
  };
}

export default async function SkiTownPartnersPage() {
  const [partners, pageContent, defaultHeroUrl] = await Promise.all([
    client.fetch<Partner[]>(SKI_TOWN_PARTNERS_QUERY, {}, options),
    client.fetch<PageContent | null>(PAGE_CONTENT_QUERY, {}, options),
    getDefaultHeroImageUrl(),
  ]);

  // Enrich all partners with agent data from the database
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  const featuredPartners = enrichedPartners.filter(p => p.featured);
  const regularPartners = enrichedPartners.filter(p => !p.featured);

  // Get hero image URL if available, fall back to site-wide default
  const heroImageUrl = pageContent?.heroImage
    ? urlFor(pageContent.heroImage)?.width(1920).height(800).url()
    : defaultHeroUrl;

  // Width-only URL preserves the logo's natural aspect ratio so wide
  // wordmarks like "COLORADO SKI TOWNS" don't get cropped to a square box.
  const logoUrl = pageContent?.logo
    ? urlFor(pageContent.logo)?.width(1200).url()
    : null;

  return (
    <main className="min-h-screen">
      {/* Hero Section — transparent header sits on top, so add extra top padding */}
      <section className="relative bg-[var(--color-navy)] pt-36 pb-2 md:pt-44 md:pb-2">
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
            <Link href="/about/partners" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Affiliated Partners
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">Ski Town</span>
          </div>

          {/* When a logo is uploaded, it becomes the visual heading and
              the h1 text is hidden from sighted users via sr-only — search
              engines and screen readers still see the heading text. */}
          {logoUrl ? (
            <h1 className="mb-6">
              <span className="block mx-auto max-w-[280px] sm:max-w-[360px] md:max-w-[440px]">
                <Image
                  src={logoUrl}
                  alt=""
                  width={1200}
                  height={240}
                  className="w-full h-auto"
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, 440px"
                />
              </span>
              <span className="sr-only">
                {pageContent?.heroTitle || 'Ski Town Partners'}
              </span>
            </h1>
          ) : (
            <h1 className="font-serif text-white mb-6">
              {pageContent?.heroTitle || 'Ski Town Partners'}
            </h1>
          )}
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
              <Link href="/about/partners" className="text-[var(--color-gold)] hover:underline">
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
