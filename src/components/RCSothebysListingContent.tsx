'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MLSProperty } from '@/lib/listings';
import PropertyMap from '@/components/PropertyMap';
import SavePropertyButton from '@/components/SavePropertyButton';
import { getUTMData } from './UTMCapture';

interface ListingAgentInfo {
  name: string;
  slug: { current: string };
  title?: string;
  imageUrl?: string | null;
  email?: string;
  phone?: string;
  mobile?: string;
}

interface RCSothebysListingContentProps {
  listing: MLSProperty;
  agent: ListingAgentInfo | null;
  coAgent?: ListingAgentInfo | null;
  googleMapsApiKey?: string;
}

// Left arrow — triangle points left, internal arrows point left
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right, internal arrows point right
function NextArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M-0.00140381 172.407L86 86.4058L-0.00141885 0.404426L-0.00140381 172.407Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M86 86.4058L86.7071 87.1129L87.4142 86.4058L86.7071 85.6987L86 86.4058ZM-0.00140381 172.407L-1.0014 172.407L-1.0014 174.821L0.705704 173.114L-0.00140381 172.407ZM-0.00141885 0.404426L0.705689 -0.302681L-1.00142 -2.00979L-1.00142 0.404427L-0.00141885 0.404426ZM85.2929 85.6987L-0.708511 171.7L0.705704 173.114L86.7071 87.1129L85.2929 85.6987ZM-0.708526 1.11153L85.2929 87.1129L86.7071 85.6987L0.705689 -0.302681L-0.708526 1.11153ZM-1.00142 0.404427L-1.0014 172.407L0.998596 172.407L0.998581 0.404426L-1.00142 0.404427Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.2656 87.1572H20.2656L20.2656 85.6572H28.2656L62.3931 85.6572L49.2081 72.4647L50.2656 71.4072L64.5156 85.6572H70.3931L57.2081 72.4647L58.2656 71.4072L73.2656 86.4072L58.2656 101.407L57.2006 100.35L70.3931 87.1572H64.5156L50.2656 101.407L49.2006 100.35L62.3931 87.1572L28.2656 87.1572Z" fill="#002349"/>
    </svg>
  );
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function RCSothebysListingContent({
  listing,
  agent,
  coAgent,
  googleMapsApiKey,
}: RCSothebysListingContentProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

  // Contact form state
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [tourInPerson, setTourInPerson] = useState(false);
  const [tourVirtual, setTourVirtual] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName || !formEmail) return;
    setFormSubmitting(true);
    setFormError('');

    const tourTypes = [tourInPerson && 'In Person', tourVirtual && 'Virtual'].filter(Boolean);
    const leadType = tourTypes.length > 0 ? 'schedule_tour' : 'property_inquiry';
    const tourInfo = tourTypes.length > 0 ? `\n\nTour preference: ${tourTypes.join(', ')}` : '';
    const fullMessage = (formMessage || '') + tourInfo;

    try {
      const utm = getUTMData();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone || undefined,
          message: fullMessage || undefined,
          leadType,
          propertyAddress: listing.address || `Property ${listing.mls_number}`,
          propertyMlsId: listing.mls_number || undefined,
          propertyPrice: listing.list_price || undefined,
          source: 'Property Detail Page',
          sourceUrl: utm.source_url,
          referrer: utm.referrer,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          utmContent: utm.utm_content,
          utmTerm: utm.utm_term,
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setFormSubmitted(true);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };
  const photos = listing.photos || [];

  const handlePrevPhoto = useCallback(() => {
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);
  const handleNextPhoto = useCallback(() => {
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback((index?: number) => {
    if (index !== undefined) setActivePhotoIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, closeLightbox, handlePrevPhoto, handleNextPhoto]);

  // Truncate description for "Read More"
  const description = listing.description || '';
  const shouldTruncate = description.length > 600;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.slice(0, 600) + '...'
    : description;

  return (
    <div className="min-h-screen bg-[var(--rc-cream)]">
      {/* Hero Image with Navigation — exclusive listings only */}
      {agent && (
        <div className="relative w-full h-screen">
          {/* Photo Slideshow */}
          {photos.length > 0 ? (
            <>
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === activePhotoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {failedPhotos.has(index) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={photo}
                      alt={`${listing.address || 'Property'} - Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={index === 0}
                      onError={() => setFailedPhotos((prev) => new Set(prev).add(index))}
                    />
                  )}
                </div>
              ))}

              {/* Photo Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20"
                    aria-label="Previous photo"
                  >
                    <div className="w-[30px] h-[60px] md:w-[43px] md:h-[86px] lg:w-[52px] lg:h-[104px]">
                      <PrevArrow />
                    </div>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20"
                    aria-label="Next photo"
                  >
                    <div className="w-[30px] h-[60px] md:w-[43px] md:h-[86px] lg:w-[52px] lg:h-[104px]">
                      <NextArrow />
                    </div>
                  </button>

                  {/* Photo counter + fullscreen */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <div className="bg-black/50 text-white text-xs px-3 py-1.5 tracking-wider">
                      {activePhotoIndex + 1} / {photos.length}
                    </div>
                    <button
                      onClick={() => openLightbox()}
                      className="bg-black/50 text-white p-1.5 hover:bg-black/70 transition-colors"
                      aria-label="View fullscreen gallery"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-[var(--rc-navy)]/10 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}

          {/* Property Info Bar — on hero */}
          <div className="absolute bottom-[124px] md:bottom-[132px] left-4 md:left-8 lg:left-12 z-20 bg-white/95 backdrop-blur-sm shadow-lg border-t-[3px] border-[var(--rc-gold)]">
            <div className="flex items-center">
              <div className="px-5 py-3 md:px-6 md:py-4">
                <h1
                  className="text-[var(--rc-navy)] font-bold uppercase tracking-[0.1em] line-clamp-1"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', fontSize: '1rem' }}
                >
                  {listing.address?.split(',')[0] || listing.address}
                </h1>
                <div className="text-[var(--rc-brown)]/70 text-xs uppercase tracking-[0.1em] mt-0.5">
                  {listing.city}{listing.state ? `, ${listing.state}` : ''} {listing.zip_code}
                </div>
                <div className="text-[var(--rc-navy)] text-base md:text-lg font-bold mt-1">
                  {formatPrice(listing.list_price)}
                </div>
              </div>
              <div className="w-[2px] self-stretch bg-[var(--rc-gold)]" />
              <div className="px-5 py-3 md:px-6 md:py-4 grid grid-cols-2 gap-x-5 gap-y-1.5 text-[var(--rc-brown)] text-xs">
                {listing.bedrooms !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span>{listing.bedrooms}</span>
                  </div>
                )}
                {listing.bathrooms !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{listing.bathrooms}</span>
                  </div>
                )}
                {listing.square_feet && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    <span>{listing.square_feet.toLocaleString()} SQ FT</span>
                  </div>
                )}
              </div>
              <div className="pr-4 md:pr-5">
                <SavePropertyButton listingId={listing.id} listingType="mls" variant="icon" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer — exclusive only */}
      {agent && <div className="h-[50px] bg-[var(--rc-cream)]" />}

      {/* Breadcrumbs — non-exclusive only */}
      {!agent && (
        <div className="bg-[var(--rc-navy)]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-3">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase">
                <li>
                  <Link href="/" className="text-white/50 hover:text-white/80 transition-colors">Home</Link>
                </li>
                <li className="text-white/30">/</li>
                <li>
                  <Link href="/listings" className="text-white/50 hover:text-white/80 transition-colors">Listings</Link>
                </li>
                <li className="text-white/30">/</li>
                <li className="text-white/80">{listing.address?.split(',')[0] || listing.mls_number}</li>
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Two-Column Content */}
      <div className={`max-w-[1400px] mx-auto px-6 md:px-8 pb-16 md:pb-24 ${!agent ? 'pt-10' : ''}`}>
        {/* Property Info Card — full width, non-exclusive only */}
        {!agent && (
          <div className="bg-white shadow-lg border-t-[3px] border-[var(--rc-gold)] mb-8">
            <div className="px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex-1 min-w-0">
                <h1
                  className="text-[var(--rc-navy)] font-bold uppercase tracking-[0.1em] line-clamp-1"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', fontSize: '1.125rem' }}
                >
                  {listing.address?.split(',')[0] || listing.address}
                </h1>
                <div className="text-[var(--rc-brown)]/70 text-xs uppercase tracking-[0.1em] mt-0.5">
                  {listing.city}{listing.state ? `, ${listing.state}` : ''} {listing.zip_code}
                </div>
              </div>
              <div className="text-[var(--rc-navy)] text-xl md:text-2xl font-bold">
                {formatPrice(listing.list_price)}
              </div>
              <div className="flex items-center gap-4 text-[var(--rc-brown)] text-xs">
                {listing.bedrooms !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span>{listing.bedrooms} BD</span>
                  </div>
                )}
                {listing.bathrooms !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{listing.bathrooms} BA</span>
                  </div>
                )}
                {listing.square_feet && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    <span>{listing.square_feet.toLocaleString()} SF</span>
                  </div>
                )}
              </div>
              <div>
                <SavePropertyButton listingId={listing.id} listingType="mls" variant="icon" />
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${agent ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(0,900px)_1fr]'} gap-12 lg:gap-16`}>
          {/* Left Column: Property Details */}
          <div>
            {/* Compact Gallery — non-exclusive listings only */}
            {!agent && (
              <div className="mb-8">
              <div className="relative aspect-[4/3] overflow-hidden">
                {photos.length > 0 ? (
                  <>
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          index === activePhotoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        {failedPhotos.has(index) ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        ) : (
                          <Image
                            src={photo}
                            alt={`${listing.address || 'Property'} - Photo ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="900px"
                            priority={index === 0}
                            onError={() => setFailedPhotos((prev) => new Set(prev).add(index))}
                          />
                        )}
                      </div>
                    ))}

                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevPhoto}
                          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20"
                          aria-label="Previous photo"
                        >
                          <div className="w-[30px] h-[60px] md:w-[36px] md:h-[72px]">
                            <PrevArrow />
                          </div>
                        </button>
                        <button
                          onClick={handleNextPhoto}
                          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20"
                          aria-label="Next photo"
                        >
                          <div className="w-[30px] h-[60px] md:w-[36px] md:h-[72px]">
                            <NextArrow />
                          </div>
                        </button>

                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                          <div className="bg-black/50 text-white text-xs px-3 py-1.5 tracking-wider">
                            {activePhotoIndex + 1} / {photos.length}
                          </div>
                          <button
                            onClick={() => openLightbox()}
                            className="bg-black/50 text-white p-1.5 hover:bg-black/70 transition-colors"
                            aria-label="View fullscreen gallery"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[var(--rc-navy)]/10 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-12 md:w-20 md:h-14 overflow-hidden transition-all duration-200 ${
                        index === activePhotoIndex
                          ? 'ring-2 ring-[var(--rc-gold)] opacity-100'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                      aria-label={`View photo ${index + 1}`}
                    >
                      <Image
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Heading */}
            <h3
              className="text-[var(--rc-navy)] text-lg md:text-xl font-bold uppercase tracking-[0.1em] mb-4"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
            >
              {listing.address?.split(',')[0] || 'Property Details'}
            </h3>

            {/* Gold divider */}
            <div className="w-full h-[2px] bg-[var(--rc-gold)] mb-6" />

            {/* Subheading */}
            <p
              className="text-[var(--rc-gold)] text-base font-normal mb-6"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
            >
              {listing.city}{listing.state ? `, ${listing.state}` : ''} {listing.zip_code}
            </p>

            {/* Description */}
            {description && (
              <div className="mb-8">
                <p className="text-[var(--rc-brown)] text-base leading-[1.85] whitespace-pre-wrap">
                  {displayDescription}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-4 text-[var(--rc-navy)] text-sm font-bold uppercase tracking-[0.1em] flex items-center gap-2 hover:text-[var(--rc-gold)] transition-colors"
                  >
                    {showFullDescription ? 'Read Less' : 'Read More'}
                    <svg className={`w-3 h-3 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Property Details Grid */}
            <div className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                  <span className="text-[var(--rc-brown)]/60 text-sm">MLS #</span>
                  <span className="text-[var(--rc-navy)] text-sm font-medium">{listing.mls_number}</span>
                </div>
                {listing.property_type && (
                  <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                    <span className="text-[var(--rc-brown)]/60 text-sm">Type</span>
                    <span className="text-[var(--rc-navy)] text-sm font-medium">{listing.property_type}</span>
                  </div>
                )}
                {listing.year_built && (
                  <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                    <span className="text-[var(--rc-brown)]/60 text-sm">Year Built</span>
                    <span className="text-[var(--rc-navy)] text-sm font-medium">{listing.year_built}</span>
                  </div>
                )}
                {listing.lot_size && (
                  <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                    <span className="text-[var(--rc-brown)]/60 text-sm">Lot Size</span>
                    <span className="text-[var(--rc-navy)] text-sm font-medium">
                      {listing.lot_size >= 1 ? `${listing.lot_size.toFixed(2)} Acres` : `${(listing.lot_size * 43560).toLocaleString()} Sq Ft`}
                    </span>
                  </div>
                )}
                {listing.subdivision_name && (
                  <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                    <span className="text-[var(--rc-brown)]/60 text-sm">Subdivision</span>
                    <span className="text-[var(--rc-navy)] text-sm font-medium">{listing.subdivision_name}</span>
                  </div>
                )}
                {listing.days_on_market !== null && listing.days_on_market !== undefined && (
                  <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--rc-brown)]/10">
                    <span className="text-[var(--rc-brown)]/60 text-sm">Days on Market</span>
                    <span className="text-[var(--rc-navy)] text-sm font-medium">{listing.days_on_market}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form + Share + Agent */}
          <div className="space-y-8">
            {/* Request More Information Form */}
            <div className="bg-[var(--rc-navy)] p-6 md:p-8">
              <h3
                className="text-sm md:text-lg font-bold uppercase tracking-[0.08em] md:tracking-[0.15em] mb-6 whitespace-nowrap"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
              >
                Request More Information
              </h3>
              {formSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--rc-gold)]/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Request Sent!</p>
                  <p className="text-white/60 text-sm">An agent will respond within 24 hours.</p>
                </div>
              ) : (
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b border-white/30 text-white text-sm py-2.5 px-0 placeholder:text-white/40 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b border-white/30 text-white text-sm py-2.5 px-0 placeholder:text-white/40 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-white/30 text-white text-sm py-2.5 px-0 placeholder:text-white/40 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/30 text-white text-sm py-2.5 px-0 placeholder:text-white/40 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
                />
                <textarea
                  placeholder="Message..."
                  rows={3}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/30 text-white text-sm py-2.5 px-0 placeholder:text-white/40 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors resize-none"
                />

                {/* Schedule a Property Tour */}
                <div className="pt-4">
                  <h4
                    className="text-[10px] font-bold uppercase tracking-[0.08em] md:tracking-[0.15em] mb-3 whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
                  >
                    Schedule a Property Tour
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tourInPerson}
                        onChange={(e) => setTourInPerson(e.target.checked)}
                        className="w-4 h-4 border-white/30 bg-transparent text-[var(--rc-gold)] focus:ring-[var(--rc-gold)] rounded-sm"
                      />
                      <span className="text-white/70 text-sm">In Person Onsite Tour</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tourVirtual}
                        onChange={(e) => setTourVirtual(e.target.checked)}
                        className="w-4 h-4 border-white/30 bg-transparent text-[var(--rc-gold)] focus:ring-[var(--rc-gold)] rounded-sm"
                      />
                      <span className="text-white/70 text-sm">Virtual Online Tour</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={formSubmitting || !formFirstName || !formLastName || !formEmail}
                    className="bg-transparent border border-white/30 text-white text-[11px] font-bold uppercase tracking-[0.15em] px-8 py-3 hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formSubmitting ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
              )}
            </div>

            {/* Share Property */}
            <div className="pt-4">
              <h4
                className="text-sm font-bold uppercase tracking-[0.1em] mb-3"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
              >
                Share Property
              </h4>
              <div className="flex items-center gap-3">
                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(listing.address || 'Check out this property')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[var(--rc-brown)]/20 flex items-center justify-center text-[var(--rc-brown)] hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[var(--rc-brown)]/20 flex items-center justify-center text-[var(--rc-brown)] hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* Instagram */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full border border-[var(--rc-brown)]/20 flex items-center justify-center text-[var(--rc-brown)] hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(listing.address || 'Property')}&body=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  className="w-8 h-8 rounded-full border border-[var(--rc-brown)]/20 flex items-center justify-center text-[var(--rc-brown)] hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Agent Cards */}
            {agent && (
              <div className="space-y-6">
                {/* Listing Agent */}
                <div className="flex items-start gap-5">
                  {/* Agent Photo */}
                  {agent.imageUrl ? (
                    <Link href={`/agents/${agent.slug.current}`} className="flex-shrink-0">
                      <div className="relative w-28 h-36 overflow-hidden grayscale hover:grayscale-0 transition-all duration-300">
                        <Image
                          src={agent.imageUrl}
                          alt={agent.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="w-28 h-36 bg-[var(--rc-navy)]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-10 h-10 text-[var(--rc-brown)]/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}

                  {/* Agent Info */}
                  <div className="min-w-0 pt-2">
                    <Link
                      href={`/agents/${agent.slug.current}`}
                      className="text-[var(--rc-navy)] text-base font-bold uppercase tracking-[0.08em] hover:text-[var(--rc-gold)] transition-colors"
                      style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                    >
                      {agent.name}
                    </Link>
                    {agent.title && (
                      <p className="text-[var(--rc-brown)] text-sm mt-0.5">{agent.title}</p>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {agent.phone && (
                        <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {agent.phone}
                        </a>
                      )}
                      {agent.mobile && agent.mobile !== agent.phone && (
                        <a href={`tel:${agent.mobile}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {agent.mobile}
                        </a>
                      )}
                      {agent.email && (
                        <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {agent.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Co-Listing Agent */}
                {coAgent && (
                  <div>
                    <p className="text-[var(--rc-brown)]/60 text-xs uppercase tracking-[0.15em] mb-3">Co-Listing Agent</p>
                    <div className="flex items-start gap-5">
                      {coAgent.imageUrl ? (
                        <Link href={`/agents/${coAgent.slug.current}`} className="flex-shrink-0">
                          <div className="relative w-28 h-36 overflow-hidden grayscale hover:grayscale-0 transition-all duration-300">
                            <Image
                              src={coAgent.imageUrl}
                              alt={coAgent.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </div>
                        </Link>
                      ) : (
                        <div className="w-28 h-36 bg-[var(--rc-navy)]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-10 h-10 text-[var(--rc-brown)]/30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 pt-2">
                        <Link
                          href={`/agents/${coAgent.slug.current}`}
                          className="text-[var(--rc-navy)] text-base font-bold uppercase tracking-[0.08em] hover:text-[var(--rc-gold)] transition-colors"
                          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                        >
                          {coAgent.name}
                        </Link>
                        {coAgent.title && (
                          <p className="text-[var(--rc-brown)] text-sm mt-0.5">{coAgent.title}</p>
                        )}
                        <div className="mt-3 space-y-1.5">
                          {coAgent.phone && (
                            <a href={`tel:${coAgent.phone}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                              <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {coAgent.phone}
                            </a>
                          )}
                          {coAgent.mobile && coAgent.mobile !== coAgent.phone && (
                            <a href={`tel:${coAgent.mobile}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                              <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {coAgent.mobile}
                            </a>
                          )}
                          {coAgent.email && (
                            <a href={`mailto:${coAgent.email}`} className="flex items-center gap-2 text-[var(--rc-brown)] text-sm hover:text-[var(--rc-gold)] transition-colors">
                              <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {coAgent.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILS Section — Navy Background */}
      <section className="bg-[var(--rc-navy)] py-16 md:py-24">
        {/* Details Title */}
        <div className="text-center mb-10 md:mb-14">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em', color: '#c19b5f' }}
          >
            Details
          </h2>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-8 space-y-10">
          {/* Listing Overview — moved to top */}
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-[0.15em] mb-3"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
            >
              Listing Overview
            </h3>
            <div className="w-full h-[1px] bg-[var(--rc-gold)]/40 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Listing Price</div>
                <div className="text-white text-sm">{formatPrice(listing.list_price)}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">MLS #</div>
                <div className="text-white text-sm">{listing.mls_number}</div>
              </div>
              {listing.status && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Status</div>
                  <div className="text-white text-sm capitalize">{listing.status}</div>
                </div>
              )}
              {listing.listing_date && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Listed</div>
                  <div className="text-white text-sm">
                    {new Date(listing.listing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {listing.days_on_market !== null && listing.days_on_market !== undefined && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Days on Market</div>
                  <div className="text-white text-sm">{listing.days_on_market}</div>
                </div>
              )}
              {listing.bathrooms_full !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Full Baths</div>
                  <div className="text-white text-sm">{listing.bathrooms_full}</div>
                </div>
              )}
              {listing.bathrooms_half !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Half Baths</div>
                  <div className="text-white text-sm">{listing.bathrooms_half}</div>
                </div>
              )}
              {listing.bathrooms_three_quarter !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">3/4 Baths</div>
                  <div className="text-white text-sm">{listing.bathrooms_three_quarter}</div>
                </div>
              )}
            </div>
          </div>

          {/* Essential Info */}
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-[0.15em] mb-3"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
            >
              Essential Info
            </h3>
            <div className="w-full h-[1px] bg-[var(--rc-gold)]/40 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              {listing.lot_size !== null && listing.lot_size !== undefined && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Lot Size</div>
                  <div className="text-white text-sm">
                    {listing.lot_size >= 1 ? `${listing.lot_size.toFixed(2)} Acres` : `${(listing.lot_size * 43560).toLocaleString()} Sq Ft`}
                  </div>
                </div>
              )}
              {listing.bedrooms !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Bedrooms</div>
                  <div className="text-white text-sm">{listing.bedrooms}</div>
                </div>
              )}
              {listing.bathrooms !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Bathrooms</div>
                  <div className="text-white text-sm">{listing.bathrooms}</div>
                </div>
              )}
              {listing.square_feet !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Sq. Ft.</div>
                  <div className="text-white text-sm">{listing.square_feet.toLocaleString()}</div>
                </div>
              )}
              {listing.property_type && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Property Type</div>
                  <div className="text-white text-sm">{listing.property_type}</div>
                </div>
              )}
              {listing.year_built !== null && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Built</div>
                  <div className="text-white text-sm">{listing.year_built}</div>
                </div>
              )}
              {listing.subdivision_name && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Subdivision</div>
                  <div className="text-white text-sm">{listing.subdivision_name}</div>
                </div>
              )}
              {listing.mls_area_minor && (
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Area</div>
                  <div className="text-white text-sm">{listing.mls_area_minor}</div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {(listing.cooling?.length || listing.heating?.length || listing.parking_features?.length || listing.laundry_features?.length || listing.fireplace_features?.length || listing.furnished) && (
            <div>
              <h3
                className="text-sm font-bold uppercase tracking-[0.15em] mb-3"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
              >
                Features
              </h3>
              <div className="w-full h-[1px] bg-[var(--rc-gold)]/40 mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
                {listing.cooling && listing.cooling.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Cooling</div>
                    <div className="text-white text-sm">{listing.cooling.join(', ')}</div>
                  </div>
                )}
                {listing.heating && listing.heating.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Heating</div>
                    <div className="text-white text-sm">{listing.heating.join(', ')}</div>
                  </div>
                )}
                {listing.parking_features && listing.parking_features.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Parking</div>
                    <div className="text-white text-sm">{listing.parking_features.join(', ')}</div>
                  </div>
                )}
                {listing.laundry_features && listing.laundry_features.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Laundry</div>
                    <div className="text-white text-sm">{listing.laundry_features.join(', ')}</div>
                  </div>
                )}
                {listing.fireplace_features && listing.fireplace_features.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Fireplace</div>
                    <div className="text-white text-sm">{listing.fireplace_features.join(', ')}</div>
                  </div>
                )}
                {listing.fireplace_total !== null && listing.fireplace_total !== undefined && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Fireplaces</div>
                    <div className="text-white text-sm">{listing.fireplace_total}</div>
                  </div>
                )}
                {listing.furnished && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Furnished</div>
                    <div className="text-white text-sm">{listing.furnished}</div>
                  </div>
                )}
                {listing.attached_garage_yn !== null && listing.attached_garage_yn !== undefined && (
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-[0.1em] mb-1">Attached Garage</div>
                    <div className="text-white text-sm">{listing.attached_garage_yn ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {listing.association_amenities && listing.association_amenities.length > 0 && (
            <div>
              <h3
                className="text-sm font-bold uppercase tracking-[0.15em] mb-3"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: '#c19b5f' }}
              >
                Amenities
              </h3>
              <div className="w-full h-[1px] bg-[var(--rc-gold)]/40 mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3">
                {listing.association_amenities.map((amenity, index) => (
                  <div key={index} className="text-white text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[var(--rc-gold)] rotate-45 flex-shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Media Section — Gallery / Video / Virtual Tour */}
      <MediaSection listing={listing} isExclusive={!!agent} />

      {/* Map Section */}
      {listing.latitude && listing.longitude && (
        <section className="bg-gray-100 border-t border-[var(--rc-brown)]/10">
          <div className="max-w-[1400px] mx-auto px-6 md:px-8 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[var(--rc-navy)] text-sm font-bold uppercase tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                Location
              </h2>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--rc-gold)] text-sm hover:underline flex items-center gap-1"
              >
                Get Directions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <PropertyMap
              latitude={listing.latitude}
              longitude={listing.longitude}
              address={listing.address || undefined}
              price={listing.list_price}
              googleMapsApiKey={googleMapsApiKey}
            />
          </div>
        </section>
      )}

      {/* MLS Disclaimer + PACMLS Attribution */}
      <div className="bg-[var(--rc-cream)] py-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8">
          {/* PACMLS Source */}
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/pacmls-logo.svg"
              alt="PACMLS - Pacific Regional Multiple Listing Service"
              width={100}
              height={43}
              className="flex-shrink-0"
            />
            <span className="text-[var(--rc-brown)] text-xs font-medium uppercase tracking-[0.1em]">
              Source: PACMLS
            </span>
          </div>

          {/* Listing Courtesy — non-exclusive only */}
          {!agent && listing.list_office_name && (
            <p className="text-[var(--rc-brown)] text-xs mb-3">
              Listing Courtesy of {listing.list_office_name}
            </p>
          )}

          <p className="text-[var(--rc-brown)]/40 text-xs leading-relaxed">
            MLS# {listing.mls_number} — Listing information is deemed reliable but not guaranteed. All measurements and square footage are approximate.
          </p>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <div className="text-white/60 text-sm tracking-wider">
              {activePhotoIndex + 1} / {photos.length}
            </div>
            <div className="text-white text-sm tracking-[0.1em] uppercase hidden md:block">
              {listing.address?.split(',')[0]}
            </div>
            <button
              onClick={closeLightbox}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close gallery"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main image area */}
          <div className="flex-1 flex items-center justify-center relative min-h-0 px-4 md:px-16">
            {/* Prev */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 md:left-4 z-10 text-white/50 hover:text-white transition-colors"
              aria-label="Previous photo"
            >
              <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px]">
                <PrevArrow />
              </div>
            </button>

            <div className="relative w-full h-full max-w-6xl mx-auto">
              {failedPhotos.has(activePhotoIndex) ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="mt-4">Photo unavailable</p>
                  </div>
                </div>
              ) : (
                <Image
                  src={photos[activePhotoIndex]}
                  alt={`${listing.address || 'Property'} - Photo ${activePhotoIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                  onError={() => setFailedPhotos((prev) => new Set(prev).add(activePhotoIndex))}
                />
              )}
            </div>

            {/* Next */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 md:right-4 z-10 text-white/50 hover:text-white transition-colors"
              aria-label="Next photo"
            >
              <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px]">
                <NextArrow />
              </div>
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex-shrink-0 px-6 py-4">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhotoIndex(index)}
                  className={`relative flex-shrink-0 w-14 h-10 md:w-16 md:h-12 overflow-hidden transition-all duration-200 ${
                    index === activePhotoIndex
                      ? 'ring-2 ring-[var(--rc-gold)] opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tabbed media section: Gallery, Video, Virtual Tour
function MediaSection({ listing, isExclusive }: { listing: MLSProperty; isExclusive: boolean }) {
  const hasPhotos = listing.photos && listing.photos.length > 0;
  const hasVirtualTour = !!listing.virtual_tour_url;
  const hasVideo = listing.video_urls && listing.video_urls.length > 0;

  // For exclusive listings, show gallery tab + video/tour tabs
  // For non-exclusive, keep the existing video/tour only behavior
  const showGallery = isExclusive && hasPhotos;
  const tabCount = (showGallery ? 1 : 0) + (hasVideo ? 1 : 0) + (hasVirtualTour ? 1 : 0);

  // Determine default tab
  const defaultTab = showGallery ? 'gallery' : hasVideo ? 'video' : 'tour';
  const [activeTab, setActiveTab] = useState<'gallery' | 'video' | 'tour'>(defaultTab);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (tabCount === 0) return null;

  const photos = listing.photos || [];

  return (
    <section className="bg-[var(--rc-navy)] py-16 md:py-24">
      <div className="text-center mb-10 md:mb-14">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] mb-8"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em', color: '#c19b5f' }}
        >
          Media
        </h2>
        {/* Tabs — only show if more than one tab */}
        {tabCount > 1 && (
          <div className="flex items-center justify-center gap-1">
            {showGallery && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
                  activeTab === 'gallery'
                    ? 'bg-[var(--rc-gold)] text-white'
                    : 'bg-transparent border border-white/30 text-white/70 hover:text-white hover:border-white/60'
                }`}
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gallery
                </span>
              </button>
            )}
            {hasVideo && (
              <button
                onClick={() => setActiveTab('video')}
                className={`px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
                  activeTab === 'video'
                    ? 'bg-[var(--rc-gold)] text-white'
                    : 'bg-transparent border border-white/30 text-white/70 hover:text-white hover:border-white/60'
                }`}
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Video
                </span>
              </button>
            )}
            {hasVirtualTour && (
              <button
                onClick={() => setActiveTab('tour')}
                className={`px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
                  activeTab === 'tour'
                    ? 'bg-[var(--rc-gold)] text-white'
                    : 'bg-transparent border border-white/30 text-white/70 hover:text-white hover:border-white/60'
                }`}
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Virtual Tour
                </span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        {/* Gallery Tab */}
        {activeTab === 'gallery' && photos.length > 0 && (
          <div>
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <Image
                src={photos[galleryIndex]}
                alt={`${listing.address || 'Property'} - Photo ${galleryIndex + 1}`}
                fill
                className="object-cover"
                sizes="1400px"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hover:scale-105 transition-transform duration-200"
                    aria-label="Previous photo"
                  >
                    <div className="w-[30px] h-[60px] md:w-[43px] md:h-[86px] lg:w-[52px] lg:h-[104px]">
                      <PrevArrow />
                    </div>
                  </button>
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hover:scale-105 transition-transform duration-200"
                    aria-label="Next photo"
                  >
                    <div className="w-[30px] h-[60px] md:w-[43px] md:h-[86px] lg:w-[52px] lg:h-[104px]">
                      <NextArrow />
                    </div>
                  </button>
                  <div className="absolute top-4 right-4 z-10 bg-black/50 text-white text-xs px-3 py-1.5 tracking-wider">
                    {galleryIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setGalleryIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-14 overflow-hidden transition-all duration-200 ${
                      index === galleryIndex
                        ? 'ring-2 ring-[var(--rc-gold)] opacity-100'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <Image
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Tab */}
        {activeTab === 'video' && listing.video_urls && (
          <div className="space-y-8">
            {listing.video_urls.map((url, index) => (
              <div key={index} className="aspect-video w-full">
                {url.includes('brightcove') ? (
                  <iframe
                    src={url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="encrypted-media"
                    title={`Property Video ${index + 1}`}
                  />
                ) : (
                  <video
                    src={url}
                    controls
                    className="w-full h-full bg-black"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Virtual Tour Tab */}
        {activeTab === 'tour' && listing.virtual_tour_url && (
          <div className="aspect-video w-full">
            <iframe
              src={listing.virtual_tour_url}
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking"
              title="Virtual Tour"
            />
          </div>
        )}
      </div>
    </section>
  );
}
