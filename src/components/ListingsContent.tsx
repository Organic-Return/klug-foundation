'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ListingsMap from './ListingsMap';
import SavePropertyButton from './SavePropertyButton';
import { getListingHref, type MLSProperty, type SortOption } from '@/lib/listings';

interface ListingsContentProps {
  listings: MLSProperty[];
  currentPage: number;
  totalPages: number;
  total: number;
  searchParams: string;
  currentSort: SortOption;
  hasLocationFilter?: boolean;
  template?: 'classic' | 'luxury' | 'modern' | 'custom-one' | 'rcsothebys-custom';
  listingsPerRow?: 2 | 3;
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

// Property card - style varies by template
function PropertyCard({ listing, template = 'classic' }: { listing: MLSProperty; template?: 'classic' | 'luxury' | 'modern' | 'custom-one' | 'rcsothebys-custom' }) {
  const isModernStyle = template === 'modern' || template === 'custom-one';
  const isRCSothebys = template === 'rcsothebys-custom';
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];
  const hasMultiplePhotos = photos.length > 1;
  const currentPhoto = photos[currentPhotoIndex] || null;

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

  // Determine card container classes based on template
  const cardContainerClasses = template === 'classic'
    ? 'border border-gray-200 overflow-hidden'
    : isRCSothebys
    ? 'border border-[var(--rc-brown)]/30 bg-[var(--rc-cream)] overflow-hidden hover:border-[var(--rc-gold)] transition-all duration-300'
    : isModernStyle
    ? 'border border-[var(--modern-gray-lighter)] bg-white overflow-hidden hover:border-[var(--modern-gold)] transition-all duration-300'
    : '';

  // Determine aspect ratio based on template
  const aspectRatioClasses = template === 'luxury'
    ? 'aspect-[4/5]'
    : isModernStyle
    ? 'aspect-[4/3]'
    : 'aspect-[4/3]';

