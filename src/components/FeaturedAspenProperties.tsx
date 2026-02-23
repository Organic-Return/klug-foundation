'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface FeaturedAspenPropertiesProps {
  cities?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
  buttonText?: string;
}

export default function FeaturedAspenProperties({
  cities = ['Aspen'],
  title = 'Newest in Aspen',
  subtitle = 'Explore our latest luxury listings',
  limit = 8,
  buttonText = 'View All Properties',
}: FeaturedAspenPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Fetch properties on mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        // Use cities parameter if multiple, or city parameter for single
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

  const goToSlide = useCallback((index: number) => {
    if (properties.length === 0) return;
    // Wrap around
    if (index < 0) index = properties.length - 1;
    if (index >= properties.length) index = 0;
    setActiveIndex(index);
  }, [properties.length]);

  const handlePrev = () => goToSlide(activeIndex - 1);
  const handleNext = () => goToSlide(activeIndex + 1);

  // Handle drag/swipe
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStart - clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, properties.length]);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  // Build the listings link - if single city, filter by that city
  const listingsHref = cities.length === 1
    ? `/listings?city=${encodeURIComponent(cities[0])}`
    : '/listings';

  return (
    <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414] overflow-hidden w-full">
      <div className="w-full px-6 md:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide">{title}</h2>
          <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white shadow-lg rounded-full transition-all duration-300 hover:scale-110 -ml-6"
            aria-label="Previous property"
          >
            <svg className="w-6 h-6 text-[var(--color-charcoal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white shadow-lg rounded-full transition-all duration-300 hover:scale-110 -mr-6"
            aria-label="Next property"
          >
            <svg className="w-6 h-6 text-[var(--color-charcoal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Cards Container */}
          <div className="relative h-[320px] sm:h-[380px] md:h-[450px] lg:h-[520px] py-6 select-none">
            {properties.map((property, index) => {
              const isActive = index === activeIndex;
              const isPrev = index === (activeIndex - 1 + properties.length) % properties.length;
              const isNext = index === (activeIndex + 1) % properties.length;
              const isVisible = isActive || isPrev || isNext;

              // Calculate position and styling based on position relative to active
              let translateX = '0%';
              let scale = 0.75;
              let opacity = 0;
              let zIndex = 0;

              if (isActive) {
                translateX = '-50%'; // Center the card
                scale = 1;
                opacity = 1;
                zIndex = 10;
              } else if (isPrev) {
                translateX = '-150%'; // Position to the left
                scale = 0.8;
                opacity = 0.5;
                zIndex = 5;
              } else if (isNext) {
                translateX = '50%'; // Position to the right
                scale = 0.8;
                opacity = 0.5;
                zIndex = 5;
              }

              if (!isVisible) {
                return null;
              }

              const photo = property.photos?.[0] || null;

              return (
                <div
                  key={property.id}
                  className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    transform: `translateX(${translateX}) translateY(-50%) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                  }}
                  onClick={() => !isActive && goToSlide(index)}
                >
                  <div
                    className={`relative w-[320px] sm:w-[400px] md:w-[500px] lg:w-[600px] aspect-[4/3] overflow-hidden shadow-2xl transition-all duration-500 ${
                      isActive ? 'ring-2 ring-[var(--color-gold)]' : ''
                    }`}
                  >
                    {/* Background Image */}
                    {photo ? (
                      <Image
                        src={photo}
                        alt={property.address || 'Property'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 320px, (max-width: 768px) 400px, (max-width: 1024px) 500px, 600px"
                        priority={isActive}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      {/* Price Tag */}
                      <div className="mb-3">
                        <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                          {property.city}
                        </span>
                      </div>

                      {/* Price */}
                      <h3 className="text-2xl sm:text-3xl font-serif font-light mb-2">
                        {formatPrice(property.list_price)}
                      </h3>

                      {/* Address */}
                      <p className="text-white/80 text-sm mb-4 line-clamp-2">
                        {property.address}
                      </p>

                      {/* Property Details */}
                      <div className="flex gap-4 text-xs text-white/70 mb-5">
                        {property.bedrooms !== null && (
                          <span>{property.bedrooms} Beds</span>
                        )}
                        {property.bathrooms !== null && (
                          <span>{property.bathrooms} Baths</span>
                        )}
                        {property.square_feet && (
                          <span>{property.square_feet.toLocaleString()} Sq Ft</span>
                        )}
                      </div>

                      {/* CTA Button - Only show on active card */}
                      {isActive && (
                        <Link
                          href={getListingHref(property)}
                          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-5 py-2.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-white w-fit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Property
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-6">
            {properties.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'bg-[var(--color-gold)] w-8'
                    : 'bg-[var(--color-charcoal)]/30 hover:bg-[var(--color-charcoal)]/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-10 max-w-7xl mx-auto">
          <Link
            href={listingsHref}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-8 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a] dark:hover:border-white dark:hover:text-white"
          >
            {buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
