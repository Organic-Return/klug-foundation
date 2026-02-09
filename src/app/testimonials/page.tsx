import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

const TESTIMONIALS_QUERY = `*[_type == "testimonialsPage"][0]{
  heroTitle,
  heroSubtitle,
  heroImage,
  introTitle,
  introContent,
  featuredTestimonial{
    quote,
    author,
    role,
    location,
    transactionType,
    image,
    propertyImage
  },
  testimonials[]{
    quote,
    author,
    role,
    location,
    transactionType,
    year,
    image,
    featured
  },
  videoTestimonialsTitle,
  videoTestimonials[]{
    title,
    description,
    videoUrl,
    thumbnail,
    clientName
  },
  statsTitle,
  statistics[]{
    value,
    label
  },
  ctaTitle,
  ctaSubtitle,
  ctaButtonText,
  ctaButtonLink,
  ctaImage,
  seo
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch<SanityDocument>(TESTIMONIALS_QUERY, {}, options);

  if (!data) {
    return {
      title: 'Client Testimonials',
    };
  }

  const metaTitle = data.seo?.metaTitle || data.heroTitle || 'Client Testimonials';
  const metaDescription = data.seo?.metaDescription || data.heroSubtitle || '';
  const ogImageUrl = data.seo?.ogImage
    ? urlFor(data.seo.ogImage)?.width(1200).height(630).url()
    : data.heroImage
    ? urlFor(data.heroImage)?.width(1200).height(630).url()
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `${baseUrl}/testimonials`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/testimonials`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-4 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-6 mb-3 tracking-wide">{children}</h3>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
  },
};

// Quote icon component
const QuoteIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
);

// Transaction type badge
const TransactionBadge = ({ type }: { type?: string }) => {
  if (!type) return null;

  const labels: Record<string, string> = {
    buyer: 'Buyer',
    seller: 'Seller',
    both: 'Buyer & Seller',
  };

  return (
    <span className="inline-block px-3 py-1 text-xs uppercase tracking-wider bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20">
      {labels[type] || type}
    </span>
  );
};

