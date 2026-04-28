'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface HeroVideo {
  videoUrl?: string;
  posterUrl?: string;
}

interface HeroWithSearchProps {
  videoUrl?: string;
  fallbackImageUrl?: string;
  heroVideos?: HeroVideo[];
  title?: string;
  subtitle?: string;
  seoDescription?: string;
  showSearch?: boolean;
  showTitleSubtitle?: boolean;
}

// Available cities from MLS configuration
const LOCATIONS = [
  'Aspen',
  'Basalt',
  'Carbondale',
  'El Jebel',
  'Glenwood Springs',
  'Marble',
  'Meredith',
  'New Castle',
  'Parachute',
  'Redstone',
  'Rifle',
  'Silt',
  'Snowmass',
  'Snowmass Village',
  'Thomasville',
  'Woody Creek',
];

// Property types
const PROPERTY_TYPES = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Condominium', label: 'Condo' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'RES Vacant Land', label: 'Land' },
  { value: 'Commercial Sale', label: 'Commercial' },
];

// Price ranges
const PRICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '500000', label: '$500K' },
  { value: '750000', label: '$750K' },
  { value: '1000000', label: '$1M' },
  { value: '1500000', label: '$1.5M' },
  { value: '2000000', label: '$2M' },
  { value: '3000000', label: '$3M' },
  { value: '5000000', label: '$5M' },
  { value: '7500000', label: '$7.5M' },
  { value: '10000000', label: '$10M' },
  { value: '15000000', label: '$15M' },
  { value: '20000000', label: '$20M+' },
];

export default function HeroWithSearch({
  videoUrl = '/hero-video.mp4',
  fallbackImageUrl = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
  heroVideos,
  title = 'Find Your Dream Home',
  subtitle = 'Discover the perfect property for you and your family',
  seoDescription,
  showSearch = true,
  showTitleSubtitle = true,
}: HeroWithSearchProps) {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  // Build slides array: use heroVideos if provided, otherwise fall back to test videos
  const TEST_SLIDES: HeroVideo[] = [
    { videoUrl, posterUrl: fallbackImageUrl },
    { posterUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80' },
    { posterUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80' },
  ];
  const slides: HeroVideo[] = heroVideos && heroVideos.length > 0
    ? heroVideos
    : TEST_SLIDES;

  const hasMultipleSlides = slides.length > 1;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (index === activeSlide || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide(index);
      setIsTransitioning(false);
    }, 500);
  }, [activeSlide, isTransitioning]);

  // Auto-advance slides
  useEffect(() => {
    if (!hasMultipleSlides) return;

    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 500);
    }, 12000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMultipleSlides, slides.length]);

  // Reset timer when manually changing slides
  const handleDotClick = useCallback((index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    goToSlide(index);
    // Restart auto-advance
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 500);
    }, 12000);
  }, [goToSlide, slides.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (location) params.append('city', location);
    if (propertyType) params.append('type', propertyType);
    if (priceMin) params.append('minPrice', priceMin);
    if (priceMax) params.append('maxPrice', priceMax);
    if (keyword.trim()) params.append('q', keyword.trim());

    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="relative w-full -mt-20 overflow-hidden" style={{ minHeight: 'calc(100vh + 5rem)' }}>
      {/* Video/Image Backgrounds */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            index === activeSlide && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {slide.videoUrl ? (
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster={slide.posterUrl}
            >
              <source src={slide.videoUrl} type="video/mp4" />
            </video>
          ) : slide.posterUrl ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.posterUrl})` }}
            />
          ) : null}
        </div>
      ))}

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/60 via-black/40 to-[var(--color-navy)]/70 z-[1]" />

      {/* Slide Indicator Dots - Left side, vertically centered */}
      {hasMultipleSlides && (
        <div className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
          {slides.map((_, index) => (
            <span
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => handleDotClick(index)}
              onKeyDown={(e) => e.key === 'Enter' && handleDotClick(index)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                index === activeSlide
                  ? 'w-3 h-3 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-36 pb-4" style={{ minHeight: 'calc(100vh + 5rem)' }}>
        {/* Hero Text - Centered vertically in available space */}
        <div className="flex-1 flex items-center justify-center">
          {showTitleSubtitle ? (
            <div className="text-center max-w-4xl">
              <h1 className="text-white text-shadow-luxury animate-fade-in-up animate-delay-100">
                {title}
              </h1>

              {/* Gold accent line */}
              <div className="animate-fade-in-up animate-delay-200 flex justify-center my-6">
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
              </div>

              <p className="text-lg sm:text-xl md:text-2xl text-white/90 text-shadow-luxury max-w-3xl mx-auto animate-fade-in-up animate-delay-300 font-light tracking-wide">
                {subtitle}
              </p>

              <p className="text-white/70 text-sm font-light max-w-2xl mx-auto mb-6 text-center animate-fade-in-up animate-delay-400">
                {seoDescription || 'Klug Properties, in partnership with Aspen Snowmass Sotheby\u2019s International Realty, offers unparalleled access to luxury real estate across the Roaring Fork Valley. From iconic Aspen estates to mountain residences in Snowmass Village, Basalt, and Woody Creek, we guide discerning clients to exceptional properties.'}
              </p>
            </div>
          ) : (
            // SEO-only fallback: title/subtitle/description rendered as
            // visually hidden but crawler-readable HTML when overlay is off.
            <div className="sr-only">
              <h1>{title}</h1>
              <p>{subtitle}</p>
              <p>
                {seoDescription || 'Klug Properties, in partnership with Aspen Snowmass Sotheby\u2019s International Realty, offers unparalleled access to luxury real estate across the Roaring Fork Valley. From iconic Aspen estates to mountain residences in Snowmass Village, Basalt, and Woody Creek, we guide discerning clients to exceptional properties.'}
              </p>
            </div>
          )}
        </div>

        {/* Property Search Form - Bottom - Klugproperties Style */}
        {showSearch && (
          <div className="w-full max-w-6xl animate-fade-in-up animate-delay-400">
            <h3 className="text-white text-left tracking-[0.2em] uppercase mb-6 pl-1" style={{ fontSize: '1.5rem', fontWeight: 400 }}>Property Search</h3>
            <form onSubmit={handleSearch} className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
              {/* Location Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-1">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-3 px-1 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" className="text-gray-900">Location</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} className="text-gray-900">{loc}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-white/30" />

              {/* Type Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-1">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-3 px-1 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" className="text-gray-900">Type</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value} className="text-gray-900">{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-white/30" />

              {/* Min Price Dropdown */}
              <div className="w-[calc(50%-0.5rem)] sm:w-auto sm:flex-1 lg:flex-1">
                <select
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-3 px-1 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" className="text-gray-900">Min Price</option>
                  {PRICE_OPTIONS.slice(1).map((price) => (
                    <option key={`min-${price.value}`} value={price.value} className="text-gray-900">{price.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-white/30" />

              {/* Max Price Dropdown */}
              <div className="w-[calc(50%-0.5rem)] sm:w-auto sm:flex-1 lg:flex-1">
                <select
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-3 px-1 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" className="text-gray-900">Max Price</option>
                  {PRICE_OPTIONS.slice(1).map((price) => (
                    <option key={`max-${price.value}`} value={price.value} className="text-gray-900">{price.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-white/30" />

              {/* MLS# / Keyword Input */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-1">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="MLS# / Keyword"
                  className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-3 px-1 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors placeholder:text-white/70"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="klug-search-btn sir-btn sir-btn--gold-light ml-4"
              >
                <span>Search</span>
                <span className="sir-arrow" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
