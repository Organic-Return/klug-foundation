'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MLSProperty } from '@/lib/listings';
import PropertyMap from '@/components/PropertyMap';

interface ListingAgentInfo {
  name: string;
  slug: { current: string };
  title?: string;
  imageUrl?: string | null;
  email?: string;
  phone?: string;
  mobile?: string;
}

interface DocumentInfo {
  _key: string;
  title: string;
  documentType: string;
  file: { asset: { url: string; originalFilename?: string } };
  description?: string;
}

interface CustomOneListingContentProps {
  listing: MLSProperty;
  agent: ListingAgentInfo | null;
  documents?: DocumentInfo[];
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

// ─────────────────────────────────────────────
// Photo Gallery with Lightbox
// ─────────────────────────────────────────────
function PhotoGallery({ photos, address }: { photos: string[]; address: string }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setSelectedImage(null), []);
  const goToPrevious = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null
    );
  }, [photos.length]);
  const goToNext = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null
    );
  }, [photos.length]);

  useEffect(() => {
    if (selectedImage === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, closeLightbox, goToPrevious, goToNext]);

  if (!photos || photos.length === 0) return null;

  // Show up to 12 photos in the grid
  const displayPhotos = photos.slice(0, 12);

  return (
    <section id="gallery" className="py-24 lg:py-32 bg-[var(--modern-black)] relative overflow-hidden">
      {/* Textured background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
          <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">Gallery</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mt-4 tracking-wide text-white font-serif">
            A Visual Journey
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--modern-gold)] ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo}
                  alt={`${address} - Photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-sm tracking-[0.2em] uppercase">
                    {index + 1} / {photos.length}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {photos.length > 12 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setSelectedImage(12)}
              className="text-sm tracking-[0.2em] uppercase text-[var(--modern-gold)] hover:text-white transition-colors"
            >
              View All {photos.length} Photos
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-[var(--modern-gold)] transition-colors z-10"
            aria-label="Close gallery"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 text-white hover:text-[var(--modern-gold)] transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative w-full max-w-5xl aspect-video mx-12">
            <Image
              src={photos[selectedImage]}
              alt={`${address} - Photo ${selectedImage + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <button
            onClick={goToNext}
            className="absolute right-4 md:right-8 text-white hover:text-[var(--modern-gold)] transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-6 text-white text-center">
            <p className="text-xs text-white/60 mt-1">
              {selectedImage + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Contact Form Section
// ─────────────────────────────────────────────
function ContactSection({ listing, agent }: { listing: MLSProperty; agent: ListingAgentInfo | null }) {
  const propertyAddress = listing.address?.split(',')[0] || listing.address || 'this property';

  return (
    <section id="contact" className="py-20 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)] mb-4 block">
            Schedule a Private Showing
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[var(--modern-black)] mb-6">Inquire About This Property</h2>
          <div className="w-24 h-px bg-[var(--modern-gold)] mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Agent Info */}
          <div className="space-y-8">
            {agent && (
              <div className="flex items-start gap-6">
                {agent.imageUrl && (
                  <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                    <Image
                      src={agent.imageUrl}
                      alt={agent.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-2xl text-[var(--modern-black)] mb-4">Your Private Consultation Awaits</h3>
                  <p className="text-[var(--modern-gray)] leading-relaxed text-sm">
                    Experience the unparalleled luxury of {propertyAddress} with a personalized tour.
                    Our dedicated team is available to answer your questions and arrange a private viewing.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {agent && (
                <>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-[var(--modern-gold)] uppercase mb-2">
                      Listing Agent
                    </p>
                    <Link
                      href={`/team/${agent.slug.current}`}
                      className="text-[var(--modern-black)] font-serif text-lg hover:text-[var(--modern-gold)] transition-colors"
                    >
                      {agent.name}
                    </Link>
                    {agent.title && (
                      <p className="text-[var(--modern-gray)] text-sm">{agent.title}</p>
                    )}
                  </div>

                  {agent.phone && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[var(--modern-gold)] uppercase mb-2">
                        Direct Line
                      </p>
                      <a
                        href={`tel:${agent.phone}`}
                        className="text-[var(--modern-black)] font-serif text-lg hover:text-[var(--modern-gold)] transition-colors"
                      >
                        {agent.phone}
                      </a>
                    </div>
                  )}

                  {agent.email && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-[var(--modern-gold)] uppercase mb-2">
                        Email
                      </p>
                      <a
                        href={`mailto:${agent.email}`}
                        className="text-[var(--modern-black)] font-serif text-lg hover:text-[var(--modern-gold)] transition-colors"
                      >
                        {agent.email}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-6 border-t border-[var(--modern-black)]/10">
              <p className="text-[var(--modern-gray)] text-sm italic">
                All inquiries are handled with the utmost discretion and confidentiality.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[var(--modern-gray-lighter)] p-8 md:p-10">
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="co-firstName" className="text-[10px] tracking-[0.15em] text-[var(--modern-gray)] uppercase block">
                    First Name
                  </label>
                  <input
                    id="co-firstName"
                    name="firstName"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder:text-[var(--modern-gray)] focus:border-[var(--modern-gold)] focus:outline-none transition-colors"
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="co-lastName" className="text-[10px] tracking-[0.15em] text-[var(--modern-gray)] uppercase block">
                    Last Name
                  </label>
                  <input
                    id="co-lastName"
                    name="lastName"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder:text-[var(--modern-gray)] focus:border-[var(--modern-gold)] focus:outline-none transition-colors"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="co-email" className="text-[10px] tracking-[0.15em] text-[var(--modern-gray)] uppercase block">
                  Email Address
                </label>
                <input
                  id="co-email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-white border border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder:text-[var(--modern-gray)] focus:border-[var(--modern-gold)] focus:outline-none transition-colors"
                  placeholder="Email Address"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="co-phone" className="text-[10px] tracking-[0.15em] text-[var(--modern-gray)] uppercase block">
                  Phone Number
                </label>
                <input
                  id="co-phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-3 bg-white border border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder:text-[var(--modern-gray)] focus:border-[var(--modern-gold)] focus:outline-none transition-colors"
                  placeholder="Phone Number"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="co-message" className="text-[10px] tracking-[0.15em] text-[var(--modern-gray)] uppercase block">
                  Message
                </label>
                <textarea
                  id="co-message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder:text-[var(--modern-gray)] focus:border-[var(--modern-gold)] focus:outline-none transition-colors resize-none"
                  placeholder={`I'm interested in learning more about ${propertyAddress}...`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--modern-gold)] hover:bg-[#c99158] text-white font-medium tracking-[0.15em] uppercase py-4 transition-all duration-300 text-sm"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Scrollable Gallery Modal
// ─────────────────────────────────────────────
function ScrollableGalleryModal({
  photos,
  address,
  isOpen,
  onClose,
}: {
  photos: string[];
  address: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[var(--modern-gold)] text-xs tracking-[0.3em] uppercase">Gallery</span>
            <p className="text-white font-serif text-lg mt-1">{address}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[var(--modern-gold)] transition-colors p-2"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {photos.map((photo, index) => (
          <div key={index} className="relative">
            <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
              <Image
                src={photo}
                alt={`${address} - Photo ${index + 1}`}
                fill
                className="object-contain bg-black"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            <p className="text-center text-white/50 text-sm mt-3 tracking-wide">
              {index + 1} of {photos.length}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <button
            onClick={onClose}
            className="text-sm tracking-[0.2em] uppercase text-[var(--modern-gold)] hover:text-white transition-colors"
          >
            Close Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function CustomOneListingContent({
  listing,
  agent,
  documents,
}: CustomOneListingContentProps) {
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  const heroPhoto = listing.photos?.[0];
  const streetAddress = listing.address?.split(',')[0] || listing.address || 'Property';
  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');

  // Build stat features from listing data
  const features: Array<{ icon: React.ReactNode; label: string; value: string }> = [];

  if (listing.bedrooms !== null) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Bedrooms',
      value: listing.bedrooms.toString(),
    });
  }

  if (listing.bathrooms !== null) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      label: 'Bathrooms',
      value: listing.bathrooms.toString(),
    });
  }

  if (listing.square_feet) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
      label: 'Living Area',
      value: `${listing.square_feet.toLocaleString()} SF`,
    });
  }

  if (listing.lot_size) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      label: 'Lot Size',
      value: listing.lot_size >= 1
        ? `${listing.lot_size.toFixed(2)} Acres`
        : `${(listing.lot_size * 43560).toLocaleString()} SF`,
    });
  }

  if (listing.year_built) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Year Built',
      value: listing.year_built.toString(),
    });
  }

  if (listing.property_type) {
    features.push({
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'Type',
      value: listing.property_type,
    });
  }

  const hasVirtualTour = listing.virtual_tour_url && listing.virtual_tour_url.includes('matterport');
  const hasDocuments = documents && documents.length > 0;
  const hasMap = listing.latitude && listing.longitude;

  return (
    <div className="-mt-20 min-h-screen bg-[var(--modern-black)]">
      {/* ═══ HERO ═══ */}
      <section className="relative h-screen w-full overflow-hidden">
        {heroPhoto ? (
          <Image
            src={heroPhoto}
            alt={`${listing.address} - Main Photo`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--modern-black)] to-[#2a3a4d]" />
        )}

        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {listing.status === 'Active' && (
            <span className="text-[var(--modern-gold)] text-sm tracking-[0.4em] uppercase mb-4">
              Exclusive Listing
            </span>
          )}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-wide mb-6 font-serif">
            {streetAddress}
          </h1>
          <p className="text-white/80 text-lg md:text-xl tracking-[0.3em] uppercase">
            {cityState}
          </p>
          <div className="mt-12 flex items-center gap-3 text-white/60">
            <span className="w-12 h-px bg-white/30" />
            <span className="text-sm tracking-[0.2em]">Scroll to Explore</span>
            <span className="w-12 h-px bg-white/30" />
          </div>
        </div>

        {/* Hero Buttons - Bottom Left */}
        <div className="absolute bottom-8 left-8 flex items-center gap-4">
          {listing.photos && listing.photos.length > 0 && (
            <button
              onClick={() => setGalleryModalOpen(true)}
              className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-[var(--modern-gold)] hover:border-[var(--modern-gold)] hover:text-[var(--modern-black)] transition-all duration-300 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm tracking-[0.15em] uppercase">Gallery</span>
              <span className="text-xs text-white/60 group-hover:text-[var(--modern-black)]/60">
                {listing.photos.length} Photos
              </span>
            </button>
          )}
          {listing.virtual_tour_url && listing.virtual_tour_url.includes('matterport') && (
            <a
              href="#virtual-tour"
              className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-[var(--modern-gold)] hover:border-[var(--modern-gold)] hover:text-[var(--modern-black)] transition-all duration-300 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm tracking-[0.15em] uppercase">Virtual Tour</span>
            </a>
          )}
        </div>
      </section>

      {/* Scrollable Gallery Modal */}
      <ScrollableGalleryModal
        photos={listing.photos || []}
        address={streetAddress}
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
      />

      {/* ═══ PROPERTY DETAILS ═══ */}
      <section id="property" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left: Description */}
            <div>
              <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">
                The Residence
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mt-4 mb-8 tracking-wide text-[var(--modern-black)] font-serif">
                {streetAddress}
              </h2>
              {listing.description ? (
                <div className="space-y-6 text-[var(--modern-gray)] leading-relaxed">
                  {listing.description.split('\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--modern-gray)] leading-relaxed">
                  Contact us for more details about this exceptional property.
                </p>
              )}
            </div>

            {/* Right: Price + Stats */}
            <div>
              <div className="border-t border-b border-[var(--modern-black)]/10 py-8 mb-8">
                <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">
                  {listing.status === 'Closed' ? 'Sold Price' : 'Asking Price'}
                </span>
                <p className="text-4xl md:text-5xl font-light mt-2 tracking-wide text-[var(--modern-black)] font-serif">
                  {formatPrice(listing.status === 'Closed' ? listing.sold_price : listing.list_price)}
                </p>
                {listing.status === 'Closed' && listing.sold_date && (
                  <p className="text-[var(--modern-gray)] text-sm mt-2">
                    Sold on{' '}
                    <time dateTime={listing.sold_date}>
                      {new Date(listing.sold_date).toLocaleDateString()}
                    </time>
                  </p>
                )}
              </div>

              {features.length > 0 && (
                <>
                  <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)] block mb-6">
                    At a Glance
                  </span>
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    {features.map((feature) => (
                      <div
                        key={feature.label}
                        className="text-center p-6 bg-[var(--modern-gray-lighter)] border border-[var(--modern-black)]/5"
                      >
                        <span className="text-[var(--modern-gold)] flex justify-center mb-3">
                          {feature.icon}
                        </span>
                        <p className="text-2xl font-light mb-1 text-[var(--modern-black)]">{feature.value}</p>
                        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--modern-gray)]">
                          {feature.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <a
                href="#contact"
                className="inline-flex items-center justify-center w-full py-4 bg-[var(--modern-gold)] border border-[var(--modern-gold)] text-white text-sm tracking-[0.2em] uppercase hover:bg-[var(--modern-black)] hover:border-[var(--modern-black)] transition-all duration-300"
              >
                Schedule Private Viewing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PHOTO GALLERY ═══ */}
      <PhotoGallery photos={listing.photos || []} address={streetAddress} />

      {/* ═══ VIRTUAL TOUR ═══ */}
      {hasVirtualTour && (
        <section id="virtual-tour" className="py-24 lg:py-32 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">
                Immersive Experience
              </span>
              <h2 className="text-4xl md:text-5xl font-light mt-4 tracking-wide text-[var(--modern-black)] font-serif">
                Virtual Tour
              </h2>
            </div>

            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={listing.virtual_tour_url!}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
                allow="xr-spatial-tracking"
                loading="lazy"
                title={`Virtual Tour - ${listing.address}`}
              />
            </div>

            <p className="text-center text-[var(--modern-gray)] mt-8 text-sm tracking-wide">
              Explore the property in stunning 3D detail. Click and drag to navigate through the space.
            </p>
          </div>
        </section>
      )}

      {/* ═══ DOCUMENTS ═══ */}
      {hasDocuments && (
        <section className="py-20 bg-[#1f2d3d]">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)] mb-4 block">
                Property Information
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-white">Documents &amp; Disclosures</h2>
            </div>

            <div className="space-y-4">
              {documents!.map((doc) => (
                <a
                  key={doc._key}
                  href={doc.file.asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-6 p-6 bg-[var(--modern-black)] border border-white/[0.06] hover:border-[var(--modern-gold)]/50 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[var(--modern-gold)]/10 flex items-center justify-center group-hover:bg-[var(--modern-gold)]/20 transition-colors">
                    <svg className="w-6 h-6 text-[var(--modern-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="font-serif text-lg text-white group-hover:text-[var(--modern-gold)] transition-colors">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-white/50 mt-1 line-clamp-1">{doc.description}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-3">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-white/40 bg-white/[0.06] px-3 py-1">
                      {doc.documentType || 'PDF'}
                    </span>
                    <div className="w-10 h-10 border border-white/[0.06] flex items-center justify-center group-hover:border-[var(--modern-gold)] group-hover:bg-[var(--modern-gold)]/10 transition-all">
                      <svg className="w-4 h-4 text-white/50 group-hover:text-[var(--modern-gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ LOCATION / MAP ═══ */}
      {hasMap && (
        <section id="location" className="py-24 lg:py-32 bg-[var(--modern-black)] relative overflow-hidden">
          {/* Textured background */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`,
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">
                  Location
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mt-4 mb-8 tracking-wide text-white font-serif">
                  {cityState}
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <svg className="w-5 h-5 text-[var(--modern-gold)] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-white mb-1">Property Address</p>
                      <p className="text-white/70 text-sm">
                        {listing.address}
                      </p>
                    </div>
                  </div>

                  {listing.neighborhood && (
                    <div className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-[var(--modern-gold)] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <div>
                        <p className="font-medium text-white mb-1">Neighborhood</p>
                        <p className="text-white/70 text-sm">{listing.neighborhood}</p>
                      </div>
                    </div>
                  )}

                  {agent?.phone && (
                    <div className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-[var(--modern-gold)] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-medium text-white mb-1">Contact</p>
                        <a
                          href={`tel:${agent.phone}`}
                          className="text-white/70 text-sm hover:text-[var(--modern-gold)] transition-colors"
                        >
                          {agent.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--modern-gold)] hover:text-white transition-colors"
                    >
                      Get Directions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[400px] lg:min-h-0">
                <PropertyMap
                  latitude={listing.latitude!}
                  longitude={listing.longitude!}
                  address={listing.address || undefined}
                  price={listing.list_price}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONTACT ═══ */}
      <ContactSection listing={listing} agent={agent} />

      {/* ═══ FOOTER MLS DISCLAIMER ═══ */}
      <div className="bg-[var(--modern-black)] border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-[10px] text-white/30 leading-relaxed">
            MLS# {listing.mls_number}. Listing information is deemed reliable but not guaranteed.
            All measurements and square footage are approximate.
          </p>
        </div>
      </div>
    </div>
  );
}
