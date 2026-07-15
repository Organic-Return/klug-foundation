'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MuxPlayer from '@mux/mux-player-react';

interface HeroVideo {
  videoUrl?: string;
  muxPlaybackId?: string;
  posterUrl?: string;
}

// Subset of the HTMLMediaElement controls we touch on each slide change.
// MuxPlayer's element forwards these, so a single ref type works for
// both <video> and <MuxPlayer> entries.
type MediaCtrl = HTMLMediaElement | null;

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

// Property types. `param` decides which filter the value belongs to: Condo and
// Townhouse live in property_sub_type, not property_type, so sending them as
// `type` matched nothing.
const PROPERTY_TYPES = [
  { value: 'Residential', param: 'type', label: 'Single Family' },
  { value: 'Condominium', param: 'subtype', label: 'Condo' },
  { value: 'Townhouse', param: 'subtype', label: 'Townhouse' },
  { value: 'RES Vacant Land', param: 'type', label: 'Land' },
  { value: 'Commercial Sale', param: 'type', label: 'Commercial' },
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
  title = 'Find Your Dream Home in Aspen & Snowmass',
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
  // Skip video playback in local dev by default — the hero loop on a
  // developer's machine reloading 100× a day was the bulk of the Sanity
  // bandwidth bill, and on Mux that traffic would just become a Mux
  // bandwidth bill. Render the poster image instead. Set
  // NEXT_PUBLIC_HERO_VIDEOS_IN_DEV=1 in .env.local when you actually
  // need to QA video playback locally.
  const skipVideosInDev =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_HERO_VIDEOS_IN_DEV !== '1';

  // Desktop vs mobile hero. Starts false (SSR-safe: server and first client
  // render match), then a matchMedia effect flips it on >=768px viewports.
  const [isDesktop, setIsDesktop] = useState(false);

  const rawSlides: HeroVideo[] = heroVideos && heroVideos.length > 0
    ? heroVideos
    : TEST_SLIDES;
  const desktopSlides: HeroVideo[] = skipVideosInDev
    ? rawSlides.map((s) => ({ posterUrl: s.posterUrl }))
    : rawSlides;
  // Mobile gets a single static poster image — no autoplay video on the
  // critical path (heavy on cellular, and iOS commonly blocks autoplay anyway).
  // Desktop keeps the full rotating video hero and upgrades to it after mount.
  const slides: HeroVideo[] = isDesktop
    ? desktopSlides
    : [{ posterUrl: desktopSlides[0]?.posterUrl || fallbackImageUrl }];

  const hasMultipleSlides = slides.length > 1;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Defer video element/source rendering until after first paint so the
  // poster image can become LCP without competing with the MP4 download.
  const [videosReady, setVideosReady] = useState(false);
  // Gate video playback on the LCP poster having actually painted, so the hero
  // image wins Largest Contentful Paint before any video stream competes for
  // bandwidth. On throttled mobile this is the difference between a fast poster
  // paint and a multi-second LCP.
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const videoRefs = useRef<MediaCtrl[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const start = () => setVideosReady(true);
    if (heroImageLoaded) {
      // Poster painted — pull in video once the main thread is idle.
      const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
      if (ric) {
        ric(start, { timeout: 1000 });
        return;
      }
      const id = window.setTimeout(start, 200);
      return () => window.clearTimeout(id);
    }
    // Hard fallback so the hero never stays static if onLoad never fires
    // (image error, aggressive cache, etc.).
    const cap = window.setTimeout(start, 6000);
    return () => window.clearTimeout(cap);
  }, [heroImageLoaded]);

  // Switch between the mobile (single static image) and desktop (video) hero.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => {
      setIsDesktop(mq.matches);
      if (!mq.matches) setActiveSlide(0);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const advanceToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 500);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (index === activeSlide || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide(index);
      setIsTransitioning(false);
    }, 500);
  }, [activeSlide, isTransitioning]);

  // Auto-advance: video slides advance via the <video> onEnded handler
  // (so each video plays in full); image-only slides fall back to a
  // fixed display duration since there is no "ended" event for an img.
  useEffect(() => {
    if (!hasMultipleSlides) return;
    const current = slides[activeSlide];
    // Either source kind (Mux or native) emits `onEnded` and drives the
    // advance itself; only image-only slides need the timer fallback.
    if (current?.videoUrl || current?.muxPlaybackId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advanceToNext, 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasMultipleSlides, slides, activeSlide, advanceToNext]);

  // Pause inactive videos and start the active one from the beginning
  // so every slide plays its full video before advancing.
  useEffect(() => {
    if (!videosReady) return;
    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === activeSlide) {
        try { el.currentTime = 0; } catch {}
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [activeSlide, videosReady]);

  const handleDotClick = useCallback((index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    goToSlide(index);
  }, [goToSlide]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (location) params.append('city', location);
    if (propertyType) {
      const option = PROPERTY_TYPES.find((t) => t.value === propertyType);
      params.append(option?.param === 'subtype' ? 'subtype' : 'type', propertyType);
    }
    if (priceMin) params.append('minPrice', priceMin);
    if (priceMax) params.append('maxPrice', priceMax);
    if (keyword.trim()) params.append('q', keyword.trim());

    router.push(`/real-estate-for-sale?${params.toString()}`);
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
          {slide.muxPlaybackId ? (
            videosReady && index === activeSlide ? (
              // Mux-backed slide. MuxPlayer forwards standard HTMLMediaElement
              // controls (play/pause/currentTime/onEnded) so the rotating-
              // hero lifecycle stays identical to the native <video> path.
              // maxResolution caps streaming bitrate to protect the Mux
              // bill the way we'd want to protect Sanity's.
              <MuxPlayer
                ref={(el) => {
                  videoRefs.current[index] = (el as unknown as HTMLMediaElement) || null;
                }}
                playbackId={slide.muxPlaybackId}
                streamType="on-demand"
                autoPlay="muted"
                {...(slides.length === 1 ? { loop: true } : {})}
                muted
                playsInline
                maxResolution="1080p"
                poster={slide.posterUrl}
                className="w-full h-full"
                style={{
                  // Hide the built-in player chrome for a background-video
                  // feel, and fill the hero area like the native <video>.
                  ['--controls' as any]: 'none',
                  ['--media-object-fit' as any]: 'cover',
                  width: '100%',
                  height: '100%',
                }}
                onEnded={() => {
                  if (slides.length > 1 && index === activeSlide) {
                    advanceToNext();
                  }
                }}
              />
            ) : slide.posterUrl ? (
              <Image
                src={slide.posterUrl}
                alt=""
                fill
                priority={index === 0}
                onLoad={() => { if (index === 0) setHeroImageLoaded(true); }}
                onError={() => { if (index === 0) setHeroImageLoaded(true); }}
                sizes="100vw"
                className="object-cover"
              />
            ) : null
          ) : slide.videoUrl ? (
            videosReady && index === activeSlide ? (
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                autoPlay
                {...(slides.length === 1 ? { loop: true } : {})}
                muted
                playsInline
                preload={index === activeSlide ? 'auto' : 'none'}
                className="w-full h-full object-cover"
                poster={slide.posterUrl}
                onEnded={() => {
                  if (slides.length > 1 && index === activeSlide) {
                    advanceToNext();
                  }
                }}
              >
                <source src={slide.videoUrl} type="video/mp4" />
              </video>
            ) : slide.posterUrl ? (
              // Pre-paint placeholder so the LCP image renders without
              // pulling in the MP4 download on the critical path. Use
              // next/image with priority on the first slide so the
              // browser preloads the LCP candidate.
              <Image
                src={slide.posterUrl}
                alt=""
                fill
                priority={index === 0}
                onLoad={() => { if (index === 0) setHeroImageLoaded(true); }}
                onError={() => { if (index === 0) setHeroImageLoaded(true); }}
                sizes="100vw"
                className="object-cover"
              />
            ) : null
          ) : slide.posterUrl ? (
            <Image
              src={slide.posterUrl}
              alt=""
              fill
              priority={index === 0}
              onLoad={() => { if (index === 0) setHeroImageLoaded(true); }}
              onError={() => { if (index === 0) setHeroImageLoaded(true); }}
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
        </div>
      ))}

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/60 via-black/40 to-[var(--color-navy)]/70 z-[1]" />

      {/* Slide Indicator Dots - Left side, vertically centered */}
      {hasMultipleSlides && (
        <div className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3" role="tablist" aria-label="Hero slide selector">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeSlide}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => handleDotClick(index)}
              className={`transition-all duration-300 rounded-full cursor-pointer p-0 border-0 ${
                index === activeSlide
                  ? 'w-3 h-3 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
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
          <div className="w-full max-w-6xl animate-fade-in-up animate-delay-400 mb-[100px]">
            <h3 className="text-white text-left tracking-[0.2em] uppercase mb-6 pl-1" style={{ fontSize: '1.5rem', fontWeight: 400 }}>Property Search</h3>
            <form onSubmit={handleSearch} className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
              {/* Location Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-1">
                <select
                  aria-label="Location"
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
                  aria-label="Property type"
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
                  aria-label="Minimum price"
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
                  aria-label="Maximum price"
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
                  aria-label="MLS number or keyword"
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
