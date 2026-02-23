'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, getListingHref } from '@/lib/listings';

interface Property {
  id: string;
  address: string;
  city: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[] | null;
  mls_number: string;
}

interface LuxuryPropertyGridProps {
  cities?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function LuxuryPropertyGrid({
  cities = ['Aspen'],
  title = 'Curated Residences',
  subtitle = 'Each property in our collection has been thoughtfully selected for its exceptional character and uncompromising quality',
  limit = 6,
}: LuxuryPropertyGridProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const citiesParam = cities.length > 1
          ? `cities=${encodeURIComponent(cities.join(','))}`
          : `city=${encodeURIComponent(cities[0] || 'Aspen')}`;

        const response = await fetch(`/api/featured-properties?${citiesParam}&limit=${limit}`);
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, [cities, limit]);

  if (isLoading) {
    return (
      <section className="py-32 md:py-40 bg-[var(--color-cream)]">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="animate-pulse">
            <div className="h-3 bg-[var(--color-taupe)] rounded w-24 mx-auto mb-6" />
            <div className="h-8 bg-[var(--color-taupe)] rounded w-80 mx-auto mb-4" />
            <div className="h-4 bg-[var(--color-taupe)] rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="py-32 md:py-40 bg-[var(--color-cream)]">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        {/* Section Header - Hermès/Four Seasons inspired */}
        <div className="text-center mb-24">
          <span className="text-[var(--color-gold)] text-[10px] uppercase tracking-[0.4em] font-normal">
            The Collection
          </span>

          <div className="w-px h-8 bg-[var(--color-sand)] mx-auto my-6" />

          <h2 className="text-[var(--color-charcoal)] text-2xl md:text-3xl lg:text-4xl font-extralight tracking-[0.06em] mb-6">
            {title}
          </h2>

          <p className="text-[var(--color-warm-gray)] text-sm font-light max-w-lg mx-auto leading-[1.9] tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Property Grid - Hermès inspired clean layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 lg:gap-x-10 lg:gap-y-20">
          {properties.map((property, index) => {
            const photo = property.photos?.[0] || null;

            return (
              <Link
                key={property.id}
                href={getListingHref(property)}
                className="group block"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image Container - Hermès style clean edges */}
                <div className="relative aspect-[4/5] mb-8 overflow-hidden bg-[var(--color-taupe)]">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={property.address || 'Property'}
                      fill
                      className={`object-cover transition-all duration-1000 ease-out ${
                        hoveredIndex === index ? 'scale-105' : 'scale-100'
                      }`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}

                  {/* Subtle overlay on hover - Hermès style */}
                  <div
                    className={`absolute inset-0 bg-[#1a1a1a]/20 flex items-end justify-center pb-8 transition-all duration-700 ${
                      hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="text-white text-[10px] uppercase tracking-[0.3em] font-light">
                      View Property
                    </span>
                  </div>
                </div>

                {/* Property Info - Minimal Hermès style */}
                <div className="text-center">
                  <span className="text-[var(--color-gold)] text-[9px] uppercase tracking-[0.35em] font-normal">
                    {property.city}
                  </span>

                  <h3 className="text-[var(--color-charcoal)] text-lg md:text-xl font-extralight mt-3 mb-2 tracking-[0.02em]">
                    {formatPrice(property.list_price)}
                  </h3>

                  <p className="text-[var(--color-warm-gray)] text-xs font-light mb-4 line-clamp-1 tracking-wide">
                    {property.address}
                  </p>

                  <div className="flex justify-center items-center gap-6 text-[9px] text-[var(--color-warm-gray)]/70 uppercase tracking-[0.2em]">
                    {property.bedrooms !== null && (
                      <span>{property.bedrooms} Bed</span>
                    )}
                    {property.bedrooms !== null && property.bathrooms !== null && (
                      <span className="w-px h-3 bg-[var(--color-sand)]" />
                    )}
                    {property.bathrooms !== null && (
                      <span>{property.bathrooms} Bath</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All CTA - Hermès style elegant link */}
        <div className="text-center mt-24">
          <Link
            href="/listings"
            className="group inline-flex items-center gap-4 text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
          >
            <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
              View All Properties
            </span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