  return (
    <div className={`group ${cardContainerClasses}`}>
      {/* Card Image */}
      <Link href={getListingHref(listing)} className="block">
        <div className={`relative ${aspectRatioClasses} overflow-hidden bg-[var(--color-taupe)] ${template === 'luxury' ? 'border border-transparent group-hover:border-[var(--color-gold)] transition-[border-color] duration-500 ease-in-out' : ''}`}>
          {currentPhoto && !imageError ? (
            <Image
              src={currentPhoto}
              alt={listing.address || 'Property'}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}

          {/* Photo navigation arrows */}
          {hasMultiplePhotos && (
            <>
              <button
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[var(--color-charcoal)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                aria-label="Previous photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[var(--color-charcoal)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                aria-label="Next photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Photo indicator dots */}
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

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex gap-2">
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
            {listing.status && listing.status !== 'Active' && (
              <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-light bg-white/95 text-[var(--color-charcoal)]">
                {listing.status}
              </span>
            )}
          </div>

          {/* Save button */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <SavePropertyButton listingId={listing.id} listingType="mls" />
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className={template === 'classic' ? 'p-4' : isModernStyle ? 'p-5' : 'px-0 pt-1 pb-2'}>
        <h3
          className={`line-clamp-1 ${
            template === 'luxury'
              ? 'text-[var(--color-charcoal)] font-luxury'
              : isModernStyle
              ? 'text-[var(--modern-gold)] font-light tracking-wider'
              : 'text-gray-900 font-semibold'
          }`}
          style={template === 'luxury'
            ? { fontSize: '20px', fontWeight: 400, lineHeight: 1.3, letterSpacing: '0.02em', marginBottom: '1px' }
            : isModernStyle
            ? { fontSize: '1.25rem', fontWeight: 300, lineHeight: 1.2, marginBottom: '0.5rem' }
            : { fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }
          }
        >
          {formatPrice(listing.list_price)}
          {listing.status === 'Closed' && listing.sold_price && (
            <span className={`text-xs font-light ml-2 ${template === 'luxury' ? 'text-[var(--color-warm-gray)]' : 'text-gray-500'}`}>
              Sold: {formatPrice(listing.sold_price)}
            </span>
          )}
        </h3>

        <p
          className={`leading-snug line-clamp-1 ${
            template === 'luxury'
              ? 'text-[var(--color-warm-gray)] font-light font-luxury'
              : isModernStyle
              ? 'text-sm text-[var(--modern-dark)] font-normal tracking-wide'
              : 'text-sm text-gray-700'
          }`}
          style={template === 'luxury' ? { fontSize: '16px', marginBottom: '0' } : { marginBottom: '0.125rem' }}
        >
          {getStreetAddress(listing.address, listing.city, listing.state, listing.zip_code)}
        </p>
        <p
          className={`leading-snug line-clamp-1 ${
            template === 'luxury'
              ? 'text-[var(--color-warm-gray)] font-light font-luxury'
              : isModernStyle
              ? 'text-xs text-[var(--modern-gray)] uppercase tracking-[0.1em]'
              : 'text-xs text-gray-500'
          }`}
          style={template === 'luxury' ? { fontSize: '16px', marginBottom: '4px' } : { marginBottom: '0.5rem' }}
        >
          {[listing.city, listing.state].filter(Boolean).join(', ')}{listing.zip_code ? ` ${listing.zip_code}` : ''}
        </p>

        {/* Property Details */}
        <div
          className={`flex items-center gap-3 text-[10px] uppercase ${
            template === 'luxury'
              ? 'text-[var(--color-warm-gray)] tracking-[0.12em]'
              : isModernStyle
              ? 'text-[var(--modern-gray)] tracking-[0.15em] pt-3 border-t border-[var(--modern-gray-lighter)] mb-2'
              : 'text-gray-500 tracking-wider'
          }`}
        >
          {listing.bedrooms !== null && (
            <span>{listing.bedrooms} Beds</span>
          )}
          {listing.bathrooms !== null && (
            <>
              <span className={`w-px h-3 ${
                template === 'luxury'
                  ? 'bg-[var(--color-light-gray)]'
                  : isModernStyle
                  ? 'bg-[var(--modern-gray-lighter)]'
                  : 'bg-gray-300'
              }`} />
              <span>{listing.bathrooms} Baths</span>
            </>
          )}
          {listing.square_feet !== null && (
            <>
              <span className={`w-px h-3 ${
                template === 'luxury'
                  ? 'bg-[var(--color-light-gray)]'
                  : isModernStyle
                  ? 'bg-[var(--modern-gray-lighter)]'
                  : 'bg-gray-300'
              }`} />
              <span>{listing.square_feet.toLocaleString()} SF</span>
            </>
          )}
        </div>

        {/* CTA Button - Modern template */}
        {isModernStyle && (
          <Link
            href={getListingHref(listing)}
            className="inline-flex items-center gap-2 mt-4 text-[10px] uppercase tracking-[0.2em] text-[var(--modern-dark)] hover:text-[var(--modern-gold)] transition-colors duration-300 group/link"
          >
            <span>View Details</span>
            <svg
              className="w-3 h-3 transform group-hover/link:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>
    </div>
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
  searchParams: string;
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
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-[var(--color-cream)]"
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
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-[var(--color-cream)]'
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
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-[var(--color-cream)]"
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
  hasLocationFilter,
  template = 'classic',
  listingsPerRow,
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
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[var(--color-cream)]'
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
                : 'bg-white text-gray-700 border-gray-300 hover:bg-[var(--color-cream)]'
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
          <div id="listings-scroll-container" className="w-full overflow-y-auto p-4 lg:p-6 bg-[var(--color-cream)]">
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
                      <PropertyCard key={listing.id} listing={listing} template={template} />
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
            <div id="listings-scroll-container" className="w-full lg:w-1/2 overflow-y-auto p-4 lg:p-6 bg-[var(--color-cream)]">
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
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${listingsPerRow !== 2 ? 'xl:grid-cols-3' : ''}`}>
                    {displayListings.map((listing) => (
                      <PropertyCard key={listing.id} listing={listing} template={template} />
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
                hasLocationFilter={hasLocationFilter}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
