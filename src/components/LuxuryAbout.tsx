'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface TeamMember {
  name?: string;
  title?: string;
  bio?: string;
  image?: any;
}

interface LuxuryAboutProps {
  title?: string;
  teamMember?: TeamMember;
  imageUrl?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
}

export default function LuxuryAbout({
  title = 'The Art of Exceptional Service',
  teamMember,
  imageUrl,
  primaryButtonText = 'Learn More',
  primaryButtonLink = '/about/our-team',
}: LuxuryAboutProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const displayImage = imageUrl || (teamMember?.image ? null : 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80');

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

  return (
    <section ref={sectionRef} className="py-32 md:py-44 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          {/* Image Side */}
          <div
            className={`aspect-[3/4] relative overflow-hidden bg-[var(--color-cream)] transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={teamMember?.name || 'About Us'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : teamMember?.image && (
              <Image
                src={teamMember.image}
                alt={teamMember?.name || 'About Us'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
          </div>

          {/* Content Side - Four Seasons inspired elegant typography */}
          <div
            className={`lg:py-12 transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <span className="font-luxury-body text-[var(--color-gold)] text-[10px] uppercase tracking-[0.3em] font-light">
              Our Philosophy
            </span>

            <div className="w-px h-8 bg-[var(--color-sand)] my-6" />

            <h2 className="font-luxury text-[var(--color-charcoal)] text-2xl md:text-3xl lg:text-[38px] font-extralight tracking-[0.04em] mb-10 leading-[1.3]">
              {title}
            </h2>

            <p className="font-luxury-body text-[var(--color-charcoal)]/70 text-base font-light leading-[2] mb-6">
              {teamMember?.bio ||
                `We believe that finding the perfect home is about more than square footage and amenities—it's about discovering a space that reflects your aspirations and enhances your way of life.`}
            </p>

            <p className="font-luxury-body text-[var(--color-warm-gray)] text-sm font-light leading-[2] mb-12">
              Our dedicated team brings decades of experience and an unwavering commitment to excellence,
              ensuring every client receives the personalized attention their search deserves.
            </p>

            {/* Stats - Hermès minimal style */}
            <div className="flex items-center gap-16 mb-12 pb-12 border-b border-[var(--color-taupe)]">
              <div>
                <p className="text-[var(--color-charcoal)] text-3xl font-extralight tracking-tight">25+</p>
                <p className="font-luxury-body text-[var(--color-warm-gray)] text-[9px] uppercase tracking-[0.25em] mt-2">Years Experience</p>
              </div>
              <div className="w-px h-12 bg-[var(--color-taupe)]" />
              <div>
                <p className="text-[var(--color-charcoal)] text-3xl font-extralight tracking-tight">$2B+</p>
                <p className="font-luxury-body text-[var(--color-warm-gray)] text-[9px] uppercase tracking-[0.25em] mt-2">In Sales Volume</p>
              </div>
            </div>

            {/* CTA - Hermès elegant link style */}
            <Link
              href={primaryButtonLink}
              className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em] font-normal transition-all duration-500"
            >
              <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                {primaryButtonText}
              </span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
