import Image from 'next/image';
import Link from 'next/link';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { pickNeighbours, type PublicationSummary } from '@/lib/publications';

const { projectId, dataset } = client.config();
const urlFor = (source: unknown) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source as never) : null;

interface MorePublicationsProps {
  publicationType: 'magazine' | 'market-report';
  currentSlug: string;
  basePath: string;
  heading: string;
  indexLabel: string;
}

export default async function MorePublications({ publicationType, currentSlug, basePath, heading, indexLabel }: MorePublicationsProps) {
  const all = await client.fetch<PublicationSummary[]>(
    `*[_type == "publication" && publicationType == $type && defined(slug.current)] | order(publishedAt desc) [0...300] {
      _id, title, slug, publishedAt, headerImage
    }`,
    { type: publicationType },
    { next: { revalidate: 300 } }
  );
  const picks = pickNeighbours(all, currentSlug, 6);
  if (picks.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex items-end justify-between mb-8 gap-6">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">{heading}</h2>
          <Link
            href={basePath}
            className="hidden sm:inline-block text-xs tracking-[0.15em] uppercase text-[var(--color-sothebys-blue)] dark:text-white hover:text-[var(--color-gold)] dark:hover:text-[var(--color-gold)] border-b border-current pb-1 transition-colors whitespace-nowrap"
          >
            {indexLabel}
          </Link>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {picks.map((p) => {
            const img = p.headerImage ? urlFor(p.headerImage)?.width(600).height(450).url() : null;
            return (
              <li key={p._id}>
                <Link href={`${basePath}/${p.slug.current}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f0ede8] dark:bg-[#2a2a2a] mb-4">
                    {img && (
                      <Image src={img} alt={p.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-[0.2em] mb-1">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                  </p>
                  <p className="font-serif text-lg text-[#1a1a1a] dark:text-white line-clamp-2 group-hover:text-[var(--color-gold)] transition-colors">{p.title}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
