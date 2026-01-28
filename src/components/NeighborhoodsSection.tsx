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
  communitySlug: string;
  communityTitle: string;
}

interface NeighborhoodsSectionProps {
  title?: string;
  subtitle?: string;
}

export default function NeighborhoodsSection({
  title = 'Explore Neighborhoods',
  subtitle = 'Discover the perfect neighborhood for your lifestyle',
}: NeighborhoodsSectionProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNeighborhoods() {
      try {
        const response = await fetch('/api/community-neighborhoods');
        const data = await response.json();
        setNeighborhoods(data.neighborhoods || []);
      } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        setNeighborhoods([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNeighborhoods();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto mb-12" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (neighborhoods.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide">
            {title}
          </h2>
          <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Neighborhoods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {neighborhoods.map((neighborhood) => (
            <Link
              key={`${neighborhood.communitySlug}-${neighborhood.slug.current}`}
              href={`/communities/${neighborhood.communitySlug}#${neighborhood.slug.current}`}
              className="group block bg-white dark:bg-[#242424] overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800 overflow-hidden">
                {neighborhood.image?.asset?.url ? (
                  <Image
                    src={neighborhood.image.asset.url}
                    alt={neighborhood.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                )}
                {/* Overlay with community name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.2em] font-light">
                    {neighborhood.communityTitle}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-serif font-light text-[#1a1a1a] dark:text-white mb-2 group-hover:text-[var(--color-gold)] transition-colors duration-300">
                  {neighborhood.name}
                </h3>
                {neighborhood.description && (
                  <p className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light line-clamp-2">
                    {neighborhood.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
