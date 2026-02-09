import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const WHY_KLUG_QUERY = `*[_type == "whyKlugProperties"][0]{
  heroTitle,
  heroSubtitle,
  heroImage,
  introTitle,
  introContent,
  introImage,
  servicesTitle,
  servicesSubtitle,
  services[]{
    title,
    description,
    icon,
    image
  },
  marketingTitle,
  marketingSubtitle,
  marketingFeatures[]{
    title,
    description,
    image
  },
  marketingImage,
  statsTitle,
  statistics[]{
    value,
    label,
    description
  },
  processTitle,
  processSubtitle,
  processSteps[]{
    stepNumber,
    title,
    description
  },
  testimonialsTitle,
  testimonials[]{
    quote,
    author,
    role,
    image
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
  const data = await client.fetch<SanityDocument>(WHY_KLUG_QUERY, {}, options);

  if (!data) {
    return {
      title: 'Why Klug Properties',
    };
  }

  const metaTitle = data.seo?.metaTitle || data.heroTitle || 'Why Klug Properties';
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
      canonical: `${baseUrl}/why-klug-properties`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/why-klug-properties`,
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
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
  },
};

// Icon mapping for services
const ServiceIcon = ({ icon }: { icon?: string }) => {
  const iconMap: Record<string, ReactNode> = {
    home: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    chart: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    camera: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    globe: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    handshake: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    star: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  };

  return iconMap[icon || 'star'] || iconMap.star;
};

export default async function WhyKlugPropertiesPage() {
  const data = await client.fetch<SanityDocument>(WHY_KLUG_QUERY, {}, options);

  if (!data) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-serif text-[#1a1a1a] dark:text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            Please add content in Sanity Studio under &quot;Why Klug Properties&quot;.
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

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] flex items-end">
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={data.heroTitle || 'Why Klug Properties'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-navy)]" />
        )}

        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
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

      {/* Introduction Section */}
      {(data.introTitle || data.introContent) && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
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
              {data.introImage && (
                <div className="relative aspect-[4/3] lg:aspect-square">
                  <Image
                    src={urlFor(data.introImage)?.width(800).height(800).url() || ''}
                    alt={data.introTitle || 'About Us'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services / Differentiators Section */}
      {data.services && data.services.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.servicesTitle && (
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  {data.servicesTitle}
                </h2>
                {data.servicesSubtitle && (
                  <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto">
                    {data.servicesSubtitle}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.services.map((service: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[#1a1a1a] p-8 border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-all duration-300"
                >
                  <div className="text-[var(--color-gold)] mb-6">
                    <ServiceIcon icon={service.icon} />
                  </div>
                  <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide">
                    {service.title}
                  </h3>
                  {service.description && (
                    <p className="text-[#6a6a6a] dark:text-gray-400 font-light leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Statistics Section */}
      {data.statistics && data.statistics.length > 0 && (
        <section className="py-16 md:py-24 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.statsTitle && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-white text-center mb-12 md:mb-16 tracking-wide">
                {data.statsTitle}
              </h2>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {data.statistics.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-[var(--color-gold)] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/80 text-sm uppercase tracking-wider font-light">
                    {stat.label}
                  </div>
                  {stat.description && (
                    <p className="text-white/60 text-sm mt-2 font-light">
                      {stat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Marketing Features Section */}
      {data.marketingFeatures && data.marketingFeatures.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.marketingTitle && (
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  {data.marketingTitle}
                </h2>
                {data.marketingSubtitle && (
                  <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto">
                    {data.marketingSubtitle}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-16 md:space-y-24">
              {data.marketingFeatures.map((feature: any, index: number) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <h3 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="text-[#6a6a6a] dark:text-gray-400 font-light leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                  </div>
                  {feature.image && (
                    <div className={`relative aspect-[16/10] ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <Image
                        src={urlFor(feature.image)?.width(800).height(500).url() || ''}
                        alt={feature.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      {data.processSteps && data.processSteps.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.processTitle && (
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
                  {data.processTitle}
                </h2>
                {data.processSubtitle && (
                  <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto">
                    {data.processSubtitle}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {data.processSteps.map((step: any, index: number) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-serif font-light text-[var(--color-gold)]/20 mb-4">
                    {step.stepNumber || String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mb-3 tracking-wide">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-[#6a6a6a] dark:text-gray-400 font-light leading-relaxed text-sm">
                      {step.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {data.testimonials && data.testimonials.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {data.testimonialsTitle && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
                {data.testimonialsTitle}
              </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.testimonials.map((testimonial: any, index: number) => (
                <div
                  key={index}
                  className="bg-[#f8f7f5] dark:bg-[#141414] p-8"
                >
                  <blockquote className="text-[#4a4a4a] dark:text-gray-300 font-light italic leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
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
                      {testimonial.author && (
                        <div className="font-medium text-[#1a1a1a] dark:text-white">
                          {testimonial.author}
                        </div>
                      )}
                      {testimonial.role && (
                        <div className="text-sm text-[#6a6a6a] dark:text-gray-400">
                          {testimonial.role}
                        </div>
                      )}
                    </div>
                  </div>
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
  );
}
