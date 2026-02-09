import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const MARKET_REPORT_QUERY = `*[_type == "publication" && publicationType == "market-report" && slug.current == $slug][0]{
  ...,
  pdfFile {
    asset-> {
      url
    }
  },
  content[]{
    ...,
    _type == "image" => {
      ...,
      asset->
    }
  }
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await client.fetch<SanityDocument>(MARKET_REPORT_QUERY, { slug }, options);

  if (!report) {
    return {
      title: 'Report Not Found',
    };
  }

  const seoImageUrl = report.seo?.ogImage
    ? urlFor(report.seo.ogImage)?.width(1200).height(630).url()
    : report.headerImage
    ? urlFor(report.headerImage)?.width(1200).height(630).url()
    : null;

  const metaTitle = report.seo?.metaTitle || report.title;
  const metaDescription = report.seo?.metaDescription || report.excerpt || report.title;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const canonicalUrl = `${baseUrl}/market-reports/${slug}`;

  const robotsConfig = report.seo?.noIndex
    ? { index: false, follow: false }
    : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: report.seo?.keywords?.join(', '),
    robots: robotsConfig,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      publishedTime: report.publishedAt,
      url: canonicalUrl,
      images: seoImageUrl
        ? [{ url: seoImageUrl, width: 1200, height: 630, alt: metaTitle }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: seoImageUrl ? [seoImageUrl] : [],
    },
  };
}

// PortableText components with elegant styling
const components: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="font-serif text-[#1a1a1a] dark:text-white mt-12 mb-6">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-5 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-4 tracking-wide">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-lg md:text-xl font-serif font-light text-[#1a1a1a] dark:text-white mt-6 mb-3 tracking-wide">{children}</h4>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
    code: ({ children }: { children?: ReactNode }) => <code className="bg-[#f5f5f5] dark:bg-gray-800 px-2 py-1 text-sm font-mono">{children}</code>,
    underline: ({ children }: { children?: ReactNode }) => <span className="underline underline-offset-4">{children}</span>,
    'strike-through': ({ children }: { children?: ReactNode }) => <span className="line-through">{children}</span>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string; blank?: boolean } }) => {
      const href = value?.href || '';
      return (
        <a
          href={href}
          className="text-[var(--color-navy)] dark:text-[var(--color-gold)] border-b border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors duration-300"
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="ml-6 mb-6 space-y-2">{children}</ul>,
    number: ({ children }: { children?: ReactNode }) => <ol className="ml-6 mb-6 space-y-2 list-decimal">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="text-[#4a4a4a] dark:text-gray-300 leading-relaxed font-light pl-2 relative before:content-[''] before:absolute before:left-[-1rem] before:top-[0.6rem] before:w-1.5 before:h-1.5 before:bg-[var(--color-gold)] before:rounded-full">{children}</li>
    ),
    number: ({ children }: { children?: ReactNode }) => (
      <li className="text-[#4a4a4a] dark:text-gray-300 leading-relaxed font-light pl-2">{children}</li>
    ),
  },
  types: {
    image: ({ value }: { value: { asset: any; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value.asset)?.width(1200).url();
      return (
        <figure className="my-12">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={value.alt || ''}
              className="w-full h-auto"
            />
          )}
          {value.caption && (
            <figcaption className="text-sm text-[#6a6a6a] dark:text-gray-400 mt-4 font-light italic tracking-wide">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export default async function MarketReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = await client.fetch<SanityDocument>(MARKET_REPORT_QUERY, { slug }, options);

  if (!report) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Link href="/market-reports" className="inline-flex items-center gap-2 text-[var(--color-gold)] hover:gap-4 transition-all duration-300 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Reports
          </Link>
          <h1 className="font-serif text-[#1a1a1a] dark:text-white mb-4">Report Not Found</h1>
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light">The market report you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </main>
    );
  }

  const heroImageUrl = report.headerImage
    ? urlFor(report.headerImage)?.width(1920).height(800).url()
    : null;

  const pdfUrl = report.pdfFile?.asset?.url;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const reportUrl = `${baseUrl}/market-reports/${slug}`;

  // Article/Report schema with enhanced details
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    '@id': reportUrl,
    headline: report.title,
    name: report.title,
    description: report.excerpt || report.title,
    url: reportUrl,
    image: heroImageUrl || undefined,
    datePublished: report.publishedAt,
    dateModified: report._updatedAt || report.publishedAt,
    author: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'Real Estate',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'Real Estate',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': reportUrl,
    },
    ...(pdfUrl && {
      associatedMedia: {
        '@type': 'MediaObject',
        contentUrl: pdfUrl,
        encodingFormat: 'application/pdf',
      },
    }),
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
        name: 'Market Reports',
        item: `${baseUrl}/market-reports`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: report.title,
        item: reportUrl,
      },
    ],
  };

  // WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${reportUrl}#webpage`,
    url: reportUrl,
    name: report.title,
    description: report.excerpt || report.title,
    isPartOf: {
      '@id': `${baseUrl}#website`,
    },
    primaryImageOfPage: heroImageUrl ? {
      '@type': 'ImageObject',
      url: heroImageUrl,
    } : undefined,
    datePublished: report.publishedAt,
    dateModified: report._updatedAt || report.publishedAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] min-h-[500px]">
          {heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt={report.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[var(--color-sothebys-blue)]" />
          )}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-20">
              {/* Back Link */}
              <Link
                href="/market-reports"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300 mb-8"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                All Market Reports
              </Link>

              {/* Title */}
              <h1 className="font-serif text-white mb-6 max-w-4xl">
                {report.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-white/70">
                <span className="text-sm font-light">
                  Published {new Date(report.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase hover:gap-3 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            {/* Excerpt/Introduction */}
            {report.excerpt && (
              <div className="mb-12 pb-12 border-b border-[#e8e6e3] dark:border-gray-800">
                <p className="text-xl md:text-2xl text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed font-serif italic">
                  {report.excerpt}
                </p>
              </div>
            )}

            {/* Main Content */}
            {Array.isArray(report.content) && report.content.length > 0 && (
              <div className="prose prose-lg max-w-none">
                <PortableText value={report.content} components={components} />
              </div>
            )}

            {/* Download CTA */}
            {pdfUrl && (
              <div className="mt-16 pt-12 border-t border-[#e8e6e3] dark:border-gray-800">
                <div className="bg-[#f8f7f5] dark:bg-[#141414] p-8 md:p-12 text-center">
                  <h3 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4">
                    Download Full Report
                  </h3>
                  <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-6">
                    Get the complete market report in PDF format for offline reading.
                  </p>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[var(--color-sothebys-blue)] dark:bg-white text-white dark:text-[#1a1a1a] px-8 py-4 text-sm uppercase tracking-[0.2em] font-light hover:bg-[var(--color-gold)] dark:hover:bg-[var(--color-gold)] dark:hover:text-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
              Questions About the Market?
            </h2>
            <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Our team is ready to provide personalized insights and guidance for your real estate decisions.
            </p>

            <Link
              href="/contact-us"
              className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              Contact Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
