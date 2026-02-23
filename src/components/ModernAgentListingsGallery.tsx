'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  list_price: number;
  sold_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
  status: string;
}

interface ModernAgentListingsGalleryProps {
  agentMlsId: string;
  title?: string;
  subtitle?: string;
}

export default function ModernAgentListingsGallery({
  agentMlsId,
  title = 'Our Listings',
  subtitle = 'Properties represented by our team',
}: ModernAgentListingsGalleryProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    async function fetchListings() {
      try {
        const response = await fetch(
          `/api/agent-listings?agentId=${encodeURIComponent(agentMlsId)}&status=all&limit=50`
        );
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
        }
      } catch (error) {
        console.error('Error fetching agent listings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (agentMlsId) {
      fetchListings();
    }
  }, [agentMlsId]);

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
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] bg-[var(--modern-gray-lighter)]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-4">
            Portfolio
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--modern-gray-light)] mt-4 text-base md:text-lg font-light max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Listings Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={getListingHref(listing)}
              className="group border border-[var(--modern-gray-lighter)] hover:border-[var(--modern-gold)] transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--modern-gray-lighter)]">
                {listing.photos?.[0] ? (
                  <Image
                    src={listing.photos[0]}
                    alt={listing.address || 'Property'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--modern-gray-light)] text-sm">
                    No Photo
                  </div>
                )}
                {listing.status === 'Closed' && (
                  <div className="absolute top-3 left-3 bg-[var(--modern-black)]/80 text-white text-[10px] uppercase tracking-[0.15em] px-3 py-1">
                    Sold
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Price */}
                <div className="text-[var(--modern-gold)] text-lg font-light tracking-wider mb-2">
                  {listing.status === 'Closed' && listing.sold_price
                    ? formatPrice(listing.sold_price)
                    : formatPrice(listing.list_price)}
                </div>

                {/* Address */}
                <h3 className="text-[var(--modern-black)] text-base font-normal tracking-wide mb-1 line-clamp-1">
                  {listing.address}
                </h3>
                <p className="text-[var(--modern-gray-light)] text-xs uppercase tracking-[0.15em] mb-4">
                  {listing.city}{listing.state ? `, ${listing.state}` : ''}
                </p>

                {/* Stats */}
                <div className="flex gap-4 text-[var(--modern-gray)] text-sm pt-3 border-t border-[var(--modern-gray-lighter)]">
                  {listing.bedrooms !== null && <span>{listing.bedrooms} Beds</span>}
                  {listing.bathrooms !== null && (
                    <>
                      <span className="text-[var(--modern-gray-light)]">|</span>
                      <span>{listing.bathrooms} Baths</span>
                    </>
                  )}
                  {listing.square_feet !== null && (
                    <>
                      <span className="text-[var(--modern-gray-light)]">|</span>
                      <span>{listing.square_feet?.toLocaleString()} SF</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div
          className={`text-center mt-12 transition-all duration-1000 delay-400 ${
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
      </div>
    </section>
  );
}
