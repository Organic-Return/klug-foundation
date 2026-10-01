import Image from 'next/image';
import Link from 'next/link';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';

const { projectId, dataset } = client.config();
const urlFor = (source: unknown) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source as never) : null;

type CommunitySummary = {
  _id: string;
  title: string;
  slug: string;
  communityType?: string;
  featuredImage?: unknown;
  parentId?: string | null;
};

const COMMUNITIES_QUERY = `*[_type == "community" && defined(slug.current) && (!defined(status) || status == "active")] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  communityType,
  featuredImage,
  "parentId": parentCommunity._ref
}`;

interface MoreCommunitiesProps {
  currentId: string;
  currentSlug: string;
  parentId?: string | null;
}

/**
 * Lateral links between community pages. There is no communities index, so
 * each page was reachable from a single navigation link. Neighbourhoods in
 * the same town come first (siblings under one parent, or a town's own
 * neighbourhoods); the rest of the set fills in, rotated by this page's
 * position so every community is linked from several others.
 */
export default async function MoreCommunities({ currentId, currentSlug, parentId }: MoreCommunitiesProps) {
  const all = await client.fetch<CommunitySummary[]>(COMMUNITIES_QUERY, {}, { next: { revalidate: 300 } });
  const index = Math.max(0, all.findIndex((c) => c._id === currentId));
  const others = all.filter((c) => c._id !== currentId && c.slug !== currentSlug);
  if (others.length === 0) return null;
  const related = others.filter((c) => (parentId && c.parentId === parentId) || c.parentId === currentId || (parentId && c._id === parentId));
  const rest = others.filter((c) => !related.includes(c));
  const rotated = rest.length ? rest.map((_, i) => rest[(index + i) % rest.length]) : [];
  const picks = [...related, ...rotated].slice(0, 4);

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-8">
          Explore More Communities
        </h2>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {picks.map((c) => {
            const img = c.featuredImage ? urlFor(c.featuredImage)?.width(600).height(450).url() : null;
            return (
              <li key={c._id}>
                <Link href={`/communities/${c.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f0ede8] dark:bg-[#2a2a2a] mb-4">
                    {img && (
                      <Image
                        src={img}
                        alt={c.title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  {c.communityType && (
                    <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.25em] font-light mb-1">
                      {c.communityType}
                    </p>
                  )}
                  <p className="font-serif text-lg text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold)] transition-colors">
                    {c.title.trim()}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
