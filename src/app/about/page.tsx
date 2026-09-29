import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from 'next/navigation';

const ABOUT_PAGE_QUERY = `*[_type == "aboutPage"][0]{
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
  const data = await client.fetch<SanityDocument>(ABOUT_PAGE_QUERY, {}, options);

  if (!data) {
    return {
      title: 'About',
    };
  }

  const metaTitle = data.seo?.metaTitle || data.heroTitle || 'About';
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
      canonical: `${baseUrl}/about`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/about`,
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

export default async function AboutPage() {
  const data = await client.fetch<SanityDocument>(ABOUT_PAGE_QUERY, {}, options);

  // No document in Sanity means no page: a 404, not a 200 "Page Not Found"
  // body that search engines index as a soft 404.
  if (!data) notFound();

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
              alt={data.heroTitle || 'About'}
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

      {/* Content Sections */}
      {data.sections && data.sections.length > 0 && (
        <div>
          {data.sections.map((section: any, index: number) => {
            const sectionImageUrl = section.image
              ? urlFor(section.image)?.width(800).height(600).url()
              : null;
            const imageOnLeft = section.imagePosition === 'left';
            const bgClass = index % 2 === 0
              ? 'bg-white dark:bg-[#1a1a1a]'
              : 'bg-[#f8f7f5] dark:bg-[#141414]';

            return (
              <section key={index} className={`py-16 md:py-24 ${bgClass}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
                  <div className={`grid grid-cols-1 ${sectionImageUrl ? 'lg:grid-cols-2' : ''} gap-12 lg:gap-20 items-center`}>
                    <div className={imageOnLeft && sectionImageUrl ? 'lg:order-2' : ''}>
                      <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
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
                          className="inline-flex items-center gap-3 mt-8 px-8 py-3 bg-transparent border border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-white transition-all duration-300 text-sm uppercase tracking-[0.15em] font-light"
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
