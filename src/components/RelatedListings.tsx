import Image from 'next/image';
import Link from 'next/link';
import { getListingHref, type MLSProperty } from '@/lib/listings';

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

interface RelatedListingsProps {
  listings: MLSProperty[];
  city?: string | null;
  heading?: string;
}

export default function RelatedListings({ listings, city, heading }: RelatedListingsProps) {
  if (!listings || listings.length === 0) return null;
  const title = heading || (city ? `More Properties in ${city}` : 'More Properties');

  return (
    <section className="py-16 md:py-20 bg-[var(--rc-cream,#f7f4ee)]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--rc-navy,#002349)] tracking-wide">
            {title}
          </h2>
          <div className="w-12 h-px bg-[var(--rc-gold,#c9ac77)] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {listings.map((l) => {
            const photo = l.photos && l.photos.length > 0 ? l.photos[0] : null;
            const href = getListingHref(l);
            return (
              <Link
                key={l.id}
                href={href}
                className="group block bg-white border border-[var(--rc-brown,#6a6a6a)]/10 overflow-hidden hover:border-[var(--rc-gold,#c9ac77)] transition-colors duration-300"
              >
                <div className="relative aspect-[4/3] bg-[var(--rc-navy,#002349)]/5">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={l.address || 'Property'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--rc-brown,#6a6a6a)]/40 text-xs uppercase tracking-wider">
                      No Photo
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="font-serif text-lg md:text-xl text-[var(--rc-navy,#002349)] mb-1 line-clamp-1">
                    {l.address?.split(',')[0] || 'Property'}
                  </div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[var(--rc-brown,#6a6a6a)]/60 mb-3">
                    {l.city}{l.state ? `, ${l.state}` : ''}
                  </div>
                  <div className="font-serif text-xl text-[var(--rc-navy,#002349)] mb-4">
                    {formatPrice(l.list_price)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--rc-brown,#6a6a6a)]">
                    {l.bedrooms != null && <span>{l.bedrooms} bd</span>}
                    {l.bathrooms != null && <span>{l.bathrooms} ba</span>}
                    {l.square_feet ? <span>{l.square_feet.toLocaleString()} sqft</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/real-estate-for-sale"
            className="inline-block text-xs tracking-[0.15em] uppercase text-[var(--rc-navy,#002349)] hover:text-[var(--rc-gold,#c9ac77)] border-b border-[var(--rc-navy,#002349)] hover:border-[var(--rc-gold,#c9ac77)] pb-1 transition-colors"
          >
            Browse All Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
