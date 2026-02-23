'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface ModernFeaturedPropertyProps {
  mlsId?: string;
  agentMlsId?: string;
  headline?: string;
  buttonText?: string;
}

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
}

export default function ModernFeaturedProperty({
  mlsId,
  agentMlsId,
  headline = 'Featured Residence',
  buttonText = 'View Property',
}: ModernFeaturedPropertyProps) {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (agentMlsId) {
          // Gallery mode: fetch agent's active listings
          const response = await fetch(
            `/api/agent-listings?agentId=${encodeURIComponent(agentMlsId)}&status=active&limit=12`
          );
          if (response.ok) {
            const data = await response.json();
            const listings = (data.listings || []) as PropertyData[];
            listings.sort((a, b) => (b.list_price || 0) - (a.list_price || 0));
            setProperties(listings);
          }
        } else if (mlsId) {
          // Single mode: fetch one listing by MLS ID
          const response = await fetch(`/api/listings/${mlsId}`);
          if (response.ok) {
            const data = await response.json();
            if (data) {
              setProperties([{
                id: data.id,
                address: data.address,
                city: data.city,
                state: data.state,
                list_price: data.list_price ?? data.price ?? 0,
                bedrooms: data.bedrooms ?? data.beds ?? null,
                bathrooms: data.bathrooms ?? data.baths ?? null,
                square_feet: data.square_feet ?? data.sqft ?? null,
                photos: data.photos || data.images || [],
              }]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mlsId, agentMlsId]);

  const hasMultiple = properties.length > 1;
  const property = properties[activeIndex];

  const goTo = (index: number) => {
    if (index >= properties.length) {
      setActiveIndex(0);
    } else if (index < 0) {
      setActiveIndex(properties.length - 1);
    } else {
      setActiveIndex(index);
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
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-[600px] bg-[var(--modern-gray-lighter)] rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!property) {
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
            Exclusive
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)]">
            {headline}
          </h2>
        </div>

        {/* Property Card */}
        <div
          className={`grid lg:grid-cols-2 gap-0 overflow-hidden border border-[var(--modern-gray-lighter)] transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
            <Image
              src={property.photos?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'}
              alt={property.address || 'Property'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Gold corner accent */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-[var(--modern-gold)]" />
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            {/* Price */}
            <div className="text-[var(--modern-gold)] text-2xl md:text-3xl font-light tracking-wider mb-4">
              {formatPrice(property.list_price)}
            </div>

            {/* Address */}
            <h3 className="text-[var(--modern-black)] text-xl md:text-2xl font-light mb-2 tracking-wide">
              {property.address}
            </h3>
            <p className="text-[var(--modern-gray-light)] text-sm uppercase tracking-[0.2em] mb-8">
              {property.city}, {property.state}
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10 pb-10 border-b border-[var(--modern-gray-lighter)]">
              {property.bedrooms !== null && (
                <div>
                  <span className="block text-2xl text-[var(--modern-black)] font-light">{property.bedrooms}</span>
                  <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Bedrooms</span>
                </div>
              )}
              {property.bathrooms !== null && (
                <div>
                  <span className="block text-2xl text-[var(--modern-black)] font-light">{property.bathrooms}</span>
                  <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Bathrooms</span>
                </div>
              )}
              {property.square_feet !== null && (
                <div>
                  <span className="block text-2xl text-[var(--modern-black)] font-light">{property.square_feet?.toLocaleString()}</span>
                  <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Sq. Ft.</span>
                </div>
              )}
            </div>

            {/* CTA + Navigation */}
            <div className="flex items-center justify-between">
              <Link
                href={getListingHref(property)}
                className="btn-modern-outline inline-flex items-center gap-3 self-start group"
              >
                <span>{buttonText}</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {hasMultiple && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => goTo(activeIndex - 1)}
                    className="w-10 h-10 border border-[var(--modern-gray-lighter)] text-[var(--modern-gray)] flex items-center justify-center hover:border-[var(--modern-gold)] hover:text-[var(--modern-gold)] transition-all duration-300"
                    aria-label="Previous property"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-[var(--modern-gray-light)] tracking-wider">
                    {activeIndex + 1} / {properties.length}
                  </span>
                  <button
                    onClick={() => goTo(activeIndex + 1)}
                    className="w-10 h-10 border border-[var(--modern-gray-lighter)] text-[var(--modern-gray)] flex items-center justify-center hover:border-[var(--modern-gold)] hover:text-[var(--modern-gold)] transition-all duration-300"
                    aria-label="Next property"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
