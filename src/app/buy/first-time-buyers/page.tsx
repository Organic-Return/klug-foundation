import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import AgentContactForm from "@/components/AgentContactForm";

const PAGE_QUERY = `*[_type == "firstTimeBuyersPage"][0]{
  heroTitle,
  heroSubtitle,
  heroImage,
  sections[]{
    title,
    content,
    image,
    imagePosition,
    ctaText,
    ctaLink
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
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch<SanityDocument>(PAGE_QUERY, {}, options);

  if (!data) {
    return { title: 'First Time Buyers' };
  }

  const metaTitle = data.seo?.metaTitle || data.heroTitle || 'First Time Buyers';
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
      canonical: `${baseUrl}/buy/first-time-buyers`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/buy/first-time-buyers`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function FirstTimeBuyersPage() {
  const [data, template] = await Promise.all([
    client.fetch<SanityDocument>(PAGE_QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  const rcPortableTextComponents: PortableTextComponents = {
    block: {
      normal: ({ children }: { children?: ReactNode }) => (
        <p className="mb-6 text-white/80 leading-[1.8] font-light text-[17px]">{children}</p>
      ),
      h2: ({ children }: { children?: ReactNode }) => (
        <h2
          className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-white mt-8 mb-4"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }: { children?: ReactNode }) => (
        <h3
          className="text-xl md:text-2xl font-light uppercase tracking-[0.06em] text-white mt-6 mb-3"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          {children}
        </h3>
      ),
      blockquote: ({ children }: { children?: ReactNode }) => (
        <blockquote className="border-l-2 border-[var(--rc-gold)] pl-6 my-8 italic text-white/70 text-lg">{children}</blockquote>
      ),
    },
    marks: {
      strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-white">{children}</strong>,
      em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    },
    list: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <ul className="space-y-2 mb-6 ml-4">{children}</ul>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <ol className="space-y-2 mb-6 ml-4 list-decimal">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <li className="text-white/80 font-light text-[17px] leading-relaxed flex items-start gap-3">
          <span className="text-[var(--rc-gold)] mt-1.5 flex-shrink-0">&#8226;</span>
          <span>{children}</span>
        </li>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <li className="text-white/80 font-light text-[17px] leading-relaxed">{children}</li>
      ),
    },
  };

  const rcCreamPortableTextComponents: PortableTextComponents = {
    block: {
      normal: ({ children }: { children?: ReactNode }) => (
        <p className="mb-6 text-[var(--rc-brown)] leading-[1.8] font-light text-[17px]">{children}</p>
      ),
      h2: ({ children }: { children?: ReactNode }) => (
        <h2
          className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mt-8 mb-4"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }: { children?: ReactNode }) => (
        <h3
          className="text-xl md:text-2xl font-light uppercase tracking-[0.06em] text-[var(--rc-navy)] mt-6 mb-3"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          {children}
        </h3>
      ),
      blockquote: ({ children }: { children?: ReactNode }) => (
        <blockquote className="border-l-2 border-[var(--rc-gold)] pl-6 my-8 italic text-[var(--rc-brown)]/70 text-lg">{children}</blockquote>
      ),
    },
    marks: {
      strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[var(--rc-navy)]">{children}</strong>,
      em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    },
    list: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <ul className="space-y-2 mb-6 ml-4">{children}</ul>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <ol className="space-y-2 mb-6 ml-4 list-decimal">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <li className="text-[var(--rc-brown)] font-light text-[17px] leading-relaxed flex items-start gap-3">
          <span className="text-[var(--rc-gold)] mt-1.5 flex-shrink-0">&#8226;</span>
          <span>{children}</span>
        </li>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <li className="text-[var(--rc-brown)] font-light text-[17px] leading-relaxed">{children}</li>
      ),
    },
  };

  const defaultPortableTextComponents: PortableTextComponents = {
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
    list: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <ul className="space-y-2 mb-6 ml-6 list-disc">{children}</ul>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <ol className="space-y-2 mb-6 ml-6 list-decimal">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }: { children?: ReactNode }) => (
        <li className="text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-relaxed">{children}</li>
      ),
      number: ({ children }: { children?: ReactNode }) => (
        <li className="text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-relaxed">{children}</li>
      ),
    },
  };

  if (!data) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className={isRC ? 'text-white mb-4' : 'font-serif text-[#1a1a1a] dark:text-white mb-4'}>
            Page Not Found
          </h1>
          <p className={isRC ? 'text-white/60 font-light mb-8' : 'text-[#6a6a6a] dark:text-gray-400 font-light mb-8'}>
            Please add content in Sanity Studio under &quot;First Time Buyers Page&quot;.
          </p>
          <Link href="/" className={isRC ? 'text-[var(--rc-gold)] hover:underline' : 'text-[var(--color-gold)] hover:underline'}>
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
      {isRC ? (
        <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] flex items-end">
          {heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt={data.heroTitle || 'First Time Buyers'}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--rc-navy)]/90 via-[var(--rc-navy)]/40 to-[var(--rc-navy)]/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[var(--rc-navy)]" />
          )}

          <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4 max-w-4xl"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
            >
              {data.heroTitle}
            </h1>
            {data.heroSubtitle && (
              <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
                {data.heroSubtitle}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] flex items-end">
          {heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt={data.heroTitle || 'First Time Buyers'}
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
      )}

      {/* Content Sections */}
      {data.sections && data.sections.length > 0 && (
        <div>
          {data.sections.map((section: any, index: number) => {
            const sectionImageUrl = section.image
              ? urlFor(section.image)?.width(800).height(600).url()
              : null;
            const imageOnLeft = section.imagePosition === 'left';

            const bgClass = isRC
              ? index % 2 === 0
                ? 'rc-inverted bg-[var(--rc-navy)]'
                : 'bg-[var(--rc-cream)]'
              : index % 2 === 0
                ? 'bg-white dark:bg-[#1a1a1a]'
                : 'bg-[#f8f7f5] dark:bg-[#141414]';

            const titleClass = isRC
              ? index % 2 === 0
                ? 'text-white'
                : 'text-[var(--rc-navy)]'
              : 'text-[#1a1a1a] dark:text-white';

            const portableTextComponents = isRC
              ? index % 2 === 0
                ? rcPortableTextComponents
                : rcCreamPortableTextComponents
              : defaultPortableTextComponents;

            return (
              <section key={index} className={`py-16 md:py-24 ${bgClass}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
                  <div className={`grid grid-cols-1 ${sectionImageUrl ? 'lg:grid-cols-2' : ''} gap-12 lg:gap-20 items-center`}>
                    <div className={imageOnLeft && sectionImageUrl ? 'lg:order-2' : ''}>
                      <h2
                        className={`text-3xl md:text-4xl font-light mb-8 tracking-wide ${
                          isRC ? `uppercase tracking-[0.08em] ${titleClass}` : `font-serif ${titleClass}`
                        }`}
                        style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
                      >
                        {section.title}
                      </h2>
                      {section.content && (
                        <div className="prose prose-lg max-w-none">
                          <PortableText value={section.content} components={portableTextComponents} />
                        </div>
                      )}
                      {section.ctaText && (
                        <Link
                          href={section.ctaLink || '#'}
                          className={`inline-flex items-center gap-3 mt-8 px-8 py-3 bg-transparent border transition-all duration-300 text-sm uppercase tracking-[0.15em] font-light ${
                            isRC
                              ? 'border-[var(--rc-gold)] text-white hover:bg-[var(--rc-gold)] hover:text-[var(--rc-navy)]'
                              : 'border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-white'
                          }`}
                        >
                          {section.ctaText}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      )}
                    </div>
                    {sectionImageUrl && (
                      <div className={`relative aspect-[4/3] ${imageOnLeft ? 'lg:order-1' : ''}`}>
                        <Image
                          src={sectionImageUrl}
                          alt={section.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* CTA / Contact Section */}
      {isRC ? (
        <section className="rc-inverted py-20 md:py-28 bg-[var(--rc-navy)]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              {/* Left — Info */}
              <div>
                <h2
                  className="text-3xl md:text-4xl font-light uppercase tracking-[0.08em] text-white mb-4"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  {data.ctaTitle || 'Learn More About First Time Home Buying'}
                </h2>
                {data.ctaSubtitle && (
                  <p className="text-white/70 font-light mb-8 leading-relaxed">
                    {data.ctaSubtitle}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-white/80 text-sm font-light">329 N. Kellogg Street, Kennewick, WA 99336</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <a href="tel:509.783.8811" className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                      509.783.8811
                    </a>
                  </div>
                </div>
              </div>

              {/* Right — Contact form */}
              <div>
                <AgentContactForm
                  agentName="Retter & Company Sotheby's International Realty"
                  agentEmail="info@rcsothebysrealty.com"
                  inverted
                />
              </div>
            </div>
          </div>
        </section>
      ) : data.ctaTitle ? (
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
      ) : null}
    </main>
  );
}
