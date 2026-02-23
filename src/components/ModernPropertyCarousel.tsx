'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[] | null;
  mls_number?: string;
}

interface ModernPropertyCarouselProps {
  cities?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function ModernPropertyCarousel({
  cities,
  title = 'Featured Properties',
  subtitle = 'A curated selection of exceptional residences',
  limit = 8,
}: ModernPropertyCarouselProps) {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return; // Wait until content is rendered with sectionRef

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const cityParam = cities?.length
          ? `cities=${encodeURIComponent(cities.join(','))}`
          : `city=${encodeURIComponent('Aspen')}`;
        const response = await fetch(`/api/featured-properties?${cityParam}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [cities, limit]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[350px] h-[500px] bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-white overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div
          className={`flex flex-col md:flex-row md:items-end md:justify-between gap-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-4">
              Collection
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[var(--modern-gray-light)] mt-4 text-base md:text-lg font-light">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 border border-[var(--modern-black)]/20 text-[var(--modern-black)] flex items-center justify-center hover:bg-[var(--modern-black)] hover:text-white transition-all duration-300"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 border border-[var(--modern-black)]/20 text-[var(--modern-black)] flex items-center justify-center hover:bg-[var(--modern-black)] hover:text-white transition-all duration-300"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className={`flex gap-6 overflow-x-auto scrollbar-hide px-6 lg:px-8 pb-4 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {properties.map((property, index) => (
          <Link
            key={property.id}
            href={getListingHref(property)}
            className="group min-w-[320px] md:min-w-[380px] flex-shrink-0 bg-white border border-[var(--modern-gray-lighter)] hover:border-[var(--modern-gold)] transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
              <Image
                src={property.photos?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'}
                alt={property.address || 'Property'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 320px, 380px"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-[var(--modern-gold)]/10 transition-all duration-500" />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Price */}
              <div className="text-[var(--modern-gold)] text-lg font-light tracking-wider mb-3">
                {formatPrice(property.list_price)}
              </div>

              {/* Address */}
              <h3 className="text-[var(--modern-black)] text-lg font-normal tracking-wide mb-1 line-clamp-1">
                {property.address}
              </h3>
              <p className="text-[var(--modern-gray-light)] text-xs uppercase tracking-[0.15em] mb-4">
                {property.city}{property.state ? `, ${property.state}` : ''}
              </p>

              {/* Stats */}
              <div className="flex gap-4 text-[var(--modern-gray)] text-sm pt-4 border-t border-[var(--modern-gray-lighter)]">
                {property.bedrooms !== null && <span>{property.bedrooms} Beds</span>}
                {property.bathrooms !== null && (
                  <>
                    <span className="text-[var(--modern-gray-light)]">|</span>
                    <span>{property.bathrooms} Baths</span>
                  </>
                )}
                {property.square_feet !== null && (
                  <>
                    <span className="text-[var(--modern-gray-light)]">|</span>
                    <span>{property.square_feet?.toLocaleString()} SF</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div
        className={`max-w-7xl mx-auto px-6 lg:px-8 mt-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 group text-[var(--modern-gray)] hover:text-[var(--modern-gold)] transition-colors duration-300 text-sm uppercase tracking-[0.2em]"
        >
          <span>View All Properties</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
