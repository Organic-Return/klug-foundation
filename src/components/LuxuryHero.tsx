'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LuxuryHeroProps {
  videoUrl?: string;
  fallbackImageUrl?: string;
  title?: string;
  subtitle?: string;
}

export default function LuxuryHero({
  videoUrl,
  fallbackImageUrl = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
  title = 'Extraordinary Residences',
  subtitle = 'Discover an unparalleled collection of luxury properties, where exceptional living meets timeless elegance',
}: LuxuryHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Staggered animation entrance
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
    <section className="relative w-full h-screen min-h-[800px] overflow-hidden bg-[#1a1a1a]">
      {/* Background Media - Hermès style with subtle movement */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.7) contrast(1.05)' }}
            poster={fallbackImageUrl}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center transform scale-105 transition-transform duration-[20000ms] ease-linear"
            style={{
              backgroundImage: `url(${fallbackImageUrl})`,
              filter: 'brightness(0.7) contrast(1.05)'
            }}
          />
        )}

        {/* Refined gradient overlay - Hermès inspired */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" />
      </div>

      {/* Content - Four Seasons inspired centered layout */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
        {/* Title - Hermès inspired refined typography */}
        <h1
          className={`font-luxury text-white uppercase mb-8 max-w-5xl transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {title}
        </h1>

        {/* Subtitle - refined and elegant */}
        <p
          className={`font-luxury-body text-white/60 text-sm md:text-base font-light tracking-[0.03em] max-w-lg mb-12 leading-[1.8] transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {subtitle}
        </p>

        {/* Search Box with Explore Button - Hermès minimal style */}
        <form
          onSubmit={handleSearch}
          className={`w-full max-w-2xl transition-all duration-1000 delay-600 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex items-stretch">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Address, city, neighborhood..."
              className="font-luxury-body flex-1 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 border-r-0 text-white text-sm placeholder-white/30 tracking-[0.05em] focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-500"
            />
            <button
              type="submit"
              className="font-luxury-body group flex items-center gap-4 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[13px] uppercase tracking-[0.25em] font-normal hover:bg-white/20 hover:border-white/40 transition-all duration-500"
            >
              <span className="hidden sm:inline border-b border-white/30 pb-1 group-hover:border-white transition-colors duration-500">Explore Properties</span>
              <span className="sm:hidden border-b border-white/30 pb-1 group-hover:border-white transition-colors duration-500">Search</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
