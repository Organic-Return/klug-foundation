import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import type { SanityDocument } from "next-sanity";

const BUILDERS_PAGE_QUERY = `*[_type == "buildersPage"][0]{
  heroTitle,
  heroSubtitle,
  heroImage,
  ctaTitle,
  ctaSubtitle,
  seo
}`;

const ALL_BUILDERS_QUERY = `*[_type == "builder"] | order(order asc, name asc) {
  _id,
  name,
  slug,
  logo,
  description,
  descriptionHtml
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch<SanityDocument>(BUILDERS_PAGE_QUERY, {}, options);

  const metaTitle = data?.seo?.metaTitle || data?.heroTitle || 'Our Builders';
  const metaDescription = data?.seo?.metaDescription || data?.heroSubtitle || '';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: `${baseUrl}/builders` },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/builders`,
    },
  };
}

interface Builder {
  _id: string;
  name: string;
  slug: { current: string };
  logo?: any;
  description?: string;
  descriptionHtml?: string;
}

export default async function BuildersPage() {
  const [pageData, builders, template] = await Promise.all([
    client.fetch<SanityDocument>(BUILDERS_PAGE_QUERY, {}, options),
    client.fetch<Builder[]>(ALL_BUILDERS_QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  const heroTitle = pageData?.heroTitle || 'Our Builders';
  const heroSubtitle = pageData?.heroSubtitle || 'Our Realtors are proud to be connected with some of the finest builders in the Tri-Cities.';
  const heroImageUrl = pageData?.heroImage
    ? urlFor(pageData.heroImage)?.width(1920).height(800).url()
    : null;

  // Strip HTML tags for preview text
  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      {isRC ? (
        <section className="relative h-[50vh] md:h-[60vh] min-h-[400px] flex items-end">
          {heroImageUrl ? (
            <>
              <Image src={heroImageUrl} alt={heroTitle} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--rc-navy)]/90 via-[var(--rc-navy)]/40 to-[var(--rc-navy)]/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[var(--rc-navy)]" />
          )}
          <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
            >
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </section>
      ) : (
        <section className="relative h-[50vh] md:h-[60vh] min-h-[400px] flex items-end">
          {heroImageUrl ? (
            <>
              <Image src={heroImageUrl} alt={heroTitle} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[var(--color-navy)]" />
          )}
          <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
            <h1 className="font-serif text-white mb-4">{heroTitle}</h1>
            <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </section>
      )}

      {/* Builders Grid */}
      <section className={`py-16 md:py-24 ${isRC ? 'bg-[var(--rc-cream)]' : 'bg-white dark:bg-[#1a1a1a]'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {builders.length === 0 ? (
            <p className={`text-center font-light ${isRC ? 'text-[var(--rc-brown)]' : 'text-[#6a6a6a]'}`}>
              No builders listed yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {builders.map((builder) => {
                const logoUrl = builder.logo ? urlFor(builder.logo)?.width(640).height(360).url() : null;
                const previewText = builder.descriptionHtml
                  ? stripHtml(builder.descriptionHtml).slice(0, 160) + '...'
                  : builder.description
                  ? builder.description.slice(0, 160) + '...'
                  : '';

                return (
                  <Link
                    key={builder._id}
                    href={`/builders/${builder.slug.current}`}
                    className={`group block overflow-hidden transition-shadow duration-300 hover:shadow-lg ${
                      isRC ? 'bg-white' : 'bg-white dark:bg-[#222] border border-[#e8e6e3] dark:border-gray-800'
                    }`}
                  >
                    {/* Logo / Header */}
                    <div className={`h-48 flex items-center justify-center p-6 ${
                      isRC ? 'bg-gray-100' : 'bg-[var(--color-navy)]'
                    }`}>
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={builder.name}
                          width={320}
                          height={180}
                          className="object-contain max-h-36"
                        />
                      ) : (
                        <h3
                          className={`text-xl md:text-2xl font-light text-center ${
                            isRC ? 'text-[var(--rc-navy)] uppercase tracking-[0.08em]' : 'text-white font-serif tracking-wide'
                          }`}
                          style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
                        >
                          {builder.name}
                        </h3>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {logoUrl && (
                        <h3 className={`text-lg font-light mb-3 ${
                          isRC
                            ? 'text-[var(--rc-navy)] uppercase tracking-[0.06em]'
                            : 'text-[#1a1a1a] dark:text-white font-serif tracking-wide'
                        }`}
                          style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
                        >
                          {builder.name}
                        </h3>
                      )}
                      {previewText && (
                        <p className={`text-sm font-light leading-relaxed line-clamp-3 ${
                          isRC ? 'text-[var(--rc-brown)]' : 'text-[#4a4a4a] dark:text-gray-300'
                        }`}>
                          {previewText}
                        </p>
                      )}
                      <span className={`inline-flex items-center gap-2 mt-4 text-xs uppercase tracking-[0.15em] font-light transition-colors ${
                        isRC
                          ? 'text-[var(--rc-gold)] group-hover:text-[var(--rc-navy)]'
                          : 'text-[var(--color-gold)] group-hover:text-[#1a1a1a] dark:group-hover:text-white'
                      }`}>
                        Learn More
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
