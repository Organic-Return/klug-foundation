'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Listing {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  status: string;
  property_type: string | null;
  listing_date: string | null;
  photos: string[];
}

interface RecentListingsProps {
  city: string;
  limit?: number;
  title?: string;
  subtitle?: string;
  variant?: 'classic' | 'luxury';
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return '';
  return new Intl.NumberFormat('en-US').format(sqft) + ' sq ft';
}

// Extract just the street address, removing city/state/zip if present
function getStreetAddress(fullAddress: string | null, city: string | null, state: string | null, zipCode: string | null): string {
  if (!fullAddress) return 'Address not available';

  let streetAddress = fullAddress;

  // Remove zip code if present at the end
  if (zipCode) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${zipCode}\\s*$`), '');
  }

  // Remove state if present at the end (with or without comma)
  if (state) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${state}\\s*$`, 'i'), '');
  }

  // Remove city if present at the end (with or without comma)
  if (city) {
    streetAddress = streetAddress.replace(new RegExp(`\\s*,?\\s*${city}\\s*$`, 'i'), '');
  }

  return streetAddress.trim() || 'Address not available';
}

// Sotheby's-inspired property card with elegant minimal design
function PropertyCard({ listing, variant = 'classic' }: { listing: Listing; variant?: 'classic' | 'luxury' }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const hasMultiplePhotos = photos.length > 1;
  const currentPhoto = photos[currentPhotoIndex] || null;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
        {currentPhoto ? (
          <Image
            src={currentPhoto}
            alt={listing.address || 'Property'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#c0c0c0]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Elegant hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

        {/* Photo navigation - minimal arrows */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-[#1a1a1a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
              aria-label="Previous photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-[#1a1a1a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
              aria-label="Next photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Minimal photo indicator dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {photos.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
              {photos.length > 5 && (
                <span className="text-white text-[10px] ml-1">+{photos.length - 5}</span>
              )}
            </div>
          </>
        )}

        {/* Status badge - minimal style */}
        <div className="absolute top-3 left-3 flex gap-2">
          {/* New Listing badge - show if listed within last 7 days */}
          {listing.listing_date && (() => {
            const listingDate = new Date(listing.listing_date);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
          })() && (
            <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-light bg-[var(--color-gold)] text-white">
              New
            </span>
          )}
          {/* Status badge - only show for non-Active */}
          {listing.status && listing.status !== 'Active' && (
            <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-light bg-white/95 text-[#1a1a1a]">
              {listing.status}
            </span>
          )}
        </div>

      </div>

      {/* Content */}
      <div className="pt-4 pb-2">
        {/* Price */}
        <div className={`text-xl font-light tracking-wide mb-2 ${variant === 'luxury' ? 'font-luxury text-[var(--color-charcoal)]' : 'text-[#1a1a1a] dark:text-white'}`}>
          {formatPrice(listing.list_price)}
        </div>

        {/* Street Address */}
        <p className={`text-sm font-light line-clamp-1 ${variant === 'luxury' ? 'font-luxury-body text-[var(--color-warm-gray)]' : 'text-[#4a4a4a] dark:text-gray-300'}`}>
          {getStreetAddress(listing.address, listing.city, listing.state, listing.zip_code)}
        </p>

        {/* City, State, Zip */}
        {(listing.city || listing.state || listing.zip_code) && (
          <p className={`text-sm font-light mb-2 ${variant === 'luxury' ? 'font-luxury-body text-[var(--color-warm-gray)]' : 'text-[#6a6a6a] dark:text-gray-400'}`}>
            {[listing.city, listing.state].filter(Boolean).join(', ')}
            {listing.zip_code && ` ${listing.zip_code}`}
          </p>
        )}

        {/* Property details - minimal separator style */}
        <div className={`flex items-center text-xs font-light ${variant === 'luxury' ? 'font-luxury-body text-[var(--color-warm-gray)]' : 'text-[#6a6a6a] dark:text-gray-400'}`}>
          {listing.bedrooms && (
            <>
              <span>{listing.bedrooms} Beds</span>
              <span className={`mx-2 ${variant === 'luxury' ? 'text-[var(--color-taupe)]' : 'text-[#d0d0d0]'}`}>|</span>
            </>
          )}
          {listing.bathrooms && (
            <>
              <span>{listing.bathrooms} Baths</span>
              {listing.square_feet && <span className={`mx-2 ${variant === 'luxury' ? 'text-[var(--color-taupe)]' : 'text-[#d0d0d0]'}`}>|</span>}
            </>
          )}
          {listing.square_feet && (
            <span>{formatSqft(listing.square_feet)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecentListings({
  city,
  limit = 10,
  title = 'Recent Listings',
  subtitle,
  variant = 'classic',
}: RecentListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      if (!city) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/recent-listings?city=${encodeURIComponent(city)}&limit=${limit}`
        );
        const data = await response.json();
        setListings(data.listings || []);
      } catch (error) {
        console.error('Error fetching recent listings:', error);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [city, limit]);

  if (!city) {
    return null;
  }

  const isLuxury = variant === 'luxury';

  if (isLoading) {
    return (
      <section className={`py-16 md:py-24 ${isLuxury ? 'bg-white' : 'bg-white dark:bg-[#1a1a1a]'}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="animate-pulse">
            <div className="h-10 bg-[#e8e6e3] rounded w-72 mx-auto mb-4" />
            <div className="h-4 bg-[#e8e6e3] rounded w-96 mx-auto mb-12" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="aspect-square bg-[#f5f5f5]" />
                  <div className="pt-4">
                    <div className="h-6 bg-[#e8e6e3] rounded w-28 mb-3" />
                    <div className="h-4 bg-[#e8e6e3] rounded w-full mb-2" />
                    <div className="h-3 bg-[#e8e6e3] rounded w-24 mb-3" />
                    <div className="h-3 bg-[#e8e6e3] rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className={`${isLuxury ? 'py-24 md:py-36 bg-white' : 'py-16 md:py-24 bg-white dark:bg-[#1a1a1a]'}`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Section Header */}
        {isLuxury ? (
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
              Properties
            </p>
            <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide mb-5">
              {title}
            </h2>
            <p className="font-luxury-body text-[var(--color-warm-gray)] font-light max-w-xl mx-auto text-sm tracking-wide">
              {subtitle || `The most recently listed properties in ${city}`}
            </p>
          </div>
        ) : (
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              {title}
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto">
              {subtitle || `The most recently listed properties in ${city}`}
            </p>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12">
          {listings.slice(0, 6).map((listing) => (
            <PropertyCard key={listing.id} listing={listing} variant={variant} />
          ))}
        </div>

        {/* View All Link */}
        {listings.length > 0 && (
          <div className="text-center mt-14 md:mt-16">
            {isLuxury ? (
              <Link
                href={`/listings?city=${encodeURIComponent(city)}`}
                className="group inline-flex items-center gap-4 font-luxury-body text-[var(--color-charcoal)] text-[13px] uppercase tracking-[0.25em]"
              >
                <span className="border-b border-[var(--color-charcoal)]/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-300">
                  View All Listings
                </span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/listings?city=${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-8 py-3.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a] dark:hover:border-white dark:hover:text-white"
              >
                View All Listings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
