import Image from 'next/image';
import Link from 'next/link';
import { getListingByMlsNumber, getListingHref, formatPrice } from '@/lib/listings';

interface FeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft);
}

export default async function FeaturedProperty({
  mlsId,
  headline = 'Featured Property',
  buttonText = 'View Property',
}: FeaturedPropertyProps) {
  const property = await getListingByMlsNumber(mlsId);

  if (!property) {
    return null;
  }

  const mainPhoto = property.photos[0];
  const fullAddress = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="relative w-full aspect-video">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={fullAddress || 'Featured Property'}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-cream)] flex items-center justify-center">
            <svg
              className="w-24 h-24 text-[var(--color-warm-gray)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/90 via-black/30 to-transparent" />
      </div>

      {/* Property details overlay */}
      <div className="relative h-full flex flex-col justify-end">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
          {/* Headline with gold accent */}
          {headline && (
            <div className="mb-6">
              <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] mb-4" />
              <p className="text-[var(--color-gold)] text-sm uppercase tracking-[0.3em] font-medium">
                {headline}
              </p>
            </div>
          )}

          {/* Price */}
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shadow-luxury">
            {formatPrice(property.list_price)}
          </h2>

          {/* Address */}
          <p className="text-white/90 text-xl md:text-2xl mb-8 font-light tracking-wide">{fullAddress}</p>

          {/* Property details - Elegant divider style */}
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-white/80 text-base mb-10">
            {property.bedrooms !== null && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-semibold text-lg">{property.bedrooms}</span>
                  <span className="uppercase tracking-wider text-sm">Bedrooms</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-white/30" />
              </>
            )}
            {property.bathrooms !== null && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-semibold text-lg">{property.bathrooms}</span>
                  <span className="uppercase tracking-wider text-sm">Bathrooms</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-white/30" />
              </>
            )}
            {property.square_feet !== null && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-semibold text-lg">{formatSqft(property.square_feet)}</span>
                  <span className="uppercase tracking-wider text-sm">Sq Ft</span>
                </div>
                <div className="hidden md:block w-px h-4 bg-white/30" />
              </>
            )}
            {property.property_type && (
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wider text-sm">{property.property_type}</span>
              </div>
            )}
          </div>

          {/* MLS Number and Status */}
          <div className="flex flex-wrap items-center gap-6 mb-10">
            <span className="text-white/50 text-sm tracking-wider">MLS# {property.mls_number}</span>
            <span
              className={`px-4 py-1.5 text-xs font-medium tracking-wider uppercase ${
                property.status === 'Active'
                  ? 'bg-emerald-600/90 text-white'
                  : property.status === 'Pending'
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-white/20 text-white'
              }`}
            >
              {property.status}
            </span>
          </div>

          {/* View Property Button */}
          <Link href={getListingHref(property)} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-6 py-3 border border-[var(--color-gold)] hover:bg-transparent hover:border-white">
            {buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
