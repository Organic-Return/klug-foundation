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

interface School {
  name: string;
  type?: 'elementary' | 'middle' | 'high' | 'k12' | 'private' | 'charter';
  rating?: number;
  distance?: string;
  address?: string;
  website?: string;
}

interface CustomOneLocalHighlightsProps {
  attractions?: Attraction[];
  schools?: School[];
  attractionsTitle?: string;
  schoolsTitle?: string;
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

const schoolTypeLabels: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  k12: 'K-12',
  private: 'Private',
  charter: 'Charter',
};

function AttractionCard({
  attraction,
  variant,
  fullWidth,
}: {
  attraction: Attraction;
  variant: 'hero' | 'medium' | 'compact';
  fullWidth?: boolean;
}) {
  const hasImage = !!attraction.image?.asset?.url;

  // On mobile, hero uses a taller aspect ratio to avoid content overlap
  const aspectClass =
    variant === 'hero'
      ? 'aspect-[4/3] md:aspect-[16/7]'
      : variant === 'medium'
        ? fullWidth
          ? 'aspect-[4/3] md:aspect-[21/9]'
          : 'aspect-[4/3]'
        : 'aspect-[3/2]';

  const nameClass =
    variant === 'hero'
      ? 'text-2xl md:text-3xl font-light'
      : variant === 'medium'
        ? 'text-lg md:text-xl font-light'
        : 'text-base font-light';

  const content = (
    <>
      {/* Category badge */}
      {attraction.category && (
        <span className="absolute top-4 left-4 z-10 text-[var(--modern-gold)] text-[10px] uppercase tracking-[0.25em] font-light">
          {categoryLabels[attraction.category] || attraction.category}
        </span>
      )}

      {/* Distance */}
      {attraction.distance && (
        <span className="absolute top-4 right-4 z-10 text-white/60 text-xs font-light">
          {attraction.distance}
        </span>
      )}

      {/* Image */}
      {hasImage ? (
        <Image
          src={attraction.image!.asset.url}
          alt={attraction.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes={
            variant === 'hero' || fullWidth
              ? '100vw'
              : variant === 'medium'
                ? '(max-width: 768px) 100vw, 50vw'
                : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
          }
        />
      ) : (
        <div className="absolute inset-0 bg-white/[0.03]" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <h4 className={`text-white ${nameClass} tracking-wide mb-1`}>
          {attraction.name}
        </h4>
        {(variant === 'hero' || variant === 'medium') && attraction.description && (
          <p className="text-white/70 text-sm font-light line-clamp-2 mt-2 max-w-2xl">
            {attraction.description}
          </p>
        )}
      </div>
    </>
  );

  const cardClasses = `group block relative overflow-hidden ${aspectClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--modern-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--modern-black)]`;

  if (attraction.website) {
    return (
      <a
        href={attraction.website}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClasses}
      >
        {content}
        {/* Gold accent line on hover */}
        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--modern-gold)] group-hover:w-full transition-all duration-500" />
      </a>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}

function AttractionListRow({ attraction }: { attraction: Attraction }) {
  const nameEl = attraction.website ? (
    <a
      href={attraction.website}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white font-light hover:text-[var(--modern-gold)] focus-visible:text-[var(--modern-gold)] focus-visible:outline-none transition-colors duration-300"
    >
      {attraction.name}
    </a>
  ) : (
    <span className="text-white font-light">{attraction.name}</span>
  );

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
      <div className="flex items-center gap-4">
        {nameEl}
        {attraction.category && (
          <span className="text-[var(--modern-gold)] text-[10px] uppercase tracking-[0.2em] font-light">
            {categoryLabels[attraction.category] || attraction.category}
          </span>
        )}
      </div>
      {attraction.distance && (
        <span className="text-white/50 text-xs font-light">{attraction.distance}</span>
      )}
    </div>
  );
}

function SchoolRow({ school }: { school: School }) {
  const nameEl = school.website ? (
    <a
      href={school.website}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white font-medium hover:text-[var(--modern-gold)] focus-visible:text-[var(--modern-gold)] focus-visible:outline-none transition-colors duration-300 text-sm"
    >
      {school.name}
    </a>
  ) : (
    <span className="text-white font-medium text-sm">{school.name}</span>
  );

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {nameEl}
          {school.type && (
            <span className="text-[var(--modern-gold)] text-[10px] uppercase tracking-[0.2em] font-light whitespace-nowrap">
              {schoolTypeLabels[school.type] || school.type}
            </span>
          )}
        </div>
        {school.rating && (
          <div className="flex items-center gap-3 mt-1.5">
            <div
              className="w-24 h-1 bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={school.rating}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`${school.name} rating: ${school.rating} out of 10`}
            >
              <div
                className="h-full bg-[var(--modern-gold)] transition-all duration-500"
                style={{ width: `${(school.rating / 10) * 100}%` }}
              />
            </div>
            <span className="text-[var(--modern-gold)] text-xs font-light">
              {school.rating}/10
            </span>
          </div>
        )}
      </div>
      {school.distance && (
        <span className="text-white/50 text-xs font-light ml-4 whitespace-nowrap">
          {school.distance}
        </span>
      )}
    </div>
  );
}

