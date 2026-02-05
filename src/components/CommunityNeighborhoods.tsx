'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Neighborhood {
  name: string;
  slug: { current: string };
  description?: string;
  image?: {
    asset: {
      url: string;
    };
  };
}

interface CommunityNeighborhoodsProps {
  neighborhoods: Neighborhood[];
  communitySlug: string;
  communityTitle: string;
  variant?: 'classic' | 'luxury';
  colorScheme?: 'light' | 'dark';
  layout?: 'default' | 'gallery';
}

const ITEMS_PER_PAGE = 4;

function GalleryLayout({ neighborhoods, communitySlug, communityTitle }: { neighborhoods: Neighborhood[]; communitySlug: string; communityTitle: string }) {
  const itemCount = neighborhoods.length;
  const needsCarousel = itemCount > ITEMS_PER_PAGE + 1;

  // Infinite carousel: triple ALL items, start in the middle copy
  const slides = needsCarousel ? [...neighborhoods, ...neighborhoods, ...neighborhoods] : neighborhoods;
  const [index, setIndex] = useState(needsCarousel ? itemCount : 0);
  const [animate, setAnimate] = useState(true);

  // Hero = the item at the current index (cycles through all neighborhoods)
  const heroIdx = ((index % itemCount) + itemCount) % itemCount;
  const heroNeighborhood = neighborhoods[heroIdx];

  const handlePrev = () => {
    setAnimate(true);
    setIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    setAnimate(true);
    setIndex((prev) => prev + 1);
  };

  // After slide animation, silently reset position if we've drifted into a clone region
  const handleTransitionEnd = () => {
    if (index >= itemCount * 2) {
      setAnimate(false);
      setIndex((prev) => prev - itemCount);
    } else if (index < itemCount) {
      setAnimate(false);
      setIndex((prev) => prev + itemCount);
    }
  };

  // Re-enable animation after the silent jump has rendered
  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  const renderCard = (neighborhood: Neighborhood) => (
    <Link
      href={`/communities/${communitySlug}#${neighborhood.slug.current}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {neighborhood.image?.asset?.url ? (
          <Image
            src={neighborhood.image.asset.url}
            alt={neighborhood.name}
            fill
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-light text-white tracking-wide mb-1">
            {neighborhood.name}
          </h3>
          <span className="inline-flex items-center gap-2 text-[var(--modern-gold)] text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Explore</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );

  // Static layout for 5 or fewer neighborhoods (no carousel needed)
  if (!needsCarousel) {
    const staticRest = neighborhoods.slice(1);
    const getStaticGridCols = () => {
      const count = staticRest.length;
      if (count === 1) return 'grid-cols-1 max-w-3xl mx-auto';
      if (count === 2) return 'grid-cols-1 md:grid-cols-2';
      if (count === 3) return 'grid-cols-1 md:grid-cols-3';
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    };

    return (
      <section className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-16 md:mb-20">
            <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] tracking-wide">
              {communityTitle} Neighborhoods
            </h2>
          </div>

          <Link href={`/communities/${communitySlug}#${neighborhoods[0].slug.current}`} className="group block mb-6 md:mb-8">
            <div className="relative aspect-[21/9] md:aspect-[2.5/1] overflow-hidden">
              {neighborhoods[0].image?.asset?.url ? (
                <Image src={neighborhoods[0].image.asset.url} alt={neighborhoods[0].name} fill className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" sizes="100vw" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <h3 className="text-2xl md:text-4xl font-light text-white tracking-wide mb-2">{neighborhoods[0].name}</h3>
                {neighborhoods[0].description && (
                  <p className="text-white/60 text-sm md:text-base font-light max-w-2xl leading-relaxed">{neighborhoods[0].description}</p>
                )}
                <span className="inline-flex items-center gap-2 mt-4 text-[var(--modern-gold)] text-xs uppercase tracking-[0.2em] group-hover:gap-3 transition-all duration-300">
                  <span>Explore</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </div>
          </Link>

          {staticRest.length > 0 && (
            <div className={`grid gap-6 md:gap-8 ${getStaticGridCols()}`}>
              {staticRest.map((neighborhood) => (
                <div key={neighborhood.slug.current}>{renderCard(neighborhood)}</div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Carousel layout — hero synced with sliding carousel
  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] tracking-wide">
            {communityTitle} Neighborhoods
          </h2>
        </div>

        {/* Hero — updates as the carousel slides */}
        <Link
          href={`/communities/${communitySlug}#${heroNeighborhood.slug.current}`}
          className="group block mb-6 md:mb-8"
        >
          <div className="relative aspect-[21/9] md:aspect-[2.5/1] overflow-hidden">
            {heroNeighborhood.image?.asset?.url ? (
              <Image
                src={heroNeighborhood.image.asset.url}
                alt={heroNeighborhood.name}
                fill
                className="object-cover transition-opacity duration-500 ease-out"
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <h3 className="text-2xl md:text-4xl font-light text-white tracking-wide mb-2">
                {heroNeighborhood.name}
              </h3>
              {heroNeighborhood.description && (
                <p className="text-white/60 text-sm md:text-base font-light max-w-2xl leading-relaxed">
                  {heroNeighborhood.description}
                </p>
              )}
              <span className="inline-flex items-center gap-2 mt-4 text-[var(--modern-gold)] text-xs uppercase tracking-[0.2em] group-hover:gap-3 transition-all duration-300">
                <span>Explore</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Sliding carousel — shows next 4 items after hero */}
        <div className="overflow-hidden -mx-3">
          <div
            className={`flex gallery-carousel-track ${animate ? 'transition-transform duration-500 ease-out' : ''}`}
            style={{ transform: `translateX(calc(-${index + 1} * var(--gallery-slide-width)))` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((neighborhood, i) => (
              <div
                key={`${neighborhood.slug.current}-${i}`}
                className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3"
              >
                {renderCard(neighborhood)}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={handlePrev}
            className="w-10 h-10 border border-[var(--modern-gray-lighter)] text-[var(--modern-gray)] flex items-center justify-center hover:border-[var(--modern-gold)] hover:text-[var(--modern-gold)] focus-visible:border-[var(--modern-gold)] focus-visible:text-[var(--modern-gold)] focus-visible:outline-none transition-all duration-300"
            aria-label="Previous neighborhoods"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-[var(--modern-gray)] text-xs tracking-[0.2em] font-light min-w-[3rem] text-center tabular-nums">
            {heroIdx + 1} / {itemCount}
          </span>

          <button
            onClick={handleNext}
            className="w-10 h-10 border border-[var(--modern-gray-lighter)] text-[var(--modern-gray)] flex items-center justify-center hover:border-[var(--modern-gold)] hover:text-[var(--modern-gold)] focus-visible:border-[var(--modern-gold)] focus-visible:text-[var(--modern-gold)] focus-visible:outline-none transition-all duration-300"
            aria-label="Next neighborhoods"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function CommunityNeighborhoods({
  neighborhoods,
  communitySlug,
  communityTitle,
  variant = 'classic',
  colorScheme = 'light',
  layout = 'default',
}: CommunityNeighborhoodsProps) {
  if (!neighborhoods || neighborhoods.length === 0) {
    return null;
  }

  const isLuxury = variant === 'luxury';
  const isDark = colorScheme === 'dark';

  const getGridLayout = () => {
    const count = neighborhoods.length;
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  };

  // Gallery layout — editorial, image-forward presentation
  if (layout === 'gallery') {
    return <GalleryLayout neighborhoods={neighborhoods} communitySlug={communitySlug} communityTitle={communityTitle} />;
  }

  if (isLuxury) {
    return (
      <section className={`py-32 md:py-44 relative overflow-hidden ${isDark ? 'bg-[var(--modern-black)]' : 'bg-white'}`}>
        {/* Texture overlay - dark mode only */}
        {isDark && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`
            }} />
          </div>
        )}

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 md:mb-20">
            {isDark ? (
              <>
                <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide mb-5">
                  {communityTitle} Neighborhoods
                </h2>
                <p className="text-white/50 font-light max-w-xl mx-auto text-sm tracking-wide">
                  Each neighborhood offers its own distinct character and lifestyle
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
                  Discover
                </p>
                <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide mb-5">
                  {communityTitle} Neighborhoods
                </h2>
                <p className="font-luxury-body text-[var(--color-warm-gray)] font-light max-w-xl mx-auto text-sm tracking-wide">
                  Each neighborhood offers its own distinct character and lifestyle
                </p>
              </>
            )}
          </div>

          {/* Neighborhoods Grid */}
          <div className={`grid ${getGridLayout()} gap-6 md:gap-8`}>
            {neighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.slug.current}
                href={`/communities/${communitySlug}#${neighborhood.slug.current}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  {neighborhood.image?.asset?.url ? (
                    <Image
                      src={neighborhood.image.asset.url}
                      alt={neighborhood.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[var(--color-charcoal)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="font-luxury text-white text-xl md:text-2xl font-light tracking-[0.04em] mb-2 group-hover:text-white/90 transition-colors duration-500">
                      {neighborhood.name}
                    </h3>
                    {neighborhood.description && (
                      <p className="font-luxury-body text-white/70 text-sm font-light leading-relaxed line-clamp-2">
                        {neighborhood.description}
                      </p>
                    )}
                    <div className="mt-3 overflow-hidden">
                      <span className="inline-flex items-center gap-2 transform transition-all duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="font-luxury-body text-[var(--color-gold)] text-[10px] uppercase tracking-[0.3em] font-light">
                          Explore
                        </span>
                        <svg className="w-4 h-4 text-[var(--color-gold)] transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Classic variant
  return (
    <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-14 md:mb-20">
          <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] font-light mb-4 block">
            Discover
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-6 tracking-wide">
            {communityTitle} Neighborhoods
          </h2>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
          </div>
          <p className="text-white/60 font-light text-lg max-w-2xl mx-auto leading-relaxed">
            Each neighborhood offers its own distinct character and lifestyle
          </p>
        </div>

        <div className={`grid ${getGridLayout()} gap-5 md:gap-6`}>
          {neighborhoods.map((neighborhood, index) => (
            <Link
              key={neighborhood.slug.current}
              href={`/communities/${communitySlug}#${neighborhood.slug.current}`}
              className="group relative block overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {neighborhood.image?.asset?.url ? (
                  <Image
                    src={neighborhood.image.asset.url}
                    alt={neighborhood.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[var(--color-sothebys-blue)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="w-8 h-0.5 bg-[var(--color-gold)] mb-4 transform origin-left transition-all duration-500 group-hover:w-12" />
                  <h3 className="text-xl md:text-2xl font-serif font-light text-white mb-2 tracking-wide transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                    {neighborhood.name}
                  </h3>
                  <div className="overflow-hidden">
                    <p className="text-white/70 text-sm font-light leading-relaxed line-clamp-2 transform transition-all duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                      {neighborhood.description || `Explore the unique charm of ${neighborhood.name}`}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 transform transition-all duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.2em] font-light">Explore</span>
                    <svg className="w-4 h-4 text-[var(--color-gold)] transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-0 right-0 w-px h-8 bg-gradient-to-b from-[var(--color-gold)]/50 to-transparent transform origin-top transition-all duration-500 group-hover:h-12" />
                  <div className="absolute top-0 right-0 h-px w-8 bg-gradient-to-l from-[var(--color-gold)]/50 to-transparent transform origin-right transition-all duration-500 group-hover:w-12" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
