'use client';

import { useState, useEffect, useRef } from 'react';

interface AccoladeItem {
  value?: string;
  label?: string;
}

interface ModernQuoteBlockProps {
  title?: string;
  items?: AccoladeItem[];
}

export default function ModernQuoteBlock({
  title = 'The Standard of Excellence',
  items = [],
}: ModernQuoteBlockProps) {
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

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[var(--modern-black)] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            var(--modern-gold) 40px,
            var(--modern-gold) 41px
          )`
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Title */}
        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide">
            {title}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {items.map((item, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Value */}
              <div className="text-4xl md:text-5xl lg:text-6xl font-light text-[var(--modern-gold)] mb-4 tracking-wide">
                {item.value}
              </div>
              {/* Label */}
              <div className="text-xs md:text-sm text-white/60 uppercase tracking-[0.2em]">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div
          className={`w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mt-20 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />
      </div>
    </section>
  );
}
