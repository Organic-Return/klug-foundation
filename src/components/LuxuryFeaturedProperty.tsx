'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/listings';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
  mls_number: string;
  status: string;
  property_type: string;
}

interface LuxuryFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

export default function LuxuryFeaturedProperty({
  mlsId,
  headline = 'Featured Residence',
  buttonText = 'Explore This Property',
}: LuxuryFeaturedPropertyProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
        setIsLoading(false);
      }
    }
    if (mlsId) {
      fetchProperty();
    }
  }, [mlsId]);

  if (isLoading || !property) {
    return null;
  }

  const mainPhoto = property.photos?.[activeImageIndex] || property.photos?.[0];
  const thumbnails = property.photos?.slice(0, 4) || [];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[var(--color-gold)] text-sm uppercase tracking-[0.3em] font-medium mb-4">
            {headline}
          </p>
          <h2 className="text-[var(--color-navy)] text-4xl md:text-5xl font-light tracking-wide">
            {property.address}
          </h2>
          <p className="text-gray-500 mt-4 text-lg">
            {property.city}, {property.state}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-[4/3] mb-4 overflow-hidden bg-gray-100">
              {mainPhoto && (
                <Image
                  src={mainPhoto}
                  alt={property.address}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
            </div>

            {/* Thumbnails */}
            {thumbnails.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {thumbnails.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative aspect-square overflow-hidden ${
                      activeImageIndex === index ? 'ring-2 ring-[var(--color-gold)]' : ''
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`View ${index + 1}`}
                      fill
                      className="object-cover hover:opacity-80 transition-opacity"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-5xl md:text-6xl font-light text-[var(--color-navy)] mb-2">
                {formatPrice(property.list_price)}
              </p>
              <span className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-xs uppercase tracking-wider">
                {property.status}
              </span>
            </div>

            <div className="w-16 h-px bg-[var(--color-gold)] mb-8" />

            {/* Property Stats */}
            <div className="grid grid-cols-3 gap-8 mb-10">
              {property.bedrooms !== null && (
                <div>
                  <p className="text-3xl font-light text-[var(--color-navy)]">{property.bedrooms}</p>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Bedrooms</p>
                </div>
              )}
              {property.bathrooms !== null && (
                <div>
                  <p className="text-3xl font-light text-[var(--color-navy)]">{property.bathrooms}</p>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Bathrooms</p>
                </div>
              )}
              {property.square_feet && (
                <div>
                  <p className="text-3xl font-light text-[var(--color-navy)]">
                    {property.square_feet.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">Sq Ft</p>
                </div>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-2">
              MLS# {property.mls_number}
            </p>
            <p className="text-gray-500 mb-10">
              {property.property_type}
            </p>

            {/* CTA */}
            <Link
              href={`/listings/${property.id}`}
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a] w-fit"
            >
              {buttonText}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
