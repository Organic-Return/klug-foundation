'use client';

import Image from 'next/image';

interface Attraction {
  name: string;
  category?: 'restaurant' | 'shopping' | 'park' | 'entertainment' | 'fitness' | 'healthcare' | 'grocery' | 'coffee' | 'museum' | 'outdoor' | 'other';
  description?: string;
  distance?: string;
  address?: string;
  website?: string;
  image?: {
    asset: {
      url: string;
    };
  };
}

interface NearbyAttractionsProps {
  attractions: Attraction[];
  title?: string;
  subtitle?: string;
  variant?: 'classic' | 'luxury';
}

const categoryLabels: Record<string, string> = {
  restaurant: 'Dining',
  shopping: 'Shopping',
  park: 'Parks',
  entertainment: 'Entertainment',
  fitness: 'Fitness',
  healthcare: 'Healthcare',
  grocery: 'Grocery',
  coffee: 'Coffee',
  museum: 'Culture',
  outdoor: 'Outdoor',
  other: 'Other',
};

const CategoryIcon = ({ category }: { category?: string }) => {
  const iconClass = "w-5 h-5";

  switch (category) {
    case 'restaurant':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'shopping':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 'park':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'outdoor':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'museum':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      );
    case 'fitness':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
};

export default function NearbyAttractions({
  attractions,
  title = 'Points of Interest',
  subtitle = 'Dining, shopping, and entertainment nearby',
  variant = 'classic',
}: NearbyAttractionsProps) {
  if (!attractions || attractions.length === 0) {
    return null;
  }

  const isLuxury = variant === 'luxury';

  return (
    <div className="space-y-6">
      {/* Subsection Header */}
      {isLuxury ? (
        <div className="mb-10">
          <h3 className="text-xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide mb-2">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-warm-gray)] font-luxury-body font-light tracking-wide">
            {subtitle}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-sothebys-blue)]/10 dark:bg-white/10">
            <svg className="w-6 h-6 text-[var(--color-sothebys-blue)] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <hgroup>
            <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
              {title}
            </h3>
            <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
              {subtitle}
            </p>
          </hgroup>
        </div>
      )}

      {/* Attractions Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isLuxury ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5`}>
        {attractions.map((attraction, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden transition-all duration-500 ${
              isLuxury
                ? 'bg-[#fffcf7] border border-[var(--color-taupe)]/20 hover:border-[var(--color-gold)]/50 hover:shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] hover:shadow-lg'
            }`}
          >
            {/* Image or Placeholder */}
            {attraction.image?.asset?.url ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={attraction.image.asset.url}
                  alt={attraction.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Category badge on image */}
                {attraction.category && (
                  <div className={`absolute bottom-4 left-4 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 ${
                    isLuxury
                      ? 'bg-white/95 border border-[var(--color-taupe)]/30'
                      : 'bg-white/90 dark:bg-black/80 rounded-full'
                  }`}>
                    <span className={isLuxury ? 'text-[var(--color-gold)]' : 'text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)]'}>
                      <CategoryIcon category={attraction.category} />
                    </span>
                    <span className={`text-xs uppercase font-light ${
                      isLuxury
                        ? 'tracking-[0.2em] font-luxury-body text-[var(--color-charcoal)]'
                        : 'tracking-[0.1em] font-medium text-[#1a1a1a] dark:text-white'
                    }`}>
                      {categoryLabels[attraction.category] || attraction.category}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              isLuxury ? (
                <div className="relative h-32 bg-gradient-to-br from-[#f6f1eb] to-[var(--color-taupe)]/20 flex items-center justify-center">
                  <span className="text-[var(--color-gold)]/30">
                    <CategoryIcon category={attraction.category} />
                  </span>
                  {attraction.category && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="text-[var(--color-gold)]">
                        <CategoryIcon category={attraction.category} />
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] font-luxury-body font-light text-[var(--color-charcoal)]">
                        {categoryLabels[attraction.category] || attraction.category}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-32 bg-gradient-to-br from-[#f8f7f5] to-[#e8e6e3] dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <span className="text-[var(--color-sothebys-blue)]/30 dark:text-white/20">
                    <CategoryIcon category={attraction.category} />
                  </span>
                  {attraction.category && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)]">
                        <CategoryIcon category={attraction.category} />
                      </span>
                      <span className="text-xs uppercase tracking-[0.1em] font-medium text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)]">
                        {categoryLabels[attraction.category] || attraction.category}
                      </span>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className={`line-clamp-1 transition-colors duration-300 ${
                  isLuxury
                    ? 'font-luxury-body font-medium text-[var(--color-charcoal)] group-hover:text-[var(--color-gold)]'
                    : 'font-medium text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-sothebys-blue)] dark:group-hover:text-[var(--color-gold)]'
                }`}>
                  {attraction.website ? (
                    <a
                      href={attraction.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline decoration-[var(--color-gold)] underline-offset-4"
                    >
                      {attraction.name}
                    </a>
                  ) : (
                    attraction.name
                  )}
                </h4>
                {attraction.distance && (
                  <span className={`text-xs font-light whitespace-nowrap px-2 py-1 ${
                    isLuxury
                      ? 'font-luxury-body text-[var(--color-warm-gray)] bg-white border border-[var(--color-taupe)]/20'
                      : 'text-[#6a6a6a] dark:text-gray-400 bg-[#f8f7f5] dark:bg-gray-800 rounded'
                  }`}>
                    {attraction.distance}
                  </span>
                )}
              </div>

              {attraction.description && (
                <p className={`text-sm font-light line-clamp-2 leading-relaxed ${
                  isLuxury
                    ? 'font-luxury-body text-[var(--color-warm-gray)]'
                    : 'text-[#6a6a6a] dark:text-gray-400'
                }`}>
                  {attraction.description}
                </p>
              )}

              {attraction.address && (
                <p className={`mt-3 text-xs font-light truncate flex items-center gap-1.5 ${
                  isLuxury
                    ? 'font-luxury-body text-[var(--color-warm-gray)]'
                    : 'text-[#8a8a8a] dark:text-gray-500'
                }`}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {attraction.address}
                </p>
              )}
            </div>

            {/* Gold accent line */}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-gold)] group-hover:w-full transition-all duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
