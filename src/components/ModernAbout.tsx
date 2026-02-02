'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface ModernAboutProps {
  title?: string;
  teamMember?: {
    name?: string;
    title?: string;
    bio?: string;
    image?: any;
  };
  primaryButtonText?: string;
  primaryButtonLink?: string;
}

export default function ModernAbout({
  title = 'Uncompromising Excellence',
  teamMember,
  primaryButtonText = 'Learn More',
  primaryButtonLink = '/about',
}: ModernAboutProps) {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const imageUrl = teamMember?.image
    ? urlFor(teamMember.image).width(800).height(1000).quality(90).url()
    : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80';

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[var(--modern-gray-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image Column */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={imageUrl}
                alt={teamMember?.name || 'Team Member'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Gold accent */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-[var(--modern-gold)] opacity-50" />
          </div>

          {/* Content Column */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            {/* Section label */}
            <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-6">
              About
            </span>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] mb-8 leading-tight">
              {title}
            </h2>

            {/* Divider */}
            <div className="w-16 h-[1px] bg-[var(--modern-gold)] mb-8" />

            {/* Name and Title */}
            {teamMember?.name && (
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-normal text-[var(--modern-black)] tracking-wide">
                  {teamMember.name}
                </h3>
                {teamMember?.title && (
                  <p className="text-sm text-[var(--modern-gray-light)] uppercase tracking-[0.2em] mt-1">
                    {teamMember.title}
                  </p>
                )}
              </div>
            )}

            {/* Bio */}
            {teamMember?.bio && (
              <p className="text-[var(--modern-gray)] leading-relaxed mb-10 text-base md:text-lg font-light">
                {teamMember.bio}
              </p>
            )}

            {/* CTA Button */}
            <Link
              href={primaryButtonLink}
              className="btn-modern-outline inline-flex items-center gap-3 group"
            >
              <span>{primaryButtonText}</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
