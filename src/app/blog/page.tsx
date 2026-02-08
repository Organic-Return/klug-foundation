import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const POSTS_COUNT_QUERY = `count(*[_type == "post"])`;

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) [$start..$end] {
  _id,
  title,
  slug,
  image,
  publishedAt,
  seo
}`;

const POSTS_PER_PAGE = 12;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Blog | Klug Properties',
    description: 'Insights, market updates, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.',
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title: 'Blog | Klug Properties',
      description: 'Insights, market updates, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.',
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

  const [posts, totalCount] = await Promise.all([
    client.fetch<SanityDocument[]>(POSTS_QUERY, { start, end }, options),
    client.fetch<number>(POSTS_COUNT_QUERY, {}, options),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const isFirstPage = currentPage === 1;
  const featuredPost = isFirstPage ? posts[0] : null;
  const gridPosts = isFirstPage ? posts.slice(1) : posts;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[var(--color-sothebys-blue)] pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">
            Blog
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            Insights, market updates, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-8">
              <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                Latest Post
              </span>
            </div>
            <Link
              href={`/${featuredPost.slug?.current}`}
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
                  More Articles
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/${post.slug?.current}`}
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
                  href={`/blog?page=${currentPage - 1}`}
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
                // Show first, last, current, and neighbors
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
                    href={`/blog?page=${page}`}
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
                  href={`/blog?page=${currentPage + 1}`}
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
              No Posts Yet
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
              Blog posts will be published soon. Check back later.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
