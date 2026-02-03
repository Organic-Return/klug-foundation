'use client';

import { useState, useEffect, useRef } from 'react';

interface AccoladeItem {
  type: 'number' | 'numberWithPrefix' | 'image';
  value?: string;
  prefix?: string;
  label?: string;
}

interface LuxuryQuoteBlockProps {
  title?: string;
  items?: AccoladeItem[];
}

export default function LuxuryQuoteBlock({
  title = 'The Distinction',
  items = [],
}: LuxuryQuoteBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Default items if none provided
  const displayItems = items.length > 0 ? items : [
    { type: 'number' as const, value: '25K+', label: 'Monthly Website Visitors' },
    { type: 'numberWithPrefix' as const, prefix: '#', value: '1', label: 'Most Visited Agent Site' },
    { type: 'number' as const, value: '2.5K', label: 'Active Client Network' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 md:py-44 bg-[#f6f1eb] relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f6f1eb] via-[#f3ede5] to-[#f6f1eb]" />

      <div className="relative max-w-[1200px] mx-auto px-8 lg:px-12">
        {/* Section Header - Hermès minimal style */}
        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="font-luxury-body text-[var(--color-gold)] text-[10px] uppercase tracking-[0.3em] font-light">
            Why Choose Us
          </span>

          <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto my-6" />

          <h2 className="font-luxury text-[var(--color-charcoal)] text-2xl md:text-3xl lg:text-[36px] font-extralight tracking-[0.08em]">
            {title}
          </h2>
        </div>

        {/* Stats Grid - Four Seasons elegant presentation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-16 mb-24">
          {displayItems.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${(index + 1) * 200}ms` }}
            >
              <div className="flex items-baseline justify-center mb-4">
                {item.type === 'numberWithPrefix' && item.prefix && (
                  <span className="font-luxury text-[var(--color-gold)] text-xl md:text-2xl font-extralight mr-1">
                    {item.prefix}
                  </span>
                )}
                <span className="font-luxury text-[var(--color-charcoal)] text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight">
                  {item.value}
                </span>
              </div>
              <div className="w-8 h-px bg-[var(--color-gold)]/50 mx-auto mb-4" />
              <p className="font-luxury-body text-[var(--color-warm-gray)] font-light text-[11px] uppercase tracking-[0.2em] leading-relaxed">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Quote - Hermès editorial style */}
        <div
          className={`text-center max-w-3xl mx-auto transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-px h-12 bg-[var(--color-taupe)] mx-auto mb-10" />

          <blockquote className="font-luxury text-[var(--color-warm-gray)] text-lg md:text-xl lg:text-2xl font-extralight italic leading-[1.8] tracking-wide mb-10">
            "Excellence is not a destination but a continuous journey. We are committed to
            exceeding expectations at every turn."
          </blockquote>

          <div className="w-12 h-px bg-[var(--color-gold)]/30 mx-auto" />
        </div>
      </div>
    </section>
  );
}
