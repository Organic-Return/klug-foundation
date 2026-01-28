'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ListingsMap from './ListingsMap';
import SavePropertyButton from './SavePropertyButton';
import type { MLSProperty, SortOption } from '@/lib/listings';

interface ListingsContentProps {
  listings: MLSProperty[];
  currentPage: number;
  totalPages: number;
  total: number;
  searchParams: URLSearchParams;
  currentSort: SortOption;
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

function formatLotSize(acres: number | null): string {
  if (!acres) return '';
  if (acres >= 1) {
    return acres.toFixed(2) + ' acres';
  }
  const sqft = acres * 43560;
  return new Intl.NumberFormat('en-US').format(Math.round(sqft)) + ' sq ft lot';
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
function PropertyCard({ listing }: { listing: MLSProperty }) {
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
      <div className="relative aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
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

        {/* Save button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <SavePropertyButton listingId={listing.id} listingType="mls" />
        </div>

      </div>

      {/* Content */}
      <div className="pt-4 pb-2">
        {/* Price */}
        <div className="text-xl font-light text-[#1a1a1a] tracking-wide mb-2">
          {formatPrice(listing.list_price)}
          {listing.status === 'Closed' && listing.sold_price && (
            <span className="text-sm font-light text-[#8a8a8a] ml-2">
              Sold: {formatPrice(listing.sold_price)}
            </span>
          )}
        </div>

        {/* Street Address */}
        <p className="text-sm text-[#4a4a4a] font-light line-clamp-1">
          {getStreetAddress(listing.address, listing.city, listing.state, listing.zip_code)}
        </p>

        {/* City, State, Zip */}
        {(listing.city || listing.state || listing.zip_code) && (
          <p className="text-sm text-[#6a6a6a] font-light mb-2">
            {[listing.city, listing.state].filter(Boolean).join(', ')}
            {listing.zip_code && ` ${listing.zip_code}`}
          </p>
        )}

        {/* Property details - minimal separator style */}
        <div className="flex items-center text-xs text-[#6a6a6a] font-light">
          {listing.bedrooms !== null && (
            <>
              <span>{listing.bedrooms} Beds</span>
              <span className="mx-2 text-[#d0d0d0]">|</span>
            </>
          )}
          {listing.bathrooms !== null && (
            <>
              <span>{listing.bathrooms} Baths</span>
              {(listing.square_feet || listing.lot_size) && <span className="mx-2 text-[#d0d0d0]">|</span>}
            </>
          )}
          {listing.square_feet && (
            <span>{formatSqft(listing.square_feet)}</span>
          )}
          {!listing.square_feet && listing.lot_size && (
            <span>{formatLotSize(listing.lot_size)}</span>
          )}
        </div>

        {/* MLS Number */}
        <p className="text-[10px] text-[#9a9a9a] font-light uppercase tracking-[0.1em] mt-3">
          MLS# {listing.mls_number}
        </p>
      </div>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
  scrollContainerId,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: URLSearchParams;
  scrollContainerId?: string;
}) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `/listings?${params.toString()}`;
  };

  const handlePageClick = () => {
    if (scrollContainerId) {
      const container = document.getElementById(scrollContainerId);
      if (container) {
        container.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  const pages: (number | string)[] = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex justify-center items-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          onClick={handlePageClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Previous
        </Link>
      )}

      <div className="flex gap-1">
        {pages.map((page, index) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={createPageUrl(page)}
              onClick={handlePageClick}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          onClick={handlePageClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

export default function ListingsContent({
  listings,
  currentPage,
  totalPages,
  total,
  searchParams,
  currentSort,
}: ListingsContentProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [areaFilteredListings, setAreaFilteredListings] = useState<MLSProperty[] | null>(null);

  // Use area-filtered listings if available, otherwise use all listings
  const displayListings = areaFilteredListings !== null ? areaFilteredListings : listings;

  const handleDrawComplete = (filteredListings: MLSProperty[]) => {
    setAreaFilteredListings(filteredListings);
  };

  const handleDrawClear = () => {
    setAreaFilteredListings(null);
  };

  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    params.delete('page'); // Reset to page 1 when sorting changes
    router.push(`/listings?${params.toString()}`);
  };

  if (listings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No listings found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your filters to find more properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* View Toggle */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between lg:px-6 flex-shrink-0">
        {/* Property count, sort, and area filter indicator */}
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            {areaFilteredListings !== null
              ? `${areaFilteredListings.length.toLocaleString()} of ${total.toLocaleString()} properties`
              : `${total.toLocaleString()} properties found`}
          </p>
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="beds_low">Beds: Low to High</option>
            <option value="beds_high">Beds: High to Low</option>
          </select>
          {areaFilteredListings !== null && (
            <button
              onClick={handleDrawClear}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear area
            </button>
          )}
        </div>

        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List View
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map View
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {viewMode === 'list' ? (
          /* List View - Full width grid */
          <div id="listings-scroll-container" className="w-full overflow-y-auto p-4 lg:p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {displayListings.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No properties in this area</h3>
                  <p className="mt-2 text-gray-500">Try drawing a larger area or clear the area filter.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayListings.map((listing) => (
                      <PropertyCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {areaFilteredListings === null && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      searchParams={searchParams}
                      scrollContainerId="listings-scroll-container"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Map View - Split screen */
          <>
            {/* Left Side - Property Cards */}
            <div id="listings-scroll-container" className="w-full lg:w-1/2 overflow-y-auto p-4 lg:p-6 bg-gray-50">
              {displayListings.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No properties in this area</h3>
                  <p className="mt-2 text-gray-500">Try drawing a larger area or clear the area filter.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayListings.map((listing) => (
                      <PropertyCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {areaFilteredListings === null && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      searchParams={searchParams}
                      scrollContainerId="listings-scroll-container"
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Side - Map */}
            <div className="hidden lg:block lg:w-1/2 h-full">
              <ListingsMap
                listings={listings}
                onDrawComplete={handleDrawComplete}
                onDrawClear={handleDrawClear}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
