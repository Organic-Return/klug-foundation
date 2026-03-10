import { type SanityDocument } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const PRESS_ARTICLES_QUERY = `*[_type == "pressArticle"] | order(publishedAt desc) {
  _id,
  title,
  sourceName,
  sourceLogo {
    asset-> {
      _id,
      url
    }
  },
  url,
  image {
    asset-> {
      _id,
      url
    }
  },
  excerpt,
  publishedAt,
  featured
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'In the News | Press & Media Coverage',
    description: 'Read about us in leading publications including Robb Report, Wall Street Journal, and more.',
    alternates: {
      canonical: `${baseUrl}/in-the-news`,
    },
    openGraph: {
      title: 'In the News | Press & Media Coverage',
      description: 'Read about us in leading publications including Robb Report, Wall Street Journal, and more.',
      type: 'website',
      url: `${baseUrl}/in-the-news`,
    },
  };
}

export default async function InTheNewsPage() {
  const articles = await client.fetch<SanityDocument[]>(PRESS_ARTICLES_QUERY, {}, options);

  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured || a._id !== featuredArticle?._id);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[var(--color-sothebys-blue)] pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">
            In the News
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            As featured in leading publications. Browse our latest press coverage and media mentions.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-8">
              <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                Featured
              </span>
            </div>
            <a
              href={featuredArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f8f7f5] dark:bg-[#141414]">
                  {featuredArticle.image?.asset ? (
                    <>
                      <Image
                        src={urlFor(featuredArticle.image)?.width(800).height(600).url() || ''}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {featuredArticle.sourceLogo?.asset ? (
                        <div className="relative h-12 w-48">
                          <Image
                            src={urlFor(featuredArticle.sourceLogo)?.height(96).url() || ''}
                            alt={featuredArticle.sourceName}
                            fill
                            className="object-contain opacity-30"
                          />
                        </div>
                      ) : (
                        <span className="font-serif text-2xl text-[#1a1a1a]/20 dark:text-white/20 tracking-wider">
                          {featuredArticle.sourceName}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Source badge */}
                  {featuredArticle.image?.asset && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 px-4 py-2 backdrop-blur-sm">
                      {featuredArticle.sourceLogo?.asset ? (
                        <div className="relative h-5 w-24">
                          <Image
                            src={urlFor(featuredArticle.sourceLogo)?.height(40).url() || ''}
                            alt={featuredArticle.sourceName}
                            fill
                            className="object-contain object-left"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium tracking-wider uppercase text-[#1a1a1a] dark:text-white">
                          {featuredArticle.sourceName}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  {!featuredArticle.image?.asset && (
                    <p className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase mb-3">
                      {featuredArticle.sourceName}
                    </p>
                  )}
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.excerpt && (
                    <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-lg leading-relaxed mb-6">
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    {featuredArticle.publishedAt && (
                      <span className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                        {formatDate(featuredArticle.publishedAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-8">
                    <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase group-hover:gap-4 transition-all duration-300">
                      Read Article
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Divider */}
      {featuredArticle && regularArticles.length > 0 && (
        <div className="w-full flex justify-center py-4 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
        </div>
      )}

      {/* All Articles Grid */}
      {regularArticles.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
                All Articles
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularArticles.map((article) => (
                <a
                  key={article._id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#f8f7f5] dark:bg-[#0a0a0a]">
                    {article.image?.asset ? (
                      <>
                        <Image
                          src={urlFor(article.image)?.width(600).height(375).url() || ''}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Source badge */}
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 px-3 py-1.5 backdrop-blur-sm">
                          {article.sourceLogo?.asset ? (
                            <div className="relative h-4 w-20">
                              <Image
                                src={urlFor(article.sourceLogo)?.height(32).url() || ''}
                                alt={article.sourceName}
                                fill
                                className="object-contain object-left"
                              />
                            </div>
                          ) : (
                            <span className="text-xs font-medium tracking-wider uppercase text-[#1a1a1a] dark:text-white">
                              {article.sourceName}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-sothebys-blue)] dark:bg-[#141414]">
                        {article.sourceLogo?.asset ? (
                          <div className="relative h-8 w-32">
                            <Image
                              src={urlFor(article.sourceLogo)?.height(64).url() || ''}
                              alt={article.sourceName}
                              fill
                              className="object-contain brightness-0 invert"
                            />
                          </div>
                        ) : (
                          <span className="font-serif text-lg text-white/80 tracking-wider">
                            {article.sourceName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {!article.sourceLogo?.asset && article.image?.asset && (
                      <p className="text-[var(--color-gold)] text-xs font-medium tracking-wider uppercase mb-2">
                        {article.sourceName}
                      </p>
                    )}
                    {article.publishedAt && (
                      <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light tracking-wider uppercase">
                        {formatDate(article.publishedAt)}
                      </span>
                    )}
                    <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mt-2 mb-3 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300 line-clamp-3">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-sm leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-xs font-medium tracking-wider uppercase">
                        Read Article
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {articles.length === 0 && (
        <section className="py-24 md:py-32 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              No Articles Yet
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
              Press coverage and media mentions will appear here. Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            Media Inquiries
          </h2>
          <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            For press inquiries, interviews, or media coverage opportunities, please get in touch with our team.
          </p>

          <Link
            href="/contact-us"
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            Contact Us
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
