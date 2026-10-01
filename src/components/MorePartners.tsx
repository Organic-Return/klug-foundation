import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/sanity/client';
import { enrichPartnerWithAgentData, getPartnerUrl, type Partner } from '@/app/affiliated-partners/components';

const SIBLINGS_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == $partnerType] | order(sortOrder asc, lastName asc) {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  overridePhoto
}`;

interface MorePartnersProps {
  currentId: string;
  partnerType: 'market_leader' | 'ski_town';
  heading: string;
  indexHref: string;
  indexLabel: string;
}

/**
 * Lateral links between partner profiles. Each profile was linked only from
 * its index page, so a crawler saw every partner as a one-link dead end. The
 * four partners that follow this one in the index order are shown (wrapping
 * at the end), so across the set every partner is linked from four others.
 */
export default async function MorePartners({ currentId, partnerType, heading, indexHref, indexLabel }: MorePartnersProps) {
  const partners = await client.fetch<Partner[]>(SIBLINGS_QUERY, { partnerType }, { next: { revalidate: 60 } });
  const index = partners.findIndex((p) => p._id === currentId);
  const others = partners.filter((p) => p._id !== currentId);
  if (others.length === 0) return null;
  const start = index < 0 ? 0 : index; // the current partner has been removed, so `index` is now the next one
  const picks = Array.from({ length: Math.min(4, others.length) }, (_, i) => others[(start + i) % others.length]);
  const enriched = await Promise.all(picks.map((p) => enrichPartnerWithAgentData(p)));

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex items-end justify-between mb-8 gap-6">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
            {heading}
          </h2>
          <Link
            href={indexHref}
            className="hidden sm:inline-block text-xs tracking-[0.15em] uppercase text-[var(--color-sothebys-blue)] dark:text-white hover:text-[var(--color-gold)] dark:hover:text-[var(--color-gold)] border-b border-current pb-1 transition-colors whitespace-nowrap"
          >
            {indexLabel}
          </Link>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {enriched.map((p) => (
            <li key={p._id}>
              <Link href={getPartnerUrl(p)} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0f0] dark:bg-gray-800 mb-4">
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt={`${p.firstName} ${p.lastName}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                </div>
                <p className="font-serif text-lg text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {p.firstName} {p.lastName}
                </p>
                {(p.company || p.location) && (
                  <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                    {[p.company, p.location].filter(Boolean).join(' · ')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sm:hidden mt-8">
          <Link href={indexHref} className="text-xs tracking-[0.15em] uppercase text-[var(--color-sothebys-blue)] dark:text-white border-b border-current pb-1">
            {indexLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
