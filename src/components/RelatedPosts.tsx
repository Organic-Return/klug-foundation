import Image from 'next/image';
import Link from 'next/link';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';

const { projectId, dataset } = client.config();
const urlFor = (source: unknown) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source as never) : null;

type PostSummary = {
  title?: string;
  slug?: string;
  image?: unknown;
  publishedAt?: string;
};

const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc)[0...80]{
  title,
  "slug": slug.current,
  image,
  publishedAt
}`;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'before', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on', 'or',
  'the', 'to', 'vs', 'what', 'where', 'why', 'with', 'you', 'your', 'aspen', 'real', 'estate', 'snowmass',
]);

function tokens(slug: string): Set<string> {
  return new Set(slug.split('-').filter((t) => t.length > 2 && !STOPWORDS.has(t)));
}

/**
 * Picks the posts most related to the current one by slug-word overlap, then
 * recency. Posts have no categories in Sanity, and the site's article slugs
 * are descriptive enough ("red-mountain-aspen-neighborhood-guide…") that shared
 * words find real neighbours. "aspen" and "snowmass" are excluded from the
 * match because nearly every post carries them.
 */
export function pickRelated(current: string, posts: PostSummary[], limit = 3): PostSummary[] {
  const mine = tokens(current);
  return posts
    .filter((p) => p.slug && p.slug !== current)
    .map((p, index) => {
      const shared = [...tokens(p.slug!)].filter((t) => mine.has(t)).length;
      return { p, shared, index };
    })
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .slice(0, limit)
    .map(({ p }) => p);
}

interface RelatedPostsProps {
  currentSlug: string;
  /** URL prefix for posts, e.g. "/about/blog". */
  basePath?: string;
}

/**
 * Lateral links between blog posts. Posts previously linked to no other post,
 * so anything past the blog's first page sat four clicks deep with a single
 * inbound link.
 */
export default async function RelatedPosts({ currentSlug, basePath = '' }: RelatedPostsProps) {
  const posts = await client.fetch<PostSummary[]>(POSTS_QUERY, {}, { next: { revalidate: 300 } });
  const related = pickRelated(currentSlug, posts || []);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-heading" className="bg-[#f7f6f4] dark:bg-[#141414] py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-10">
          <h2
            id="related-posts-heading"
            className="!mt-0 font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white tracking-wide"
          >
            More from the Blog
          </h2>
          <div className="w-16 h-[1px] bg-[var(--color-gold)] mx-auto mt-6" />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 list-none p-0 m-0">
          {related.map((post) => {
            const imageUrl = post.image ? urlFor(post.image)?.width(800).height(500).fit('crop').url() : null;
            return (
              <li key={post.slug}>
                <Link href={`${basePath}/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#e9e7e3] dark:bg-[#222]">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="!mt-4 !mb-1 font-serif !text-lg md:!text-xl !font-light !leading-snug text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold)] transition-colors">
                    {post.title}
                  </h3>
                  {post.publishedAt && (
                    <p className="!my-0 text-xs tracking-wide text-[#8a8a8a] dark:text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
