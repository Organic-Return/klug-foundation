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

interface ClassicFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft);
}

export default function ClassicFeaturedProperty({
  mlsId,
  headline = 'Featured Property',
  buttonText = 'View Property',
}: ClassicFeaturedPropertyProps) {
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
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          {/* City/Headline Label */}
          <div className="mb-3">
            <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
              {headline || property.city}
            </span>
          </div>

          {/* Price */}
          <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-3">
            {formatPrice(property.list_price)}
          </h3>

          {/* Address */}
          <p className="text-white/80 text-base md:text-lg mb-5 font-light">
            {fullAddress}
          </p>

          {/* Property Details - Simple horizontal layout */}
          <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-6">
            {property.bedrooms !== null && (
              <span>{property.bedrooms} Beds</span>
            )}
            {property.bathrooms !== null && (
              <span>{property.bathrooms} Baths</span>
            )}
            {property.square_feet !== null && (
              <span>{formatSqft(property.square_feet)} Sq Ft</span>
            )}
            {property.property_type && (
              <span>{property.property_type}</span>
            )}
          </div>

          {/* View Property Button */}
          <Link
            href={`/listings/${property.id}`}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-5 py-2.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-white w-fit"
          >
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
