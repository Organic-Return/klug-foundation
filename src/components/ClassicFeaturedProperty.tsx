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
  lot_size_acres: number | null;
  photos: string[];
  mls_number: string;
  status: string;
  property_type: string;
}

interface ClassicFeaturedPropertyProps {
  mlsId: string;
  headline?: string;
  buttonText?: string;
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft);
}

export default function ClassicFeaturedProperty({
  mlsId,
  headline = 'Featured Property',
  buttonText = 'View Property',
}: ClassicFeaturedPropertyProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const mainPhoto = property.photos?.[0];

  return (
    <section className="relative w-full aspect-video">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={property.address || 'Featured Property'}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-cream)] flex items-center justify-center">
            <svg
              className="w-24 h-24 text-[var(--color-warm-gray)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Subtle gradient overlay on right side */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Property details overlay - Right side, top aligned */}
      <div className="relative h-full">
        <div className="absolute top-[232px] md:top-[248px] lg:top-[264px] right-[216px] sm:right-[224px] lg:right-[248px] xl:right-[280px] text-right text-white">
          {/* Location - City, State */}
          <div className="mb-4 md:mb-6 lg:mb-8">
            <h1 className="!mt-0 !pt-0 mb-0 text-2xl md:text-3xl lg:text-4xl text-white">
              {property.city}, {property.state || 'Colorado'}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-light text-white/80 mt-2 md:mt-3">
              {property.address}
            </p>
          </div>

          {/* Price with tag icon */}
          <div className="flex items-center justify-end gap-2 mb-4 md:mb-6 lg:mb-8">
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="currentColor"
              viewBox="0 0 512 512"
            >
              <path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z" />
            </svg>
            <span className="text-xl md:text-2xl lg:text-3xl font-bold">
              {formatPrice(property.list_price)}
            </span>
          </div>

          {/* Property Vitals - Vertical layout with icons */}
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 mb-6 md:mb-8 lg:mb-10">
            {property.bedrooms !== null && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-base md:text-lg font-medium">{property.bedrooms}</span>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="32" viewBox="0 0 512 512">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M384 240H96V136a40.12 40.12 0 0140-40h240a40.12 40.12 0 0140 40v104zM48 416V304a64.19 64.19 0 0164-64h288a64.19 64.19 0 0164 64v112" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M48 416v-8a24.07 24.07 0 0124-24h368a24.07 24.07 0 0124 24v8M112 240v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16m0 0v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16" />
                </svg>
              </div>
            )}
            {property.bathrooms !== null && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-base md:text-lg font-medium">{property.bathrooms}</span>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M384 0H64C28.7 0 0 28.7 0 64v160h448V64c0-35.3-28.7-64-64-64zM16 240v48c0 66.3 53.7 120 120 120h24l-16 88h160l-16-88h24c66.3 0 120-53.7 120-120v-48H16zm208 152c-48.6 0-88-39.4-88-88h176c0 48.6-39.4 88-88 88z" />
                </svg>
              </div>
            )}
            {property.square_feet !== null && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-base md:text-lg font-medium">{formatSqft(property.square_feet)} sf</span>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 19H19V14H10V5H5V7H7V9H5V11H8V13H5V15H7V17H5V19H7V17H9V19H11V16H13V19H15V17H17V19ZM12 12H20C20.5523 12 21 12.4477 21 13V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V12Z" />
                </svg>
              </div>
            )}
            {property.lot_size_acres !== null && property.lot_size_acres > 0 && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-base md:text-lg font-medium">{property.lot_size_acres.toFixed(2)} ac</span>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fill="none" d="M24 24H0V0h24v24z" />
                  <path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8l2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z" />
                </svg>
              </div>
            )}
          </div>

          {/* View Property Button */}
          <Link
            href={`/listings/${property.id}`}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 bg-[var(--color-gold)] text-white px-6 py-3 hover:bg-transparent border border-transparent hover:border-white"
          >
            {buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
