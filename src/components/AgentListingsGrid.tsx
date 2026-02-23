'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref, type MLSProperty } from '@/lib/listings';

interface AgentListingsGridProps {
  activeListings: MLSProperty[];
  soldListings: MLSProperty[];
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

function PropertyCard({ listing, isSold }: { listing: MLSProperty; isSold?: boolean }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  // Only show gallery navigation for active listings, not sold
  const hasMultiplePhotos = !isSold && photos.length > 1;
  const currentPhoto = isSold ? (photos[0] || null) : (photos[currentPhotoIndex] || null);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageError(false);
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageError(false);
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const displayPrice = isSold && listing.sold_price ? listing.sold_price : listing.list_price;

  return (
    <Link href={getListingHref(listing)} className="group block">
      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
        {currentPhoto && !imageError ? (
          <Image
            src={currentPhoto}
            alt={listing.address || 'Property'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#c0c0c0]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

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
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {photos.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
              {photos.length > 5 && (
                <span className="text-white text-[10px] ml-1">+{photos.length - 5}</span>
              )}
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          {isSold && (
            <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-light bg-[#1a1a1a] text-white">
              Sold
            </span>
          )}
          {!isSold && listing.status && listing.status !== 'Active' && (
            <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-light bg-white/95 text-[#1a1a1a]">
              {listing.status}
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 pb-2">
        <div className="text-xl font-light text-[#1a1a1a] dark:text-white tracking-wide mb-2">
          {isSold && listing.sold_price ? (
            <>
              {formatPrice(listing.sold_price)}
              {listing.list_price && listing.list_price !== listing.sold_price && (
                <span className="text-sm text-[#6a6a6a] line-through ml-2">
                  {formatPrice(listing.list_price)}
                </span>
              )}
            </>
          ) : (
            formatPrice(listing.list_price)
          )}
        </div>
        <p className="text-sm text-[#4a4a4a] dark:text-gray-300 font-light line-clamp-1">
          {listing.address || 'Address not available'}
        </p>
        {(listing.city || listing.state || listing.zip_code) && (
          <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light mb-2">
            {[listing.city, listing.state].filter(Boolean).join(', ')}
            {listing.zip_code && ` ${listing.zip_code}`}
          </p>
        )}
        <div className="flex items-center text-xs text-[#6a6a6a] dark:text-gray-400 font-light">
          {listing.bedrooms && (
            <>
              <span>{listing.bedrooms} Beds</span>
              <span className="mx-2 text-[#d0d0d0]">|</span>
            </>
          )}
          {listing.bathrooms && (
            <>
              <span>{listing.bathrooms} Baths</span>
              {listing.square_feet && <span className="mx-2 text-[#d0d0d0]">|</span>}
            </>
          )}
          {listing.square_feet && <span>{formatSqft(listing.square_feet)}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function AgentListingsGrid({ activeListings, soldListings }: AgentListingsGridProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>(
    activeListings.length > 0 ? 'active' : 'sold'
  );

  const listings = activeTab === 'active' ? activeListings : soldListings;
  const hasActive = activeListings.length > 0;
  const hasSold = soldListings.length > 0;

  if (!hasActive && !hasSold) {
    return null;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-10">
        {hasActive && (
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]'
                : 'text-[#6a6a6a] hover:text-[#1a1a1a]'
            }`}
          >
            Active Listings ({activeListings.length})
          </button>
        )}
        {hasSold && (
          <button
            onClick={() => setActiveTab('sold')}
            className={`pb-4 text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${
              activeTab === 'sold'
                ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]'
                : 'text-[#6a6a6a] hover:text-[#1a1a1a]'
            }`}
          >
            Sold Properties ({soldListings.length})
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12">
        {listings.map((listing) => (
          <PropertyCard
            key={listing.id}
            listing={listing}
            isSold={activeTab === 'sold'}
          />
        ))}
      </div>
    </div>
  );
}
