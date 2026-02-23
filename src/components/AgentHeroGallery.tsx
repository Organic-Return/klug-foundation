'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface HeroListing {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
}

interface AgentHeroGalleryProps {
  listings: HeroListing[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Left arrow — triangle points left (same as home hero)
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right (same as home hero)
function NextArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M-0.00140381 172.407L86 86.4058L-0.00141885 0.404426L-0.00140381 172.407Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M86 86.4058L86.7071 87.1129L87.4142 86.4058L86.7071 85.6987L86 86.4058ZM-0.00140381 172.407L-1.0014 172.407L-1.0014 174.821L0.705704 173.114L-0.00140381 172.407ZM-0.00141885 0.404426L0.705689 -0.302681L-1.00142 -2.00979L-1.00142 0.404427L-0.00141885 0.404426ZM85.2929 85.6987L-0.708511 171.7L0.705704 173.114L86.7071 87.1129L85.2929 85.6987ZM-0.708526 1.11153L85.2929 87.1129L86.7071 85.6987L0.705689 -0.302681L-0.708526 1.11153ZM-1.00142 0.404427L-1.0014 172.407L0.998596 172.407L0.998581 0.404426L-1.00142 0.404427Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.2656 87.1572H20.2656L20.2656 85.6572H28.2656L62.3931 85.6572L49.2081 72.4647L50.2656 71.4072L64.5156 85.6572H70.3931L57.2081 72.4647L58.2656 71.4072L73.2656 86.4072L58.2656 101.407L57.2006 100.35L70.3931 87.1572H64.5156L50.2656 101.407L49.2006 100.35L62.3931 87.1572L28.2656 87.1572Z" fill="#002349"/>
    </svg>
  );
}

export default function AgentHeroGallery({ listings }: AgentHeroGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    if (listings.length === 0) return;
    if (index < 0) index = listings.length - 1;
    if (index >= listings.length) index = 0;
    setActiveIndex(index);
  }, [listings.length]);

  const handlePrev = () => goToSlide(activeIndex - 1);
  const handleNext = () => goToSlide(activeIndex + 1);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (listings.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide(activeIndex + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeIndex, listings.length, goToSlide]);

  const currentListing = listings[activeIndex] || null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '70vh', minHeight: '400px', maxHeight: '700px' }}>
      {/* Property Images — crossfade slideshow */}
      {listings.map((listing, index) => {
        const photo = listing.photos?.[0] || null;
        return (
          <div
            key={listing.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {photo ? (
              <Image
                src={photo}
                alt={listing.address || 'Property'}
                fill
                className="object-cover"
                sizes="100vw"
                quality={90}
                priority={index === 0}
              />
            ) : (
              <div className="w-full h-full bg-[var(--rc-navy)]" />
            )}
          </div>
        );
      })}

      {/* Signature Triangular Arrows */}
      {listings.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
            aria-label="Previous property"
          >
            <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
              <PrevArrow />
            </div>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
            aria-label="Next property"
          >
            <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
              <NextArrow />
            </div>
          </button>
        </>
      )}

      {/* Property Info Card — bottom right */}
      {currentListing && (
        <Link
          href={getListingHref(currentListing)}
          className="absolute bottom-8 md:bottom-12 right-4 md:right-8 lg:right-12 z-20 bg-white/95 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 shadow-lg hover:bg-white transition-colors duration-200 max-w-[280px] md:max-w-sm md:w-[380px] hidden sm:block"
        >
          {/* Diamond plus icon */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 bg-white border border-[var(--rc-gold)]/40 rotate-45 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-[var(--rc-navy)] -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[var(--rc-navy)] text-xl md:text-2xl font-light tracking-wide">
                {formatPrice(currentListing.list_price)}
              </div>
              <div className="text-[var(--rc-brown)] text-xs uppercase tracking-[0.15em] mt-0.5">
                {currentListing.city}{currentListing.state ? `, ${currentListing.state}` : ''}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col gap-1 text-[var(--rc-brown)] text-xs border-l border-gray-200 pl-4">
              {currentListing.bedrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span>{currentListing.bedrooms}</span>
                </div>
              )}
              {currentListing.bathrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{currentListing.bathrooms}</span>
                </div>
              )}
              {currentListing.square_feet && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span>{currentListing.square_feet.toLocaleString()} SQ FT</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Bottom gradient with slide indicators */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-16 pb-6">
          {listings.length > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {listings.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-0.5 transition-all duration-300 ${
                    i === activeIndex ? 'w-8 bg-[var(--rc-gold)]' : 'w-4 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
