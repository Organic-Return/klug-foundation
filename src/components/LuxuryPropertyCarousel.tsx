'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/listings';

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

interface LuxuryPropertyCarouselProps {
  cities?: string[];
  pretitle?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function LuxuryPropertyCarousel({
  cities: citiesProp,
  pretitle = 'The Collection',
  title = 'Curated Residences',
  subtitle = 'Discover exceptional properties that define luxury living in the most coveted destinations',
  limit = 8,
}: LuxuryPropertyCarouselProps) {
  const cities = citiesProp && citiesProp.length > 0 ? citiesProp : ['Aspen'];
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const checkScrollPosition = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => carousel.removeEventListener('scroll', checkScrollPosition);
    }
  }, [properties]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = 380; // Approximate card width + gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-24 md:py-32 bg-[var(--color-cream)]">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/4 animate-pulse">
              <div className="h-3 bg-[var(--color-taupe)] rounded w-20 mb-4" />
              <div className="h-8 bg-[var(--color-taupe)] rounded w-48 mb-4" />
              <div className="h-4 bg-[var(--color-taupe)] rounded w-64" />
            </div>
            <div className="lg:w-3/4 flex gap-6 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[340px] animate-pulse">
                  <div className="aspect-[4/5] bg-[var(--color-taupe)] rounded mb-4" />
                  <div className="h-5 bg-[var(--color-taupe)] rounded w-3/4 mb-2" />
                  <div className="h-4 bg-[var(--color-taupe)] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 bg-[var(--color-cream)] overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Side - Title Section (Rosewood style) */}
          <div className="lg:w-1/4 lg:max-w-[300px] flex-shrink-0">
            <div className="lg:sticky lg:top-32">
              {/* Pretitle */}
              <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-4 font-luxury-body">
                {pretitle}
              </p>

              {/* Title */}
              <h2 className="text-[var(--color-charcoal)] text-2xl md:text-3xl lg:text-[2.5rem] font-light tracking-[0.04em] leading-[1.2] mb-6 font-luxury">
                {title}
              </h2>

              {/* Subtitle/Description */}
              <p className="text-[var(--color-warm-gray)] text-sm font-light leading-[1.8] tracking-wide font-luxury-body">
                {subtitle}
              </p>

              {/* Navigation Arrows - Desktop */}
              <div className="hidden lg:flex items-center gap-4 mt-10">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    canScrollLeft
                      ? 'border-[var(--color-charcoal)] text-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-white'
                      : 'border-[var(--color-taupe)] text-[var(--color-taupe)] cursor-not-allowed'
                  }`}
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    canScrollRight
                      ? 'border-[var(--color-charcoal)] text-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-white'
                      : 'border-[var(--color-taupe)] text-[var(--color-taupe)] cursor-not-allowed'
                  }`}
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* View All Link */}
              <Link
                href="/listings"
                className="hidden lg:inline-flex items-center gap-4 mt-8 group font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
              >
                <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                  View All
                </span>
                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Side - Carousel */}
          <div className="lg:w-3/4 relative">
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mr-6 lg:-mr-12 pr-6 lg:pr-12 scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {properties.map((property) => {
                const photo = property.photos?.[0] || null;

                return (
                  <div
                    key={property.id}
                    className="flex-shrink-0 w-[300px] sm:w-[340px] group"
                  >
                    {/* Card Image */}
                    <Link href={`/listings/${property.id}`} className="block">
                      <div className="relative aspect-[4/5] mb-5 overflow-hidden bg-[var(--color-taupe)]">
                        {photo ? (
                          <Image
                            src={photo}
                            alt={property.address || 'Property'}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 640px) 300px, 340px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Card Content */}
                    <div className="px-1">
                      <h3
                        className="text-[var(--color-charcoal)] tracking-wide mb-2 font-luxury-body line-clamp-1"
                        style={{ fontSize: 'clamp(1.5rem, 3vw, 1.5rem)', fontWeight: 400, lineHeight: 1.0 }}
                      >
                        {formatPrice(property.list_price)}
                      </h3>

                      <p className="text-[var(--color-warm-gray)] text-sm font-light mb-4 line-clamp-1 font-luxury">
                        {property.address}, {property.city}
                      </p>

                      {/* Property Details */}
                      <div className="flex items-center gap-4 text-[10px] text-[var(--color-warm-gray)]/70 uppercase tracking-[0.15em] mb-5 font-luxury-body">
                        {property.bedrooms !== null && (
                          <span>{property.bedrooms} Beds</span>
                        )}
                        {property.bathrooms !== null && (
                          <>
                            <span className="w-px h-3 bg-[var(--color-sand)]" />
                            <span>{property.bathrooms} Baths</span>
                          </>
                        )}
                        {property.square_feet !== null && (
                          <>
                            <span className="w-px h-3 bg-[var(--color-sand)]" />
                            <span>{property.square_feet.toLocaleString()} Sq Ft</span>
                          </>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/listings/${property.id}`}
                        className="group/cta inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
                      >
                        <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover/cta:border-[var(--color-gold)] transition-colors duration-500">
                          Discover
                        </span>
                        <svg className="w-4 h-4 transform group-hover/cta:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center justify-between mt-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    canScrollLeft
                      ? 'border-[var(--color-charcoal)] text-[var(--color-charcoal)]'
                      : 'border-[var(--color-taupe)] text-[var(--color-taupe)] cursor-not-allowed'
                  }`}
                  aria-label="Previous"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    canScrollRight
                      ? 'border-[var(--color-charcoal)] text-[var(--color-charcoal)]'
                      : 'border-[var(--color-taupe)] text-[var(--color-taupe)] cursor-not-allowed'
                  }`}
                  aria-label="Next"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <Link
                href="/listings"
                className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
              >
                <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                  View All
                </span>
                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