export default async function TestimonialsPage() {
  const data = await client.fetch<SanityDocument>(TESTIMONIALS_QUERY, {}, options);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  if (!data) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-serif text-[#1a1a1a] dark:text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            Please add content in Sanity Studio under &quot;Testimonials Page&quot;.
          </p>
          <Link href="/" className="text-[var(--color-gold)] hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const heroImageUrl = data.heroImage
    ? urlFor(data.heroImage)?.width(1920).height(800).url()
    : null;

  const featuredTestimonials = data.testimonials?.filter((t: any) => t.featured) || [];
  const regularTestimonials = data.testimonials?.filter((t: any) => !t.featured) || [];
  const allTestimonials = [...(data.testimonials || [])];

  // Generate Review schema for each testimonial
  const reviewSchemas = allTestimonials.map((testimonial: any, index: number) => ({
    '@type': 'Review',
    '@id': `${baseUrl}/testimonials#review-${index}`,
    reviewBody: testimonial.quote,
    author: {
      '@type': 'Person',
      name: testimonial.author,
      ...(testimonial.role && { jobTitle: testimonial.role }),
    },
    ...(testimonial.year && { datePublished: `${testimonial.year}-01-01` }),
    reviewRating: {
      '@type': 'Rating',
      ratingValue: 5,
      bestRating: 5,
      worstRating: 1,
    },
  }));

  // AggregateRating schema
  const aggregateRatingSchema = allTestimonials.length > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: 5,
    bestRating: 5,
    worstRating: 1,
    ratingCount: allTestimonials.length,
    reviewCount: allTestimonials.length,
  } : undefined;

  // Main LocalBusiness/RealEstateAgent schema with reviews
  const businessWithReviewsSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}#organization`,
    name: 'Real Estate Agency',
    url: baseUrl,
    ...(aggregateRatingSchema && { aggregateRating: aggregateRatingSchema }),
    review: reviewSchemas,
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Testimonials',
        item: `${baseUrl}/testimonials`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={businessWithReviewsSchema} />
      <StructuredData data={breadcrumbSchema} />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] min-h-[400px] flex items-end">
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={data.heroTitle || 'Testimonials'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-navy)]" />
        )}

        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-20">
          <h1 className="font-serif text-white mb-4 max-w-4xl">
            {data.heroTitle}
          </h1>
          {data.heroSubtitle && (
            <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl leading-relaxed">
              {data.heroSubtitle}
            </p>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      {data.statistics && data.statistics.length > 0 && (
        <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414] border-b border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {data.statistics.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[var(--color-gold)] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[#6a6a6a] dark:text-gray-400 text-sm uppercase tracking-wider font-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Introduction Section */}
      {(data.introTitle || data.introContent) && (
        <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
            {data.introTitle && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                {data.introTitle}
              </h2>
            )}
            {data.introContent && (
              <div className="prose prose-lg max-w-none">
                <PortableText value={data.introContent} components={portableTextComponents} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Testimonial */}
      {data.featuredTestimonial && (
        <section className="py-16 md:py-24 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <QuoteIcon className="w-12 h-12 text-[var(--color-gold)]/30 mb-6" />
                <blockquote className="text-xl md:text-2xl lg:text-3xl font-serif font-light text-white leading-relaxed mb-8">
                  &ldquo;{data.featuredTestimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  {data.featuredTestimonial.image && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--color-gold)]/30">
                      <Image
                        src={urlFor(data.featuredTestimonial.image)?.width(128).height(128).url() || ''}
                        alt={data.featuredTestimonial.author || 'Client'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white text-lg">
                      {data.featuredTestimonial.author}
                    </div>
                    {data.featuredTestimonial.role && (
                      <div className="text-white/60 text-sm">
                        {data.featuredTestimonial.role}
                      </div>
                    )}
                    {data.featuredTestimonial.location && (
                      <div className="text-white/40 text-sm">
                        {data.featuredTestimonial.location}
                      </div>
                    )}
                  </div>
                </div>
                {data.featuredTestimonial.transactionType && (
                  <div className="mt-6">
                    <TransactionBadge type={data.featuredTestimonial.transactionType} />
                  </div>
                )}
              </div>
              {data.featuredTestimonial.propertyImage && (
                <div className="relative aspect-[4/3] lg:aspect-square">
                  <Image
                    src={urlFor(data.featuredTestimonial.propertyImage)?.width(800).height(800).url() || ''}
                    alt="Property"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Testimonials Grid */}
      {featuredTestimonials.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              Featured Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredTestimonials.map((testimonial: any, index: number) => (
                <div
                  key={index}
                  className="bg-[#f8f7f5] dark:bg-[#141414] p-8 md:p-10 relative"
                >
                  <QuoteIcon className="w-10 h-10 text-[var(--color-gold)]/20 absolute top-8 right-8" />
                  <blockquote className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed mb-8 text-lg">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {testimonial.image && (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={urlFor(testimonial.image)?.width(96).height(96).url() || ''}
                            alt={testimonial.author || 'Client'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[#1a1a1a] dark:text-white">
                          {testimonial.author}
                        </div>
                        {testimonial.role && (
                          <div className="text-sm text-[#6a6a6a] dark:text-gray-400">
                            {testimonial.role}
                          </div>
                        )}
                      </div>
                    </div>
                    {testimonial.transactionType && (
                      <TransactionBadge type={testimonial.transactionType} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Testimonials */}
      {regularTestimonials.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularTestimonials.map((testimonial: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[#1a1a1a] p-6 md:p-8 border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)]/30 transition-colors duration-300"
                >
                  <QuoteIcon className="w-6 h-6 text-[var(--color-gold)]/30 mb-4" />
                  <blockquote className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    {testimonial.image && (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={urlFor(testimonial.image)?.width(80).height(80).url() || ''}
                          alt={testimonial.author || 'Client'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-[#1a1a1a] dark:text-white text-sm">
                        {testimonial.author}
                      </div>
                      <div className="text-xs text-[#6a6a6a] dark:text-gray-400">
                        {[testimonial.role, testimonial.location, testimonial.year].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Testimonials */}
      {data.videoTestimonials && data.videoTestimonials.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.videoTestimonialsTitle && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
                {data.videoTestimonialsTitle}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.videoTestimonials.map((video: any, index: number) => (
                <div key={index} className="group">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-video mb-4 overflow-hidden"
                  >
                    {video.thumbnail ? (
                      <Image
                        src={urlFor(video.thumbnail)?.width(640).height(360).url() || ''}
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#1a1a1a]" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-[var(--color-navy)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </a>
                  <h3 className="font-serif font-light text-lg text-[#1a1a1a] dark:text-white mb-1">
                    {video.title}
                  </h3>
                  {video.clientName && (
                    <p className="text-sm text-[#6a6a6a] dark:text-gray-400">
                      {video.clientName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {data.ctaTitle && (
        <section className="relative py-20 md:py-28">
          {data.ctaImage ? (
            <>
              <Image
                src={urlFor(data.ctaImage)?.width(1920).height(600).url() || ''}
                alt="Contact Us"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[var(--color-navy)]/80" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[var(--color-navy)]" />
          )}

          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
              {data.ctaTitle}
            </h2>
            {data.ctaSubtitle && (
              <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                {data.ctaSubtitle}
              </p>
            )}
            {data.ctaButtonText && (
              <Link
                href={data.ctaButtonLink || '/contact-us'}
                className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
              >
                {data.ctaButtonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
    </>
  );
}
