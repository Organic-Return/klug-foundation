'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/listings';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
  mls_number: string;
  status: string;
  property_type: string;
}

interface LuxuryFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

export default function LuxuryFeaturedProperty({
  mlsId,
  headline = 'Featured Residence',
  buttonText = 'Discover',
}: LuxuryFeaturedPropertyProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/listings/${mlsId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (mlsId) {
      fetchProperty();
    }
  }, [mlsId]);

  if (isLoading || !property) {
    return null;
  }

  const mainPhoto = property.photos?.[0];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-[var(--color-cream)]">
      <div className="relative w-[90%] max-w-[1800px] mx-auto h-screen min-h-[600px] max-h-[800px] overflow-hidden rounded-sm">
      {/* Fullscreen Background Image */}
      <div className="absolute inset-0">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={property.address}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--color-charcoal)]" />
        )}

        {/* Gradient Overlay - subtle center gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end pb-16 md:pb-24 lg:pb-32">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 w-full">
          {/* Pretitle */}
          <p className="text-white/70 text-[11px] uppercase tracking-[0.3em] font-light mb-4 font-luxury">
            {headline}
          </p>

          {/* Property Address - Large elegant typography */}
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.02em] leading-[1.1] mb-4 font-luxury max-w-4xl">
            {property.address}
          </h2>

          {/* Location */}
          <p className="text-white/80 text-lg md:text-xl font-light tracking-wide mb-8 font-luxury">
            {property.city}, {property.state}
          </p>

          {/* Property Details Row */}
          <div className="flex flex-wrap items-center gap-6 md:gap-10 mb-10">
            {/* Price */}
            <div>
              <p className="text-white text-2xl md:text-3xl font-light tracking-wide font-luxury">
                {formatPrice(property.list_price)}
              </p>
            </div>

            {/* Divider */}
            <span className="hidden sm:block w-px h-8 bg-white/30" />

            {/* Stats */}
            <div className="flex items-center gap-6 text-white/80 text-sm uppercase tracking-[0.15em] font-light">
              {property.bedrooms !== null && (
                <span>{property.bedrooms} Beds</span>
              )}
              {property.bathrooms !== null && (
                <>
                  <span className="w-px h-4 bg-white/30" />
                  <span>{property.bathrooms} Baths</span>
                </>
              )}
              {property.square_feet && (
                <>
                  <span className="w-px h-4 bg-white/30" />
                  <span>{property.square_feet.toLocaleString()} Sq Ft</span>
                </>
              )}
            </div>
          </div>

          {/* CTA Button - One&Only style */}
          <Link
            href={`/listings/${property.id}`}
            className="group inline-flex items-center gap-4"
          >
            <span className="text-white text-[11px] uppercase tracking-[0.2em] font-light border-b border-white/50 pb-1 group-hover:border-white transition-colors duration-300 font-luxury">
              {buttonText}
            </span>
            <span className="w-10 h-10 rounded-full border border-white/50 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all duration-300">
              <svg
                className="w-4 h-4 text-white transform group-hover:translate-x-0.5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator - Optional elegant touch */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
        <span className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-light">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
      </div>
      </div>
    </section>
  );
}
