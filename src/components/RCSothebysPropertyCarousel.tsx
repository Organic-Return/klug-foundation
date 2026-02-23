'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref } from '@/lib/listings';

interface Property {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[] | null;
  mls_number: string;
  open_house_date: string | null;
  open_house_start_time: string | null;
  open_house_end_time: string | null;
}

interface RCSothebysPropertyCarouselProps {
  cities?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
  buttonText?: string;
  officeName?: string;
  minPrice?: number;
  sortBy?: 'date' | 'price';
  initialProperties?: Property[];
}

// Tiny 4x3 neutral blur placeholder for property images
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAADAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AhgA//9k=';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatOpenHouse(property: Property): string | null {
  if (!property.open_house_date) return null;
  const ohDate = new Date(property.open_house_date + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (ohDate < now) return null;
  const day = ohDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (property.open_house_start_time) {
    const startParts = property.open_house_start_time.split(':');
    const startH = parseInt(startParts[0], 10);
    const startM = startParts[1] || '00';
    const startAmPm = startH >= 12 ? 'PM' : 'AM';
    const startHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
    return `Open House ${day} at ${startHour}:${startM} ${startAmPm}`;
  }
  return `Open House ${day}`;
}

// Left arrow — triangle points left, internal arrows point left
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right, internal arrows point right
function NextArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M-0.00140381 172.407L86 86.4058L-0.00141885 0.404426L-0.00140381 172.407Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M86 86.4058L86.7071 87.1129L87.4142 86.4058L86.7071 85.6987L86 86.4058ZM-0.00140381 172.407L-1.0014 172.407L-1.0014 174.821L0.705704 173.114L-0.00140381 172.407ZM-0.00141885 0.404426L0.705689 -0.302681L-1.00142 -2.00979L-1.00142 0.404427L-0.00141885 0.404426ZM85.2929 85.6987L-0.708511 171.7L0.705704 173.114L86.7071 87.1129L85.2929 85.6987ZM-0.708526 1.11153L85.2929 87.1129L86.7071 85.6987L0.705689 -0.302681L-0.708526 1.11153ZM-1.00142 0.404427L-1.0014 172.407L0.998596 172.407L0.998581 0.404426L-1.00142 0.404427Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.2656 87.1572H20.2656L20.2656 85.6572H28.2656L62.3931 85.6572L49.2081 72.4647L50.2656 71.4072L64.5156 85.6572H70.3931L57.2081 72.4647L58.2656 71.4072L73.2656 86.4072L58.2656 101.407L57.2006 100.35L70.3931 87.1572H64.5156L50.2656 101.407L49.2006 100.35L62.3931 87.1572L28.2656 87.1572Z" fill="#002349"/>
    </svg>
  );
}