export default function CustomOneLocalHighlights({
  attractions,
  schools,
  attractionsTitle = 'Points of Interest',
  schoolsTitle = 'Schools',
}: CustomOneLocalHighlightsProps) {
  const hasAttractions = attractions && attractions.length > 0;
  const hasSchools = schools && schools.length > 0;

  if (!hasAttractions && !hasSchools) return null;

  // Split attractions: only those WITH images get editorial cards
  // Those without images go to the list row treatment
  const withImages = attractions?.filter((a) => a.image?.asset?.url) || [];
  const withoutImages = attractions?.filter((a) => !a.image?.asset?.url) || [];

  // Assign editorial layout tiers
  const heroAttraction = withImages[0] || null;
  const mediumAttractions = withImages.slice(1, 3);
  const compactAttractions = withImages.slice(3);

  // If only 1 medium attraction, render it full-width instead of half
  const singleMedium = mediumAttractions.length === 1;

  return (
    <div className="space-y-16">
      {/* Schools — Minimal List */}
      {hasSchools && (
        <div>
          <h3 className="text-xl md:text-2xl font-light text-white tracking-wide mb-8">
            {schoolsTitle}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {schools!.map((school, i) => (
              <SchoolRow key={i} school={school} />
            ))}
          </div>
        </div>
      )}

      {/* Attractions — Editorial Image Grid */}
      {hasAttractions && (
        <div>
          {/* Gold divider if there are also schools */}
          {hasSchools && (
            <div className="w-16 h-[1px] bg-[var(--modern-gold)] mb-10" />
          )}

          <h3 className="text-xl md:text-2xl font-light text-white tracking-wide mb-8">
            {attractionsTitle}
          </h3>

          <div className="space-y-4">
            {/* Hero card — full width */}
            {heroAttraction && (
              <AttractionCard attraction={heroAttraction} variant="hero" />
            )}

            {/* Two-column row (or full-width if only 1 medium) */}
            {mediumAttractions.length > 0 && (
              singleMedium ? (
                <AttractionCard attraction={mediumAttractions[0]} variant="medium" fullWidth />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mediumAttractions.map((attraction, i) => (
                    <AttractionCard key={i} attraction={attraction} variant="medium" />
                  ))}
                </div>
              )
            )}

            {/* Three-column row */}
            {compactAttractions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {compactAttractions.map((attraction, i) => (
                  <AttractionCard key={i} attraction={attraction} variant="compact" />
                ))}
              </div>
            )}

            {/* Attractions without images — compact list */}
            {withoutImages.length > 0 && (
              <div className="mt-8">
                {withoutImages.map((attraction, i) => (
                  <AttractionListRow key={i} attraction={attraction} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
