'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size_acres: number | null;
  photos: string[] | null;
  mls_number: string;
  open_house_date: string | null;
  open_house_start_time: string | null;
  open_house_end_time: string | null;
  status?: string;
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
}

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

// Left arrow — triangle points left
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right
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
  title = 'Listings',
  subtitle,
  limit = 8,
  buttonText = 'View All Properties',
  officeName,
  minPrice,
  sortBy,
}: RCSothebysPropertyCarouselProps) {
  const resolvedCities = cities || ['Aspen'];

  const [properties, setProperties] = useState<Property[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  useEffect(() => {
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
      <section className="pt-20 pb-28 bg-[var(--rc-cream)]">
        <div className="max-w-screen-xl w-full mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--rc-brown)]/10 rounded w-48 mb-8" />
            <div className="h-[400px] bg-[var(--rc-brown)]/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) return null;

  const listingsHref = resolvedCities.length === 1
    ? `/listings?city=${encodeURIComponent(resolvedCities[0])}`
    : '/listings';

  // Each slide takes 56% width; offset so active is centered
  const slideWidth = 56;
  const centerOffset = (100 - slideWidth) / 2;

  return (
    <section className="pt-20 pb-28 bg-[var(--rc-cream)] overflow-hidden flex flex-col">
      {/* Section Header — left aligned like reference */}
      <h2 className="max-w-screen-xl w-full mx-auto px-6 text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-8"
        style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
      >
        {title}
      </h2>

      {/* Center-mode Carousel */}
      <div
        className="relative"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {/* Prev Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20"
          aria-label="Previous property"
        >
          <div className="w-[24px] h-[48px] md:w-[36px] md:h-[72px] lg:w-[48px] lg:h-[96px]">
            <PrevArrow />
          </div>
        </button>

        {/* Cards Track */}
        <div className="overflow-hidden select-none" style={{ padding: '0 22%' }}>
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${activeIndex * slideWidth}% + ${centerOffset}%))`,
            }}
          >
            {properties.map((property, index) => {
              const isActive = index === activeIndex;
              const photo = property.photos?.[0] || null;
              const oh = formatOpenHouse(property);

              return (
                <div
                  key={property.id}
                  className={`flex-shrink-0 px-1 md:px-2 transition-all duration-500 cursor-pointer ${
                    isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
                  }`}
                  style={{ width: `${slideWidth}%` }}
                  onClick={() => !isActive && goToSlide(index)}
                >
                  <div className="bg-white overflow-hidden">
                    {/* Photo */}
                    <div className="relative">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={`${property.address}, ${property.city} ${property.state || ''}`}
                          width={1200}
                          height={800}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 80vw, 50vw"
                          quality={75}
                          priority={index < 3}
                        />
                      ) : (
                        <div className="aspect-[3/2] bg-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}

                      {/* Badges — open house / status */}
                      {(oh || (property.status && property.status !== 'Active')) && (
                        <div className="absolute top-0 left-0 z-10 bg-[var(--rc-gold)] text-white text-[10px] md:text-xs font-medium px-3 py-2 max-w-[80%] whitespace-pre-line leading-relaxed">
                          {oh && (
                            <div className="flex items-start gap-1">
                              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                                <path fill="none" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M80 464V68.14a8 8 0 014-6.9C91.81 56.66 112.92 48 160 48c64 0 145 48 192 48a199.53 199.53 0 0077.23-15.77 2 2 0 012.77 1.85v219.36a4 4 0 01-2.39 3.65C421.37 308.7 392.33 320 352 320c-48 0-128-32-192-32s-80 16-80 16" />
                              </svg>
                              <span>{oh}</span>
                            </div>
                          )}
                          {property.status && property.status !== 'Active' && (
                            <div className="flex items-start gap-1">
                              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                                <path fill="none" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M80 464V68.14a8 8 0 014-6.9C91.81 56.66 112.92 48 160 48c64 0 145 48 192 48a199.53 199.53 0 0077.23-15.77 2 2 0 012.77 1.85v219.36a4 4 0 01-2.39 3.65C421.37 308.7 392.33 320 352 320c-48 0-128-32-192-32s-80 16-80 16" />
                              </svg>
                              <span>{property.status}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Property Vitals Overlay — bottom of image */}
                      <Link
                        href={`/listings/${property.id}`}
                        className="absolute bottom-0 left-0 right-0 bg-black/60 text-white backdrop-blur-sm"
                      >
                        <div className="grid grid-cols-[auto_1fr_1fr] items-center p-3 gap-x-3">
                          {/* Price */}
                          <div className="font-bold text-lg sm:text-2xl pr-3">
                            {formatPrice(property.list_price)}
                          </div>

                          {/* Vitals */}
                          <div className="flex gap-3 border-l border-white/30 pl-3 text-sm whitespace-nowrap">
                            {property.bedrooms !== null && (
                              <span>{property.bedrooms} bd</span>
                            )}
                            {property.bathrooms !== null && (
                              <span>{property.bathrooms} ba</span>
                            )}
                            {property.square_feet && (
                              <span>{property.square_feet.toLocaleString()} sf</span>
                            )}
                            {property.lot_size_acres && (
                              <span>{property.lot_size_acres} ac</span>
                            )}
                          </div>

                          {/* Location */}
                          <div className="border-l border-white/30 pl-3 text-sm truncate">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="inline w-4 h-4 mr-0.5 -ml-0.5 align-text-bottom" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 14c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z" />
                              <path d="M11.42 21.814a.998.998 0 0 0 1.16 0C12.884 21.599 20.029 16.44 20 10c0-4.411-3.589-8-8-8S4 5.589 4 9.995c-.029 6.445 7.116 11.604 7.42 11.819zM12 4c3.309 0 6 2.691 6 6.005.021 4.438-4.388 8.423-6 9.73-1.611-1.308-6.021-5.294-6-9.735 0-3.309 2.691-6 6-6z" />
                            </svg>
                            {property.address}, {property.city}, {property.state || 'WA'}
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* MLS Number + View Property */}
                    <div className="text-center py-3">
                      <span className="text-[var(--rc-brown)]/60 text-sm block mb-2">
                        MLS Number: {property.mls_number}
                      </span>
                      <Link
                        href={`/listings/${property.id}`}
                        className="inline-block border border-[var(--rc-navy)] text-[var(--rc-navy)] bg-transparent text-xs font-medium uppercase tracking-wider px-5 py-2 hover:bg-[var(--rc-navy)] hover:text-white transition-colors duration-200"
                      >
                        View Property
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20"
          aria-label="Next property"
        >
          <div className="w-[24px] h-[48px] md:w-[36px] md:h-[72px] lg:w-[48px] lg:h-[96px]">
            <NextArrow />
          </div>
        </button>
      </div>

      {/* View All Button */}
      <div className="text-center mt-10 max-w-screen-xl mx-auto px-6">
        <Link
          href={listingsHref}
          className="inline-block bg-[var(--rc-gold)] text-white text-xs font-black uppercase tracking-[0.1em] px-10 py-4 hover:bg-[var(--rc-gold-hover)] transition-colors duration-200"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
