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
  zip_code: string | null;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
  mls_number: string;
  status: string;
  property_type: string;
}

function getStreetAddress(fullAddress: string | null, city: string | null, state: string | null, zipCode: string | null): string {
  if (!fullAddress) return 'Address not available';
  let streetAddress = fullAddress;
  if (zipCode) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${zipCode}\\s*$`), '');
  }
  if (state) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${state}\\s*$`, 'i'), '');
  }
  if (city) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${city}\\s*$`, 'i'), '');
  }
  return streetAddress.trim() || 'Address not available';
}

interface LuxuryFeaturedPropertyProps {
  mlsId?: string;
  agentMlsId?: string;
  title?: string;
  headline?: string;
  buttonText?: string;
}

export default function LuxuryFeaturedProperty({
  mlsId,
  agentMlsId: agentMlsIdProp,
  title: titleProp,
  headline: headlineProp,
  buttonText: buttonTextProp,
}: LuxuryFeaturedPropertyProps) {
  const title = titleProp || 'Our Featured Properties';
  const headline = headlineProp || 'Featured Residence';
  const buttonText = buttonTextProp || 'Discover';
  const agentMlsId = agentMlsIdProp || null;

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Gallery mode: fetch agent's active listings
  // Single mode: fetch one listing by MLS ID
  useEffect(() => {
    async function fetchData() {
      try {
        if (agentMlsId) {
          const response = await fetch(`/api/agent-listings?agentId=${encodeURIComponent(agentMlsId)}&status=active&limit=12`);
          if (response.ok) {
            const data = await response.json();
            const listings = (data.listings || []) as Property[];
            listings.sort((a, b) => (b.list_price || 0) - (a.list_price || 0));
            setProperties(listings);
          }
        } else if (mlsId) {
          const response = await fetch(`/api/listings/${mlsId}`);
          if (response.ok) {
            const data = await response.json();
            setProperties(data ? [data] : []);
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [mlsId, agentMlsId]);

  const hasMultiple = properties.length > 1;

  const goTo = (index: number) => {
    if (index >= properties.length) {
      setActiveIndex(0);
    } else if (index < 0) {
      setActiveIndex(properties.length - 1);
    } else {
      setActiveIndex(index);
    }
  };

  if (isLoading || properties.length === 0) {
    return null;
  }

  return (
    <section className="pt-12 md:pt-16 lg:pt-20 pb-6 md:pb-8 lg:pb-10 bg-[var(--color-cream)]">
      {/* Section Title */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 mb-10 md:mb-14">
        <p className="text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] font-light mb-4 font-luxury-body">
          {headline}
        </p>
        <h2 className="text-[var(--color-charcoal)] text-2xl md:text-3xl lg:text-[2.5rem] font-light tracking-[0.04em] leading-[1.2] font-luxury">
          {title}
        </h2>
      </div>

      {/* Property Card — one at a time, 16:9 */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <PropertyCard
          property={properties[activeIndex]}
          buttonText={buttonText}
          hasMultiple={hasMultiple}
          activeIndex={activeIndex}
          total={properties.length}
          onPrev={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
        />
      </div>
    </section>
  );
}

function PropertyCard({
  property,
  buttonText,
  hasMultiple,
  activeIndex,
  total,
  onPrev,
  onNext,
}: {
  property: Property;
  buttonText: string;
  hasMultiple: boolean;
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const mainPhoto = property.photos?.[0];
  const streetAddress = getStreetAddress(property.address, property.city, property.state, property.zip_code);

  return (
    <div className="relative">
      <Link href={`/listings/${property.id}`} className="block group">
        <div className="relative overflow-hidden rounded-sm aspect-[16/9] lg:aspect-[21/9]">
          {mainPhoto ? (
            <Image
              src={mainPhoto}
              alt={property.address}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1800px) 90vw, 1800px"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--color-charcoal)]" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

          {/* Content Overlay — centered */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14 flex flex-col items-center text-center">
            <h3 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.02em] leading-[1.1] mb-2 font-luxury">
              {streetAddress}
            </h3>
            <p className="text-white/80 text-sm md:text-base font-light tracking-wide mb-5 font-luxury-body">
              {[property.city, property.state].filter(Boolean).join(', ')}{property.zip_code ? ` ${property.zip_code}` : ''}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-5">
              <span className="text-white text-xl md:text-2xl font-light tracking-wide font-luxury">
                {formatPrice(property.list_price)}
              </span>
              <span className="hidden sm:block w-px h-6 bg-white/30" />
              <div className="flex items-center gap-4 md:gap-6 text-white/80 text-[11px] uppercase tracking-[0.15em] font-light">
                {property.bedrooms !== null && <span>{property.bedrooms} Beds</span>}
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

            <span className="inline-flex items-center gap-4 font-luxury-body text-white text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500">
              <span className="border-b border-white/30 pb-1 group-hover:border-white transition-colors duration-500">
                {buttonText}
              </span>
              <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation — bottom right of image */}
      {hasMultiple && (
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 flex items-center gap-3 z-10">
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-full border border-white/70 text-white hover:bg-white/20 flex items-center justify-center transition-all duration-300"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white/80 text-xs tracking-[0.15em] uppercase font-light font-luxury-body">
            {activeIndex + 1} / {total}
          </span>
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full border border-white/70 text-white hover:bg-white/20 flex items-center justify-center transition-all duration-300"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
