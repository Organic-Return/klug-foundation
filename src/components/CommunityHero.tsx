'use client';

import Image from 'next/image';

interface CommunityHeroProps {
  title: string;
  description?: string;
  imageUrl: string;
  priceRange?: string;
}

export default function CommunityHero({
  title,
  description,
  imageUrl,
  priceRange,
}: CommunityHeroProps) {
  return (
    <section className="relative w-full h-[70vh] md:h-[75vh] lg:h-[80vh] min-h-[500px]">
      {/* Hero Image Container - full height, extends behind transparent header */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Gradient Overlay - darker at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 md:pb-16 lg:pb-20">
          <div className="max-w-3xl">
            {/* Title */}
            <h1 className="text-white mb-4 md:mb-6">
              {title}
            </h1>

            {/* Decorative Line */}
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] mb-6 md:mb-8" />

            {/* Description */}
            {description && (
              <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mb-6">
                {description}
              </p>
            )}

            {/* Price Range */}
            {priceRange && (
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm uppercase tracking-wider">Price Range</span>
                <span className="text-white text-lg md:text-xl font-medium">{priceRange}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/60">
        <span className="text-xs uppercase tracking-widest">Explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
