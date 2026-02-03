'use client';

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
        {!isLuxury && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        )}
      </div>

      {/* Content Overlay */}
      <div className={`absolute inset-0 flex items-end ${isLuxury ? 'justify-center text-center' : ''}`}>
        <div className={`w-full ${isLuxury ? 'max-w-[1440px] mx-auto px-6 md:px-12 pb-16 md:pb-20 lg:pb-24' : 'max-w-7xl mx-auto px-6 md:px-12 pb-12 md:pb-16 lg:pb-20'}`}>
          <div className={isLuxury ? 'max-w-3xl mx-auto' : 'max-w-3xl'}>
            {isLuxury && (
              <p className="font-luxury-body text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5">
                Community
              </p>
            )}

            <h1 className={isLuxury
              ? 'font-luxury text-white text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.04em] leading-[1.1] mb-4 md:mb-6'
              : 'text-white mb-4 md:mb-6'
            }>
              {title}
            </h1>

            <div className={`h-px bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] mb-6 md:mb-8 ${isLuxury ? 'w-12 mx-auto' : 'w-16 md:w-24'}`} />

            {description && (
              <p className={isLuxury
                ? 'font-luxury-body text-white/80 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto mb-6'
                : 'text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mb-6'
              }>
                {description}
              </p>
            )}

            {priceRange && (
              <div className={`flex items-center gap-3 ${isLuxury ? 'justify-center' : ''}`}>
                <span className={isLuxury
                  ? 'font-luxury-body text-white/50 text-[11px] uppercase tracking-[0.2em] font-light'
                  : 'text-white/60 text-sm uppercase tracking-wider'
                }>
                  Price Range
                </span>
                <span className={isLuxury
                  ? 'font-luxury text-white text-lg md:text-xl font-light tracking-wide'
                  : 'text-white text-lg md:text-xl font-medium'
                }>
                  {priceRange}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/60">
        <span className={isLuxury
          ? 'font-luxury-body text-[10px] uppercase tracking-[0.2em] font-light'
          : 'text-xs uppercase tracking-widest'
        }>
          Explore
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
