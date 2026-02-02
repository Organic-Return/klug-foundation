'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ModernHeroProps {
  videoUrl?: string;
  fallbackImageUrl?: string;
  title?: string;
  subtitle?: string;
}

export default function ModernHero({
  videoUrl,
  fallbackImageUrl = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
  title = 'Exceptional Properties',
  subtitle = 'Discover a curated collection of the world\'s finest residences',
}: ModernHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listings?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/listings');
    }
  };

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--modern-black)]">
      {/* Background Media - Rolex-style cinematic presentation */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.85) contrast(1.1)' }}
            poster={fallbackImageUrl}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${fallbackImageUrl})`,
              filter: 'brightness(0.85) contrast(1.1)'
            }}
          />
        )}

        {/* Modern gradient overlay - Rolex/Patek style */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--modern-black)] via-transparent to-[var(--modern-black)]/40" />
        <div className="absolute inset-0 bg-[var(--modern-black)]/20" />
      </div>

      {/* Content - Omega/Rolex inspired centered layout */}
      <div className="relative z-10 h-full flex flex-col justify-end items-center text-center px-6 pb-24 md:pb-32">
        {/* Thin gold accent line */}
        <div
          className={`w-16 h-[1px] bg-[var(--modern-gold)] mb-8 transition-all duration-1000 delay-300 ${
            isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />

        {/* Title - Patek Philippe inspired typography */}
        <h1
          className={`modern-hero-title text-white mb-6 max-w-4xl transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {title}
        </h1>

        {/* Subtitle - Clean, minimal */}
        <p
          className={`text-white/70 text-sm md:text-base font-light tracking-[0.15em] uppercase max-w-xl mb-12 transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {subtitle}
        </p>

        {/* Search Box - Modern minimal style */}
        <form
          onSubmit={handleSearch}
          className={`w-full max-w-xl transition-all duration-1000 delay-600 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex items-stretch">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, address..."
              className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/30 border-r-0 text-white text-sm placeholder-white/50 tracking-wider focus:outline-none focus:border-[var(--modern-gold)] focus:bg-white/15 transition-all duration-300"
            />
            <button
              type="submit"
              className="group flex items-center gap-3 px-8 py-4 bg-[var(--modern-gold)] text-[var(--modern-black)] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--modern-gold-light)] transition-all duration-300"
            >
              <span className="hidden sm:inline">Explore</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </form>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