export default function RCSothebysPropertyCarousel({
  cities,
  title = 'Featured Listings',
  subtitle,
  limit = 8,
  buttonText = 'View All Properties',
  officeName,
  minPrice,
  sortBy,
  initialProperties,
}: RCSothebysPropertyCarouselProps) {
  const resolvedCities = cities || ['Aspen'];
  const hasInitial = initialProperties && initialProperties.length > 0;

  const [properties, setProperties] = useState<Property[]>(hasInitial ? initialProperties : []);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isSwiping = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (hasInitial) return; // Skip fetch when server-provided data exists
    async function fetchProperties() {
      try {
        const citiesParam = resolvedCities.length > 1
          ? `cities=${encodeURIComponent(resolvedCities.join(','))}`
          : `city=${encodeURIComponent(resolvedCities[0] || 'Aspen')}`;
        const officeParam = officeName
          ? `&officeName=${encodeURIComponent(officeName)}`
          : '';
        const minPriceParam = minPrice
          ? `&minPrice=${minPrice}`
          : '';
        const sortByParam = sortBy
          ? `&sortBy=${sortBy}`
          : '';
        const response = await fetch(`/api/featured-properties?${citiesParam}&limit=${limit}${officeParam}${minPriceParam}${sortByParam}`);
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, [resolvedCities, limit, officeName, minPrice, sortBy]);

  const goToSlide = useCallback((index: number) => {
    if (properties.length === 0) return;
    if (index < 0) index = properties.length - 1;
    if (index >= properties.length) index = 0;
    setActiveIndex(index);
  }, [properties.length]);

  const handlePrev = () => goToSlide(activeIndex - 1);
  const handleNext = () => goToSlide(activeIndex + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwiping.current = true;
    isHorizontalSwipe.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizontalSwipe.current) {
      // Prevent vertical scroll during horizontal swipe
      e.preventDefault();
      touchDeltaX.current = dx;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchDeltaX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();  // swiped left → next
      else handlePrev();            // swiped right → prev
    }
    isHorizontalSwipe.current = null;
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchDeltaX.current = 0;
    isSwiping.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - e.clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

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
      <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-[var(--rc-brown)]/10 rounded w-64 mx-auto mb-4" />
              <div className="h-[400px] bg-[var(--rc-brown)]/10 rounded mx-auto mt-8" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) return null;

  const listingsHref = resolvedCities.length === 1
    ? `/listings?city=${encodeURIComponent(resolvedCities[0])}`
    : '/listings';

  return (
    <section className="py-16 md:py-24 bg-[var(--rc-cream)] overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-6 md:mb-8 max-w-7xl mx-auto px-6">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-4"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[var(--rc-brown)] text-base md:text-lg font-normal max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Numbered Pagination — above carousel (desktop only) */}
      <div className="hidden md:flex justify-center items-center gap-1 mb-6 flex-wrap px-4">
        {properties.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`px-2 py-1 text-sm transition-all duration-300 ${
              index === activeIndex
                ? 'text-[var(--rc-navy)] font-bold text-lg border-b-[3px] border-[var(--rc-navy)]'
                : 'text-[var(--rc-brown)]/50 hover:text-[var(--rc-navy)]'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* Full-width Carousel — center mode with adjacent card peeks */}
      <div
        className="relative max-w-[1800px] mx-auto"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isSwiping.current = false; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cards Track */}
        <div className="overflow-hidden select-none">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: isMobile
                ? `translateX(-${activeIndex * 100}%)`
                : `translateX(calc(-${activeIndex * 60}% + 20%))`,
            }}
          >
            {properties.map((property, index) => {
              const isActive = index === activeIndex;
              const photo = property.photos?.[0] || null;
              // Only render images for slides within ±2 of active (handles wrapping)
              const dist = Math.min(
                Math.abs(index - activeIndex),
                properties.length - Math.abs(index - activeIndex)
              );
              const shouldRenderImage = dist <= 2;

              return (
                <div
                  key={property.id}
                  className="flex-shrink-0 px-4 md:px-10 transition-opacity duration-500 cursor-pointer w-full md:w-[60%]"
                  onClick={() => !isActive && goToSlide(index)}
                >
                  <div
                    className={`bg-white overflow-hidden transition-all duration-500 ${
                      isActive
                        ? 'border-2 border-[var(--rc-gold)] shadow-lg opacity-100'
                        : isMobile
                          ? 'border-2 border-[var(--rc-gold)] shadow-lg opacity-100'
                          : 'border border-gray-200 opacity-50'
                    }`}
                  >
                    {/* Photo */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {shouldRenderImage && photo ? (
                        <Image
                          src={photo}
                          alt={property.address || 'Property'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={isActive ? 90 : 75}
                          priority={index < 3}
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}

                      {/* Open House Badge */}
                      {(() => {
                        const oh = formatOpenHouse(property);
                        return oh ? (
                          <div className="absolute bottom-4 right-4 z-10 bg-[var(--rc-navy)] text-white text-[10px] md:text-[11px] font-medium px-3 py-2 uppercase tracking-[0.1em]">
                            Open House
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Property Info */}
                    <div className="px-5 py-4 md:px-6 md:py-5 text-center">
                      <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 flex-wrap">
                        <span className="text-[var(--rc-navy)] text-xl md:text-2xl font-light tracking-wide">
                          {formatPrice(property.list_price)}
                        </span>
                        <span className="text-[var(--rc-brown)]/30">|</span>
                        <div className="flex items-center gap-3 text-[var(--rc-brown)] text-sm">
                          {property.bedrooms !== null && (
                            <span>{property.bedrooms} BD</span>
                          )}
                          {property.bathrooms !== null && (
                            <span>{property.bathrooms} BA</span>
                          )}
                          {property.square_feet && (
                            <span>{property.square_feet.toLocaleString()} SF</span>
                          )}
                        </div>
                      </div>

                      <div className="text-[var(--rc-brown)] text-sm uppercase tracking-wider line-clamp-1">
                        {property.address}, {property.city}
                      </div>

                      {property.mls_number && (
                        <div className="text-[var(--rc-brown)]/50 text-xs mt-1 md:hidden">
                          MLS Number: {property.mls_number}
                        </div>
                      )}

                      {/* View Property Button */}
                      {(isActive || isMobile) && (
                        <Link
                          href={getListingHref(property)}
                          className="group inline-flex items-center justify-center gap-3 mt-4 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--rc-gold)] text-white px-8 py-4 border border-[var(--rc-gold)] hover:bg-transparent hover:border-[var(--rc-navy)] hover:text-[var(--rc-navy)] w-full md:w-auto"
                        >
                          View Property
                          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prev Arrow — desktop only */}
        <button
          onClick={handlePrev}
          className="absolute z-20 top-[42%] -translate-y-1/2 hover:scale-105 transition-transform duration-200 hidden md:block"
          style={{ left: 'calc(20% - 12px)', }}
          aria-label="Previous property"
        >
          <div className="md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
            <PrevArrow />
          </div>
        </button>

        {/* Next Arrow — desktop only */}
        <button
          onClick={handleNext}
          className="absolute z-20 top-[42%] -translate-y-1/2 hover:scale-105 transition-transform duration-200 hidden md:block"
          style={{ right: 'calc(20% - 12px)', }}
          aria-label="Next property"
        >
          <div className="md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
            <NextArrow />
          </div>
        </button>
      </div>

      {/* Dot Pagination — mobile only */}
      <div className="flex md:hidden justify-center items-center gap-2 mt-6">
        {properties.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-2.5 h-2.5 bg-[var(--rc-navy)]'
                : 'w-2 h-2 bg-[var(--rc-brown)]/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-10 max-w-7xl mx-auto px-6">
        <Link
          href={listingsHref}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--rc-gold)] text-white px-8 py-4 border border-[var(--rc-gold)] hover:bg-transparent hover:border-[var(--rc-navy)] hover:text-[var(--rc-navy)]"
        >
          {buttonText}
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
