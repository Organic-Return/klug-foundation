'use client';

interface School {
  name: string;
  type?: 'elementary' | 'middle' | 'high' | 'k12' | 'private' | 'charter';
  rating?: number;
  distance?: string;
  address?: string;
  website?: string;
}

interface NearbySchoolsProps {
  schools: School[];
  title?: string;
  subtitle?: string;
  variant?: 'classic' | 'luxury';
}

const schoolTypeLabels: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  k12: 'K-12',
  private: 'Private',
  charter: 'Charter',
};

function RatingBar({ rating, variant = 'classic' }: { rating: number; variant?: 'classic' | 'luxury' }) {
  const isLuxury = variant === 'luxury';
  const percentage = (rating / 10) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
        isLuxury ? 'bg-[var(--color-taupe)]/30' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isLuxury
              ? 'bg-[var(--color-gold)]'
              : 'bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-sm min-w-[2.5rem] ${
        isLuxury
          ? 'font-luxury-body font-light text-[var(--color-gold)]'
          : 'font-medium text-[var(--color-gold)]'
      }`}>{rating}/10</span>
    </div>
  );
}

export default function NearbySchools({
  schools,
  title = 'Schools',
  subtitle = 'Nearby educational institutions',
  variant = 'classic',
}: NearbySchoolsProps) {
  if (!schools || schools.length === 0) {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
              {title}
            </h3>
            <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
              {subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schools.map((school, index) => (
          <div
            key={index}
            className={`group relative p-6 transition-all duration-500 ${
              isLuxury
                ? 'bg-[#fffcf7] border border-[var(--color-taupe)]/20 hover:border-[var(--color-gold)]/50 hover:shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] hover:shadow-lg'
            }`}
          >
            {/* Gold accent line */}
            <div className="absolute top-0 left-0 w-0 h-0.5 bg-[var(--color-gold)] group-hover:w-full transition-all duration-500" />

            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className={`line-clamp-2 transition-colors duration-300 ${
                    isLuxury
                      ? 'font-luxury-body font-medium text-[var(--color-charcoal)] group-hover:text-[var(--color-gold)]'
                      : 'font-medium text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-sothebys-blue)] dark:group-hover:text-[var(--color-gold)]'
                  }`}>
                    {school.website ? (
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-[var(--color-gold)] underline-offset-4"
                      >
                        {school.name}
                      </a>
                    ) : (
                      school.name
                    )}
                  </h4>
                </div>
                {school.distance && (
                  <span className={`text-xs font-light whitespace-nowrap px-2 py-1 ${
                    isLuxury
                      ? 'font-luxury-body text-[var(--color-warm-gray)] bg-white border border-[var(--color-taupe)]/20'
                      : 'text-[#6a6a6a] dark:text-gray-400 bg-[#f8f7f5] dark:bg-gray-800 rounded'
                  }`}>
                    {school.distance}
                  </span>
                )}
              </div>

              {/* Type Badge */}
              {school.type && (
                <div className="mb-4">
                  <span className={`inline-block text-xs uppercase ${
                    isLuxury
                      ? 'font-luxury-body text-[var(--color-gold)] font-light tracking-[0.2em]'
                      : 'tracking-[0.1em] text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)] font-medium'
                  }`}>
                    {schoolTypeLabels[school.type] || school.type}
                  </span>
                </div>
              )}

              {/* Rating */}
              {school.rating && (
                <div className={`mt-auto pt-4 border-t ${
                  isLuxury ? 'border-[var(--color-taupe)]/20' : 'border-[#e8e6e3] dark:border-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs uppercase font-light ${
                      isLuxury
                        ? 'tracking-[0.2em] text-[var(--color-warm-gray)] font-luxury-body'
                        : 'tracking-[0.1em] text-[#6a6a6a] dark:text-gray-400'
                    }`}>Rating</span>
                  </div>
                  <RatingBar rating={school.rating} variant={variant} />
                </div>
              )}

              {/* Address */}
              {school.address && !school.rating && (
                <p className={`mt-auto pt-4 text-sm font-light truncate ${
                  isLuxury
                    ? 'font-luxury-body text-[var(--color-warm-gray)]'
                    : 'text-[#6a6a6a] dark:text-gray-400'
                }`}>
                  {school.address}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
