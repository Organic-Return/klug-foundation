import { type SanityDocument } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getDefaultHeroImageUrl } from "@/lib/settings";

const MAGAZINES_QUERY = `*[_type == "publication" && publicationType == "magazine"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  headerImage,
  excerpt,
  publishedAt,
  featured
}`;

interface PageDoc {
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: { asset?: { _id?: string; url?: string } };
  latestEyebrow?: string;
  pastIssuesTitle?: string;
  emptyTitle?: string;
  emptyText?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: { url?: string } };
  };
}

const PAGE_QUERY = `*[_type == "livingAspenPage" && _id == "livingAspenPage"][0]{
  heroTitle,
  heroDescription,
  heroImage { asset->{ _id, url } },
  latestEyebrow,
  pastIssuesTitle,
  emptyTitle,
  emptyText,
  ctaTitle,
  ctaDescription,
  ctaButtonLabel,
  ctaButtonHref,
  seo {
    metaTitle,
    metaDescription,
    ogImage { asset->{ url } }
  }
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

async function getPageData(): Promise<PageDoc | null> {
  return client.fetch<PageDoc | null>(PAGE_QUERY, {}, options);
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const page = await getPageData();
  const heroTitle = page?.heroTitle || 'Living Aspen';
  const title = page?.seo?.metaTitle || `${heroTitle} | Luxury Lifestyle Magazine`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || 'Discover the Aspen lifestyle through our curated magazine featuring local culture, design, real estate, and more.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/living-aspen`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/living-aspen`,
    },
  };
}

export default async function LivingAspenPage() {
  const [magazines, page, defaultHeroUrl] = await Promise.all([
    client.fetch<SanityDocument[]>(MAGAZINES_QUERY, {}, options),
    getPageData(),
    getDefaultHeroImageUrl(),
  ]);

  const featuredMagazine = magazines.find((m) => m.featured);
  const regularMagazines = magazines.filter((m) => !m.featured || m._id !== featuredMagazine?._id);

  const heroTitle = page?.heroTitle || 'Living Aspen';
  const heroDescription = page?.heroDescription
    || 'Discover the essence of Aspen living through our curated magazine. Local culture, design inspiration, and the stories that define mountain luxury.';
  const latestEyebrow = page?.latestEyebrow || 'Latest Issue';
  const pastIssuesTitle = page?.pastIssuesTitle || 'Past Issues';
  const emptyTitle = page?.emptyTitle || 'Coming Soon';
  const emptyText = page?.emptyText || 'Our first issue of Living Aspen is in the works. Stay tuned.';
  const ctaTitle = page?.ctaTitle || 'Stay Connected';
  const ctaDescription = page?.ctaDescription
    || 'Subscribe to receive the latest issue of Living Aspen and exclusive insights into the Aspen lifestyle.';
  const ctaButtonLabel = page?.ctaButtonLabel || 'Subscribe';
  const ctaButtonHref = page?.ctaButtonHref || '/contact-us';

  const heroImageRaw: string | null = page?.heroImage?.asset?.url || defaultHeroUrl;

  return (
    <main className="min-h-screen">
      {/* Hero Section — transparent header sits on top, so add extra top padding */}
      <section
        className={`relative pt-36 pb-20 md:pt-44 md:pb-28 ${heroImageRaw ? '' : 'bg-[var(--color-navy)]'}`}
      >
        {heroImageRaw && (
          <>
            <Image
              src={heroImageRaw}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-[var(--color-navy)]/65"
              aria-hidden="true"
            />
          </>
        )}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Featured Magazine */}
      {featuredMagazine && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-8">
              <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                {latestEyebrow}
              </span>
            </div>
            <Link
              href={`/living-aspen/${featuredMagazine.slug?.current}`}
              className="group block"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  {featuredMagazine.headerImage && (
                    <Image
                      src={urlFor(featuredMagazine.headerImage)?.width(800).height(1067).url() || ''}
                      alt={featuredMagazine.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {featuredMagazine.title}
                  </h2>
                  {featuredMagazine.excerpt && (
                    <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-lg leading-relaxed mb-6">
                      {featuredMagazine.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                      {new Date(featuredMagazine.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <div className="mt-8">
                    <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase group-hover:gap-4 transition-all duration-300">
                      Read Issue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Divider */}
      {featuredMagazine && regularMagazines.length > 0 && (
        <div className="w-full flex justify-center py-4 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
        </div>
      )}

      {/* All Magazines Grid */}
      {regularMagazines.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
                {pastIssuesTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularMagazines.map((magazine) => (
                <Link
                  key={magazine._id}
                  href={`/living-aspen/${magazine.slug?.current}`}
                  className="group"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden mb-4">
                    {magazine.headerImage && (
                      <Image
                        src={urlFor(magazine.headerImage)?.width(500).height(667).url() || ''}
                        alt={magazine.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content */}
                  <div>
                    <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light tracking-wider uppercase">
                      {new Date(magazine.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                    <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mt-2 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                      {magazine.title}
                    </h3>
                    {magazine.excerpt && (
                      <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-sm leading-relaxed mt-2 line-clamp-2">
                        {magazine.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {magazines.length === 0 && (
        <section className="py-24 md:py-32 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              {emptyTitle}
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
              {emptyText}
            </p>
          </div>
        </section>
      )}

      {/* Subscribe CTA */}
      <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            {ctaTitle}
          </h2>
          <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            {ctaDescription}
          </p>

          <Link
            href={ctaButtonHref}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            {ctaButtonLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
