'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface Property {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  listing_date: string | null;
  photos: string[];
}

interface ModernNewestListingsProps {
  cities?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function ModernNewestListings({
  cities,
  title = 'Newest to Market',
  subtitle = 'The latest properties available in our markets',
  limit = 8,
}: ModernNewestListingsProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;

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
        const cityParam = (cities && cities.length > 0)
          ? cities.length > 1
            ? `cities=${encodeURIComponent(cities.join(','))}`
            : `city=${encodeURIComponent(cities[0])}`
          : `city=${encodeURIComponent('Aspen')}`;

        const response = await fetch(`/api/featured-properties?${cityParam}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error('Error fetching newest listings:', error);
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

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isNewListing = (listingDate: string | null) => {
    if (!listingDate) return false;
    const date = new Date(listingDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  };

  const getStreetAddress = (fullAddress: string | null, city: string | null, state: string | null, zipCode: string | null): string => {
    if (!fullAddress) return 'Address not available';
    let street = fullAddress;
    if (zipCode) street = street.replace(new RegExp(`\\s*,?\\s*${zipCode}\\s*$`), '');
    if (state) street = street.replace(new RegExp(`\\s*,?\\s*${state}\\s*$`, 'i'), '');
    if (city) street = street.replace(new RegExp(`\\s*,?\\s*${city}\\s*$`, 'i'), '');
    return street.trim() || 'Address not available';
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
              Just Listed
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
        className={`flex gap-6 overflow-x-auto px-6 lg:px-8 pb-4 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {properties.map((property, index) => (
          <Link
            key={property.id}
            href={getListingHref(property)}
            className="group w-[320px] md:w-[380px] flex-shrink-0 bg-white border border-[var(--modern-gray-lighter)] hover:border-[var(--modern-gold)] transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--modern-gray-lighter)]">
              {property.photos?.[0] ? (
                <Image
                  src={property.photos[0]}
                  alt={property.address || 'Property'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 320px, 380px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--modern-gray-light)]">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-[var(--modern-gold)]/10 transition-all duration-500" />

              {/* New badge */}
              {isNewListing(property.listing_date) && (
                <div className="absolute top-3 left-3 bg-[var(--modern-gold)] text-white text-[10px] uppercase tracking-[0.15em] px-3 py-1.5">
                  New
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-4 py-3">
              {/* Price */}
              <div className="text-[var(--modern-gold)] text-xl font-light tracking-wider mb-1">
                {formatPrice(property.list_price)}
              </div>

              {/* Address */}
              <p className="text-[var(--modern-black)] text-[11px] uppercase tracking-[0.15em] truncate">
                {getStreetAddress(property.address, property.city, property.state, property.zip_code)}
              </p>
              <p className="text-[var(--modern-gray-light)] text-[11px] uppercase tracking-[0.15em] mb-2">
                {[property.city, property.state].filter(Boolean).join(', ')}
              </p>

              {/* Stats */}
              <div className="flex gap-3 text-[var(--modern-gray)] text-xs pt-2 border-t border-[var(--modern-gray-lighter)]">
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
