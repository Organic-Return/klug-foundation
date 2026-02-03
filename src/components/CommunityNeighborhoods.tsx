'use client';

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
}

export default function CommunityNeighborhoods({
  neighborhoods,
  communitySlug,
  communityTitle,
  variant = 'classic',
}: CommunityNeighborhoodsProps) {
  if (!neighborhoods || neighborhoods.length === 0) {
    return null;
  }

  const isLuxury = variant === 'luxury';

  const getGridLayout = () => {
    const count = neighborhoods.length;
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  };

  if (isLuxury) {
    return (
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {/* Header */}
          <div className="text-center mb-16 md:mb-20">
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
                    <h3 className="font-luxury text-white text-xl md:text-2xl font-light tracking-[0.04em] mb-2">
                      {neighborhood.name}
                    </h3>
                    {neighborhood.description && (
                      <p className="font-luxury-body text-white/70 text-sm font-light leading-relaxed line-clamp-2">
                        {neighborhood.description}
                      </p>
                    )}
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
