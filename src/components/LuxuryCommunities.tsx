'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CommunityItem {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  imageUrl?: string;
}

interface LuxuryCommunitiesProps {
  title?: string;
  communities: CommunityItem[];
}

export default function LuxuryCommunities({
  title = 'Our Communities',
  communities,
}: LuxuryCommunitiesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (communities.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-24 md:py-36 bg-white relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Header */}
        <div
          className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
            Communities
          </p>
          <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide">
            {title}
          </h2>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {communities.map((community, index) => (
            <Link
              key={community._id}
              href={`/communities/${community.slug.current}`}
              className={`group block transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {community.imageUrl ? (
                  <Image
                    src={community.imageUrl}
                    alt={community.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-charcoal)]" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="font-luxury text-white text-xl md:text-2xl font-light tracking-[0.04em] mb-2">
                    {community.title}
                  </h3>
                  {community.description && (
                    <p className="font-luxury-body text-white/70 text-sm font-light leading-relaxed line-clamp-2">
                      {community.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Link
            href="/communities"
            className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
          >
            <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
              Explore All Communities
            </span>
            <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
