import { type SanityDocument } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getSiteName, getBaseUrl, getDefaultHeroImageUrl } from "@/lib/settings";

const POSTS_COUNT_QUERY = `count(*[_type == "post"])`;

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) [$start..$end] {
  _id,
  title,
  slug,
  image,
  publishedAt,
  seo
}`;

interface PageDoc {
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: { asset?: { _id?: string; url?: string } };
  latestEyebrow?: string;
  moreArticlesTitle?: string;
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

const PAGE_QUERY = `*[_type == "blogPage" && _id == "blogPage"][0]{
  heroTitle,
  heroDescription,
  heroImage { asset->{ _id, url } },
  latestEyebrow,
  moreArticlesTitle,
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

const POSTS_PER_PAGE = 12;

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
  const [baseUrl, siteName, page] = await Promise.all([getBaseUrl(), getSiteName(), getPageData()]);
  const heroTitle = page?.heroTitle || 'Blog';
  const title = page?.seo?.metaTitle || `${heroTitle} | ${siteName}`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || 'Insights, market updates, and real estate news.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/blog`,
    },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;

  const [posts, totalCount, page, defaultHeroUrl] = await Promise.all([
    client.fetch<SanityDocument[]>(POSTS_QUERY, { start, end }, options),
    client.fetch<number>(POSTS_COUNT_QUERY, {}, options),
    getPageData(),
    getDefaultHeroImageUrl(),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const isFirstPage = currentPage === 1;
  const featuredPost = isFirstPage ? posts[0] : null;
  const gridPosts = isFirstPage ? posts.slice(1) : posts;

  const heroTitle = page?.heroTitle || 'Blog';
  const heroDescription = page?.heroDescription
    || 'Insights, market updates, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.';
  const latestEyebrow = page?.latestEyebrow || 'Latest Post';
  const moreArticlesTitle = page?.moreArticlesTitle || 'More Articles';
  const emptyTitle = page?.emptyTitle || 'No Posts Yet';
  const emptyText = page?.emptyText || 'Blog posts will be published soon. Check back later.';
  const ctaTitle = page?.ctaTitle || 'Have a Question?';
  const ctaDescription = page?.ctaDescription
    || 'Reach out to our team for personalized advice, market insights, or to start your search.';
  const ctaButtonLabel = page?.ctaButtonLabel || 'Contact Us';
  const ctaButtonHref = page?.ctaButtonHref || '/contact-us';

  const heroImageRaw: string | null = page?.heroImage?.asset?.url || defaultHeroUrl;

  return (
    <main className="min-h-screen">
      {/* Hero Section — transparent header sits on top, so add extra top padding */}
      <section
        className="relative pt-36 pb-2 md:pt-44 md:pb-2 bg-[var(--color-sothebys-blue)]"
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
            quality={95}
              />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" aria-hidden="true" />
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

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-8">
              <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                {latestEyebrow}
              </span>
            </div>
            <Link
              href={`/about/blog/${featuredPost.slug?.current}`}
              className="group block"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {featuredPost.image ? (
                    <Image
                      src={urlFor(featuredPost.image)?.width(800).height(600).url() || ''}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#f0ede8] dark:bg-[#2a2a2a] flex items-center justify-center">
                      <span className="text-[#b0a89e] dark:text-gray-600 text-sm tracking-wider uppercase">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.seo?.metaDescription && (
                    <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-lg leading-relaxed mb-6 line-clamp-3">
                      {featuredPost.seo.metaDescription}
                    </p>
                  )}
                  <span className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                    {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="mt-8">
                    <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase group-hover:gap-4 transition-all duration-300">
                      Read Article
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
      {featuredPost && gridPosts.length > 0 && (
        <div className="w-full flex justify-center py-4 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
        </div>
      )}

      {/* Posts Grid */}
      {gridPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            {isFirstPage && (
              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
                  {moreArticlesTitle}
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/about/blog/${post.slug?.current}`}
                  className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {post.image ? (
                      <Image
                        src={urlFor(post.image)?.width(600).height(375).url() || ''}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f0ede8] dark:bg-[#2a2a2a] flex items-center justify-center">
                        <span className="text-[#b0a89e] dark:text-gray-600 text-xs tracking-wider uppercase">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light tracking-wider uppercase">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                    <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mt-2 mb-3 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.seo?.metaDescription && (
                      <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-sm leading-relaxed line-clamp-2">
                        {post.seo.metaDescription}
                      </p>
                    )}
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-xs font-medium tracking-wider uppercase">
                        Read More
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="py-12 bg-[#f8f7f5] dark:bg-[#141414] border-t border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="flex items-center justify-center gap-2">
              {/* Previous */}
              {currentPage > 1 && (
                <Link
                  href={`/about/blog?page=${currentPage - 1}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Link>
              )}

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;
                const showEllipsis =
                  !showPage &&
                  (page === 2 || page === totalPages - 1);

                if (showEllipsis) {
                  return (
                    <span key={page} className="px-2 text-[#6a6a6a] dark:text-gray-500">
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <Link
                    key={page}
                    href={`/about/blog?page=${page}`}
                    className={`w-10 h-10 flex items-center justify-center text-sm transition-colors duration-200 ${
                      page === currentPage
                        ? 'bg-[var(--color-sothebys-blue)] text-white'
                        : 'text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] border border-[#e8e6e3] dark:border-gray-700'
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}

              {/* Next */}
              {currentPage < totalPages && (
                <Link
                  href={`/about/blog?page=${currentPage + 1}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors duration-200"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Page info */}
            <p className="text-center text-xs text-[#6a6a6a] dark:text-gray-500 mt-4 font-light">
              Page {currentPage} of {totalPages} ({totalCount} articles)
            </p>
          </div>
        </section>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
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

      {/* Contact CTA */}
      <section className="relative py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] overflow-hidden">
        {heroImageRaw && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-fixed"
              style={{ backgroundImage: `url(${heroImageRaw})` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[var(--color-sothebys-blue)]/70 dark:bg-black/70"
              aria-hidden="true"
            />
          </>
        )}
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
