'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, getListingHref } from '@/lib/listings';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size_acres: number | null;
  photos: string[];
  mls_number: string;
  status: string;
  property_type: string;
}

interface ClassicFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
  videos?: string[];
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft);
}

export default function ClassicFeaturedProperty({
  mlsId,
  headline = 'Featured Property',
  buttonText = 'View Property',
  videos,
}: ClassicFeaturedPropertyProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.bottom > 0 && rect.top < windowHeight) {
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        setParallaxOffset((progress - 0.5) * 250);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Test videos — remove once real videos are added via Sanity CMS
  const TEST_VIDEOS = [
    '/hero-video.mp4',
    '/hero-video.mp4',
    '/hero-video.mp4',
  ];
  const effectiveVideos = videos && videos.length > 0 ? videos : TEST_VIDEOS;
  const hasVideos = effectiveVideos.length > 0;
  const hasMultipleVideos = effectiveVideos.length > 1;

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/listings/${mlsId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (mlsId) {
      fetchProperty();
    }
  }, [mlsId]);

  // Auto-rotate videos every 15 seconds
  useEffect(() => {
    if (!hasMultipleVideos) return;

    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveVideo((prev) => (prev + 1) % effectiveVideos.length);
        setIsTransitioning(false);
      }, 500);
    }, 15000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMultipleVideos, videos]);

  const handleDotClick = useCallback((index: number) => {
    if (index === activeVideo || isTransitioning) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveVideo(index);
      setIsTransitioning(false);
    }, 500);
    // Restart timer
    if (hasMultipleVideos) {
      timerRef.current = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveVideo((prev) => (prev + 1) % effectiveVideos.length);
          setIsTransitioning(false);
        }, 500);
      }, 15000);
    }
  }, [activeVideo, isTransitioning, hasMultipleVideos, videos]);

  if (isLoading || !property) {
    return null;
  }

  const mainPhoto = property.photos?.[0];

  return (
    <section ref={sectionRef} className="relative w-full aspect-video overflow-hidden">
      {/* Background: Videos or Image with parallax */}
      <div className="absolute -top-[25%] -bottom-[25%] left-0 right-0" style={{ transform: `translateY(${parallaxOffset}px)`, willChange: 'transform' }}>
        {hasVideos ? (
          <>
            {effectiveVideos.map((videoUrl, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                  index === activeVideo && !isTransitioning ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={mainPhoto}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              </div>
            ))}
          </>
        ) : mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={property.address || 'Featured Property'}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-cream)] flex items-center justify-center">
            <svg
              className="w-24 h-24 text-[var(--color-warm-gray)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Video Indicator Dots - Left side */}
      {hasMultipleVideos && (
        <div className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
          {effectiveVideos.map((_, index) => (
            <span
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => handleDotClick(index)}
              onKeyDown={(e) => e.key === 'Enter' && handleDotClick(index)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                index === activeVideo
                  ? 'w-3 h-3 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Property details overlay - Right side, matching klugproperties.com layout */}
      <div className="relative h-full">
        <div className="absolute top-12 md:top-16 lg:top-20 xl:top-24 right-[58px] sm:right-[62px] lg:right-[66px] xl:right-[74px] text-right text-white">
          {/* Location */}
          <div className="flex flex-col gap-y-2 md:gap-y-3 lg:gap-y-4 xl:gap-y-7 mb-2 md:mb-3 lg:mb-4 xl:mb-7">
            <span className="text-2xl md:text-3xl lg:text-4xl uppercase">
              {property.city} {property.state ? `- ${property.state === 'CO' ? 'Colorado' : property.state}` : '- Colorado'}
            </span>
            <span className="text-lg md:text-xl lg:text-2xl font-normal">
              {property.address}
            </span>
          </div>

          {/* Price */}
          <div className="font-bold flex justify-end items-center gap-x-2 text-base mb-2 md:mb-3 lg:mb-4 xl:mb-7">
            <span className="text-base md:text-lg">{formatPrice(property.list_price)}</span>
            <svg className="w-[1.5em] h-[1.5em] inline" fill="currentColor" viewBox="0 0 512 512">
              <path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z" />
            </svg>
          </div>

          {/* Vitals - icon after value, stacked vertically */}
          <div className="flex flex-col gap-y-2 md:gap-y-3 lg:gap-y-4 xl:gap-y-7 mb-2 md:mb-3 lg:mb-4 xl:mb-7">
            {property.bedrooms !== null && (
              <div className="flex items-center justify-end whitespace-nowrap">
                <span className="text-base">{property.bedrooms}</span>
                <svg className="ml-2 w-[1.5em] h-[1.5em] inline" fill="none" stroke="currentColor" strokeWidth="32" viewBox="0 0 512 512">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M384 240H96V136a40.12 40.12 0 0140-40h240a40.12 40.12 0 0140 40v104zM48 416V304a64.19 64.19 0 0164-64h288a64.19 64.19 0 0164 64v112" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M48 416v-8a24.07 24.07 0 0124-24h368a24.07 24.07 0 0124 24v8M112 240v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16m0 0v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16" />
                </svg>
              </div>
            )}
            {property.bathrooms !== null && (
              <div className="flex items-center justify-end whitespace-nowrap">
                <span className="text-base">{property.bathrooms}</span>
                <svg className="ml-2 w-[1.5em] h-[1.5em] inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 10H7V7c0-1.103.897-2 2-2s2 .897 2 2h2c0-2.206-1.794-4-4-4S5 4.794 5 7v3H3a1 1 0 0 0-1 1v2c0 2.606 1.674 4.823 4 5.65V22h2v-3h8v3h2v-3.35c2.326-.827 4-3.044 4-5.65v-2a1 1 0 0 0-1-1zm-1 3c0 2.206-1.794 4-4 4H8c-2.206 0-4-1.794-4-4v-1h16v1z" />
                </svg>
              </div>
            )}
            {property.square_feet !== null && (
              <div className="flex items-center justify-end whitespace-nowrap">
                <span className="text-base">{formatSqft(property.square_feet)} sf</span>
                <svg className="ml-2 w-[1.5em] h-[1.5em] inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 19H19V14H10V5H5V7H7V9H5V11H8V13H5V15H7V17H5V19H7V17H9V19H11V16H13V19H15V17H17V19ZM12 12H20C20.5523 12 21 12.4477 21 13V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V12Z" />
                </svg>
              </div>
            )}
            {property.lot_size_acres !== null && property.lot_size_acres > 0 && (
              <div className="flex items-center justify-end whitespace-nowrap">
                <span className="text-base">{property.lot_size_acres.toFixed(2)} ac</span>
                <svg className="ml-2 w-[1.5em] h-[1.5em] inline" fill="currentColor" viewBox="0 0 24 24">
                  <path fill="none" d="M24 24H0V0h24v24z" />
                  <path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8l2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z" />
                </svg>
              </div>
            )}
          </div>

          {/* View Property Button */}
          <Link
            href={getListingHref(property)}
            className="klug-hero-btn sir-btn sir-btn--light inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 bg-transparent text-white px-6 py-3 border border-white hover:bg-white hover:text-[#0a275d]"
          >
            <span>{buttonText}</span>
            <span className="sir-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
