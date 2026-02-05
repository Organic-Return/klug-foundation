'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CommunityHeroProps {
  title: string;
  description?: string;
  imageUrl: string;
  priceRange?: string;
  variant?: 'classic' | 'luxury';
}

export default function CommunityHero({
  title,
  description,
  imageUrl,
  priceRange,
  variant = 'classic',
}: CommunityHeroProps) {
  const isLuxury = variant === 'luxury';
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLuxury) {
    return (
      <section className="relative w-full h-screen min-h-[800px] overflow-hidden">
        {/* Hero Image with Ken Burns */}
        <div
          className={`absolute inset-0 transition-transform duration-[20000ms] ease-linear ${
            isLoaded ? 'scale-[1.08]' : 'scale-100'
          }`}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            style={{ filter: 'brightness(0.7) contrast(1.05)' }}
          />
        </div>

        {/* Dual gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" />

        {/* Content Overlay - centered */}
        <div className="absolute inset-0 flex items-center justify-center text-center pt-16">
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
            <div className="max-w-3xl mx-auto">
              {/* Pretitle */}
              <p
                className={`font-luxury-body text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 transition-all duration-1000 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                Community
              </p>

              {/* Title */}
              <h1
                className={`font-luxury text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-[0.04em] leading-[1.1] mb-6 md:mb-8 transition-all duration-1000 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '450ms' }}
              >
                {title}
              </h1>

              {/* Gold divider */}
              <div
                className={`w-12 h-px bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] mx-auto mb-8 transition-all duration-1000 ${
                  isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
                style={{ transitionDelay: '600ms' }}
              />

              {/* Description */}
              {description && (
                <p
                  className={`font-luxury-body text-white/70 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto mb-8 transition-all duration-1000 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '750ms' }}
                >
                  {description}
                </p>
              )}

              {/* Price Range */}
              {priceRange && (
                <div
                  className={`flex items-center gap-3 justify-center transition-all duration-1000 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '900ms' }}
                >
                  <span className="font-luxury-body text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
                    Price Range
                  </span>
                  <span className="font-luxury text-white text-lg md:text-xl font-light tracking-wide">
                    {priceRange}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 text-white/40 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '1200ms' }}
        >
          <span className="font-luxury-body text-[9px] uppercase tracking-[0.3em] font-light">
            Scroll to Explore
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent relative overflow-hidden">
            <div className="w-px h-6 bg-white/60 animate-scroll-bounce" />
          </div>
        </div>
      </section>
    );
  }

  // Classic variant
  return (
    <section className="relative w-full h-[70vh] md:h-[75vh] lg:h-[80vh] min-h-[500px]">
      {/* Hero Image Container */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 md:pb-16 lg:pb-20">
          <div className="max-w-3xl">
            <h1 className="text-white mb-4 md:mb-6">
              {title}
            </h1>

            <div className="h-px bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] mb-6 md:mb-8 w-16 md:w-24" />

            {description && (
              <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mb-6">
                {description}
              </p>
            )}

            {priceRange && (
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm uppercase tracking-wider">
                  Price Range
                </span>
                <span className="text-white text-lg md:text-xl font-medium">
                  {priceRange}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/60">
        <span className="text-xs uppercase tracking-widest">
          Explore
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
