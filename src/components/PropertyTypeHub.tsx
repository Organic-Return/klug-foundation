import Link from 'next/link';
import Image from 'next/image';
import { getListingHref, type MLSProperty } from '@/lib/listings';

interface PropertyTypeHubProps {
  /** Slug used in URLs — also used to build city-filter links. */
  type: 'rentals' | 'commercial' | 'land' | 'condos';
  /** Hero h1 text. */
  title: string;
  /** Long-form intro paragraph(s). Each paragraph rendered as its own <p>. */
  intro: string[];
  /** Listings to display. */
  listings: MLSProperty[];
  /** All cities available for filtering. Used for sub-hub link blocks. */
  cities: string[];
  /** When set, the hub is showing a city-filtered view. */
  currentCity?: string | null;
  /** Empty-state copy when listings.length === 0. */
  emptyText?: string;
  /** 1-based page currently being shown. Omit for a single-page hub. */
  page?: number;
  /** Total listings across all pages — `listings` holds just this page. */
  totalCount?: number;
  /** Path the pager links to, e.g. "/condos" or "/condos/aspen". */
  basePath?: string;
}

/**
 * Listings per page. The hubs used to render every match in one document —
 * /condos was 2.2MB of HTML for 487 cards, /rentals 2.1MB — which is a poor
 * LCP on a page whose job is to rank.
 */
export const HUB_PAGE_SIZE = 48;

const TYPE_COPY: Record<PropertyTypeHubProps['type'], { plural: string; eyebrow: string }> = {
  rentals: { plural: 'rentals', eyebrow: 'For Rent' },
  commercial: { plural: 'commercial properties', eyebrow: 'Commercial' },
  land: { plural: 'land + acreage listings', eyebrow: 'Land for Sale' },
  condos: { plural: 'condos', eyebrow: 'Condos for Sale' },
};

function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-');
}

function formatPrice(p: number | null): string {
  if (!p) return 'Price on Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p);
}

export default function PropertyTypeHub({
  type,
  title,
  intro,
  listings,
  cities,
  currentCity,
  emptyText,
  page = 1,
  totalCount,
  basePath,
}: PropertyTypeHubProps) {
  const typeCopy = TYPE_COPY[type];
  const total = totalCount ?? listings.length;
  const totalPages = Math.max(1, Math.ceil(total / HUB_PAGE_SIZE));
  const pagerBase = basePath ?? `/${type}`;
  const firstOnPage = total === 0 ? 0 : (page - 1) * HUB_PAGE_SIZE + 1;
  const lastOnPage = Math.min(page * HUB_PAGE_SIZE, total);
  const pageHref = (n: number) => (n <= 1 ? pagerBase : `${pagerBase}?page=${n}`);
  const otherTypes = (Object.keys(TYPE_COPY) as Array<PropertyTypeHubProps['type']>).filter((t) => t !== type);

  return (
    <main className="-mt-20 min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero band */}
      <section className="relative bg-[var(--color-sothebys-blue)] pt-36 pb-16 md:pt-44 md:pb-20">
        <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-4">
            {typeCopy.eyebrow}
          </p>
          <h1 className="font-serif text-white mb-6">{title}</h1>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-6" />
          <div className="text-base md:text-lg text-white/80 font-light leading-relaxed space-y-4 text-left md:text-center">
            {intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by city — quick chip nav */}
      {cities.length > 0 && (
        <section className="border-b border-[#e8e6e3] dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6a6a6a] dark:text-gray-400 font-light mb-3">
              Browse {typeCopy.plural} by community
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${type}`}
                className={`text-sm px-4 py-1.5 border transition-colors ${
                  !currentCity
                    ? 'bg-[var(--color-sothebys-blue)] text-white border-[var(--color-sothebys-blue)]'
                    : 'border-[#e8e6e3] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'
                }`}
              >
                All
              </Link>
              {cities.map((c) => {
                const isCurrent = currentCity?.toLowerCase() === c.toLowerCase();
                return (
                  <Link
                    key={c}
                    href={`/${type}/${citySlug(c)}`}
                    className={`text-sm px-4 py-1.5 border transition-colors ${
                      isCurrent
                        ? 'bg-[var(--color-sothebys-blue)] text-white border-[var(--color-sothebys-blue)]'
                        : 'border-[#e8e6e3] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'
                    }`}
                  >
                    {c}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Listings grid */}
      <section className="py-12 md:py-16 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="mb-8 flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
              {currentCity ? `${currentCity} ${typeCopy.plural}` : `All ${typeCopy.plural}`}
            </h2>
            <span className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
              {totalPages > 1
                ? `Showing ${firstOnPage}–${lastOnPage} of ${total} properties`
                : `${total} ${total === 1 ? 'property' : 'properties'}`}
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
                {emptyText || `No ${typeCopy.plural} found${currentCity ? ` in ${currentCity}` : ''}. Check back soon.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => {
                const photo = l.photos?.[0] || null;
                const href = getListingHref(l);
                return (
                  <Link
                    key={l.id || l.mls_number}
                    href={href}
                    className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-colors duration-300"
                  >
                    <div className="relative aspect-[4/3] bg-[#f0f0f0] dark:bg-gray-800 overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={l.address || 'Listing photo'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#aaa]">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[var(--color-gold)] text-sm font-medium mb-1">
                        {formatPrice(l.list_price)}
                      </p>
                      <h3 className="font-serif text-base text-[#1a1a1a] dark:text-white mb-1 line-clamp-1">
                        {l.address}
                      </h3>
                      <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light line-clamp-1">
                        {[l.city, l.state, l.zip_code].filter(Boolean).join(', ')}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6a6a6a] dark:text-gray-400 font-light">
                        {l.bedrooms ? <span>{l.bedrooms} bd</span> : null}
                        {l.bathrooms ? <span>{l.bathrooms} ba</span> : null}
                        {l.square_feet ? <span>{l.square_feet.toLocaleString()} sf</span> : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
            >
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  rel="prev"
                  className="text-sm px-4 py-2 border border-[#e8e6e3] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                // First, last, and a window around the current page.
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .map((n, i, shown) => (
                  <span key={n} className="flex items-center gap-2">
                    {i > 0 && shown[i - 1] !== n - 1 && (
                      <span className="text-[#aaa] text-sm">…</span>
                    )}
                    <Link
                      href={pageHref(n)}
                      aria-current={n === page ? 'page' : undefined}
                      className={`text-sm px-4 py-2 border transition-colors ${
                        n === page
                          ? 'bg-[var(--color-sothebys-blue)] text-white border-[var(--color-sothebys-blue)]'
                          : 'border-[#e8e6e3] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'
                      }`}
                    >
                      {n}
                    </Link>
                  </span>
                ))}
              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  rel="next"
                  className="text-sm px-4 py-2 border border-[#e8e6e3] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Cross-links to other property types + buy/sell */}
      <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414] border-t border-[#e8e6e3] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h2 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
            Explore other property types
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherTypes.map((t) => (
              <Link
                key={t}
                href={`/${t}`}
                className="block p-6 bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-colors"
              >
                <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.25em] font-light mb-2">
                  {TYPE_COPY[t].eyebrow}
                </p>
                <p className="text-base font-serif text-[#1a1a1a] dark:text-white">
                  Browse {TYPE_COPY[t].plural}
                </p>
              </Link>
            ))}
            <Link
              href="/real-estate-for-sale"
              className="block p-6 bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-colors"
            >
              <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.25em] font-light mb-2">
                Homes for Sale
              </p>
              <p className="text-base font-serif text-[#1a1a1a] dark:text-white">
                Browse all residential listings
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
