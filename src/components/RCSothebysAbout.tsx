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

interface RCSothebysAboutProps {
  title?: string;
  teamMember?: {
    name?: string;
    slug?: { current: string };
    title?: string;
    bio?: string;
    image?: any;
    email?: string;
    phone?: string;
    mobile?: string;
    office?: string;
  };
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function RCSothebysAbout({
  title = 'About Us',
  teamMember,
  primaryButtonText = 'Learn More',
  primaryButtonLink = '/about/our-team',
}: RCSothebysAboutProps) {
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
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!teamMember) return null;

  const imageUrl = teamMember.image
    ? urlFor(teamMember.image).width(900).height(700).quality(90).url()
    : null;

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--rc-cream)] py-16 md:py-24"
      itemScope
      itemType="https://schema.org/Person"
    >
      {/* Centered Section Title */}
      <div
        className={`text-center mb-10 md:mb-14 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <h2
          className="text-[var(--rc-navy)] text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] leading-[1.1]"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          {title}
        </h2>
      </div>

      {/* Gold Divider */}
      <div
        className={`max-w-[1400px] mx-auto px-6 md:px-8 mb-10 md:mb-14 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-[2px] bg-[var(--rc-gold)]" />
      </div>

      {/* Two-column: image left, content right */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Image */}
          <div
            className={`w-full lg:w-[55%] transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={teamMember.name || 'About'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  itemProp="image"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--rc-brown)]/10" />
              )}
            </div>
          </div>

          {/* Content */}
          <div
            className={`w-full lg:w-[45%] flex flex-col justify-center transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            {/* Name as headline */}
            {teamMember.name && (
              <h3
                className="text-[var(--rc-navy)] text-xl md:text-2xl font-bold uppercase tracking-[0.1em] mb-6"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                itemProp="name"
              >
                {teamMember.name}
              </h3>
            )}

            {teamMember.title && (
              <span className="hidden" itemProp="jobTitle">{teamMember.title}</span>
            )}

            {/* Bio */}
            {teamMember.bio && (
              <p
                className="text-[var(--rc-brown)] text-base md:text-[17px] font-normal leading-[1.85] mb-8"
                itemProp="description"
              >
                {teamMember.bio}
              </p>
            )}

            {/* CTA Button */}
            {primaryButtonLink && (
              <div>
                <Link
                  href={primaryButtonLink}
                  className="inline-block bg-[var(--rc-gold)] text-white text-[11px] font-black uppercase tracking-[0.1em] px-10 py-4 hover:bg-[var(--rc-gold-hover,#b08a4f)] transition-colors duration-200"
                >
                  {primaryButtonText}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
