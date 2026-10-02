import Link from 'next/link';
import { client } from '@/sanity/client';

type PostLink = { title: string; slug: string } | null;

/**
 * Previous and next post by publish date. Together with the related-posts
 * block this gives every post inbound links from the posts either side of
 * it, so none is reachable only from a page deep in the blog index.
 */
export default async function AdjacentPosts({ currentSlug, publishedAt }: { currentSlug: string; publishedAt?: string }) {
  if (!publishedAt) return null;
  const [older, newer] = await Promise.all([
    client.fetch<PostLink>(
      `*[_type == "post" && defined(slug.current) && slug.current != $slug && publishedAt < $date] | order(publishedAt desc)[0]{ title, "slug": slug.current }`,
      { slug: currentSlug, date: publishedAt },
      { next: { revalidate: 300 } }
    ),
    client.fetch<PostLink>(
      `*[_type == "post" && defined(slug.current) && slug.current != $slug && publishedAt > $date] | order(publishedAt asc)[0]{ title, "slug": slug.current }`,
      { slug: currentSlug, date: publishedAt },
      { next: { revalidate: 300 } }
    ),
  ]);
  if (!older && !newer) return null;

  const cell = (post: PostLink, label: string, align: 'left' | 'right') =>
    post ? (
      <Link href={`/about/blog/${post.slug}`} className={`group block ${align === 'right' ? 'text-right' : ''}`}>
        <span className="block text-[var(--color-gold)] text-[11px] uppercase tracking-[0.25em] font-light mb-2">{label}</span>
        <span className="block font-serif text-lg text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold)] transition-colors">{post.title}</span>
      </Link>
    ) : (
      <span />
    );

  return (
    <nav aria-label="Adjacent posts" className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="grid grid-cols-2 gap-8">
        {cell(newer, 'Newer post', 'left')}
        {cell(older, 'Older post', 'right')}
      </div>
    </nav>
  );
}
