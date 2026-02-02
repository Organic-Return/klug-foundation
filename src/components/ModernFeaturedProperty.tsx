'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ModernFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  images?: string[];
  photos?: string[];
  description?: string;
}

export default function ModernFeaturedProperty({
  mlsId,
  headline = 'Featured Residence',
  buttonText = 'View Property',
}: ModernFeaturedPropertyProps) {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/listings/${mlsId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    }

    if (mlsId) {
      fetchProperty();
    }
  }, [mlsId]);

  if (loading) {
    return (
      <section className="py-24 bg-[var(--modern-dark)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-[600px] bg-[var(--modern-darker)] rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!property) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[var(--modern-dark)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-4">
            Exclusive
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white">
            {headline}
          </h2>
        </div>

        {/* Property Card */}
        <div
          className={`grid lg:grid-cols-2 gap-0 overflow-hidden transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
            <Image
              src={(property.photos?.[0] || property.images?.[0]) || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'}
              alt={property.address || 'Property'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Gold corner accent */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-[var(--modern-gold)]" />
          </div>

          {/* Content */}
          <div className="bg-[var(--modern-darker)] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            {/* Price */}
            <div className="text-[var(--modern-gold)] text-2xl md:text-3xl font-light tracking-wider mb-4">
              {formatPrice(property.price)}
            </div>

            {/* Address */}
            <h3 className="text-white text-xl md:text-2xl font-light mb-2 tracking-wide">
              {property.address}
            </h3>
            <p className="text-[var(--modern-gray-light)] text-sm uppercase tracking-[0.2em] mb-8">
              {property.city}, {property.state}
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10 pb-10 border-b border-white/10">
              <div>
                <span className="block text-2xl text-white font-light">{property.beds}</span>
                <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Bedrooms</span>
              </div>
              <div>
                <span className="block text-2xl text-white font-light">{property.baths}</span>
                <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Bathrooms</span>
              </div>
              <div>
                <span className="block text-2xl text-white font-light">{property.sqft?.toLocaleString()}</span>
                <span className="text-xs text-[var(--modern-gray-light)] uppercase tracking-[0.2em]">Sq. Ft.</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/listings/${property.id}`}
              className="btn-modern-outline inline-flex items-center gap-3 self-start group"
            >
              <span>{buttonText}</span>
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
