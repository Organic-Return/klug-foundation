import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from 'next/navigation';
import { withBrand } from '@/lib/settings';

const BUY_PAGE_QUERY = `*[_type == "buyPage"][0]{
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
  faqTitle,
  faqs[]{
    question,
    answer
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
  const data = await client.fetch<SanityDocument>(BUY_PAGE_QUERY, {}, options);

  if (!data) {
    return {
      title: 'Buy',
    };
  }

  const metaTitle = await withBrand(data.seo?.metaTitle || data.heroTitle || 'Buy');
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
      canonical: `${baseUrl}/buy`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/buy`,
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

export default async function BuyPage() {
  const data = await client.fetch<SanityDocument>(BUY_PAGE_QUERY, {}, options);

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
              alt={data.heroTitle || 'Buy'}
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

      {/* FAQ Section */}
      {data.faqs && data.faqs.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            {data.faqTitle && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
                {data.faqTitle}
              </h2>
            )}
            <div className="space-y-6">
              {data.faqs.map((faq: any, index: number) => (
                <details
                  key={index}
                  className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-6 md:p-8 text-lg font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide list-none">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-[var(--color-gold)] transition-transform duration-300 group-open:rotate-45 flex-shrink-0 ml-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </summary>
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <p className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
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
