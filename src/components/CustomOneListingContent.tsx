'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MLSProperty } from '@/lib/listings';
import PropertyMap from '@/components/PropertyMap';
import { formatPhone, phoneHref } from '@/lib/phoneUtils';
import { getUTMData } from './UTMCapture';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ListingAgentInfo {
  name: string;
  slug: { current: string };
  title?: string;
  imageUrl?: string | null;
  email?: string;
  phone?: string;
  mobile?: string;
}

interface VideoInfo {
  _key: string;
  title: string;
  videoType: 'mux' | 'youtube' | 'vimeo' | 'url';
  muxPlaybackId?: string;
  youtubeId?: string;
  vimeoId?: string;
  externalUrl?: string;
  thumbnail?: { asset: { url: string } };
  description?: string;
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
  videos?: VideoInfo[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getVideoEmbedUrl(video: VideoInfo): string | null {
  switch (video.videoType) {
    case 'youtube':
      return video.youtubeId ? `https://www.youtube.com/embed/${video.youtubeId}` : null;
    case 'vimeo':
      return video.vimeoId ? `https://player.vimeo.com/video/${video.vimeoId}` : null;
    case 'mux':
      return video.muxPlaybackId ? `https://stream.mux.com/${video.muxPlaybackId}` : null;
    case 'url':
      return video.externalUrl || null;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function CustomOneListingContent({
  listing,
  agent,
  documents,
  videos,
}: CustomOneListingContentProps) {
  // Parallax scroll offset
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero slideshow
  const photos = listing.photos || [];
  const [heroIndex, setHeroIndex] = useState(0);
  const heroPhoto = photos[heroIndex] || null;

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Video modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Media tabs
  type MediaTab = 'gallery' | 'videos' | 'tours' | 'documents';
  const [activeTab, setActiveTab] = useState<MediaTab>('gallery');

  // Contact form state
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  // Bottom contact form state
  const [btmFirstName, setBtmFirstName] = useState('');
  const [btmLastName, setBtmLastName] = useState('');
  const [btmEmail, setBtmEmail] = useState('');
  const [btmPhone, setBtmPhone] = useState('');
  const [btmMessage, setBtmMessage] = useState('');
  const [btmSubmitting, setBtmSubmitting] = useState(false);
  const [btmSubmitted, setBtmSubmitted] = useState(false);
  const [btmError, setBtmError] = useState('');

  const streetAddress = listing.address?.split(',')[0] || listing.address || 'Property';
  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');
  const fullAddress = [listing.address, listing.zip_code].filter(Boolean).join(' ');
  const displayPrice = listing.status === 'Closed'
    ? formatPrice(listing.sold_price)
    : formatPrice(listing.list_price);

  // Determine which media tabs to show
  const hasPhotos = photos.length > 0;
  const hasVirtualTour = !!(listing.virtual_tour_url && listing.virtual_tour_url.includes('matterport'));
  const hasDocuments = !!(documents && documents.length > 0);

  // Combine CMS videos + listing video_urls
  const allVideos: Array<{ key: string; title: string; embedUrl: string }> = [];
  if (videos) {
    videos.forEach((v) => {
      const url = getVideoEmbedUrl(v);
      if (url) allVideos.push({ key: v._key, title: v.title, embedUrl: url });
    });
  }
  if (listing.video_urls) {
    listing.video_urls.forEach((url, i) => {
      if (url) allVideos.push({ key: `mls-video-${i}`, title: `Video ${i + 1}`, embedUrl: url });
    });
  }
  const hasVideos = allVideos.length > 0;
  const hasMap = !!(listing.latitude && listing.longitude);

  // Hero slideshow navigation
  const goHeroPrev = useCallback(() => {
    setHeroIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);
  const goHeroNext = useCallback(() => {
    setHeroIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Lightbox navigation
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const lbPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);
  const lbNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxOpen, closeLightbox, lbPrev, lbNext]);

  // Form submission handlers
  const handleSidebarFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName || !formEmail) return;
    setFormSubmitting(true);
    setFormError('');

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
          message: formMessage || undefined,
          leadType: 'property_inquiry',
          propertyAddress: listing.address || `Property ${listing.mls_number}`,
          propertyMlsId: listing.mls_number || undefined,
          propertyPrice: listing.list_price || undefined,
          source: 'Property Detail Page - Sidebar Form',
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

  const handleBottomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!btmFirstName || !btmLastName || !btmEmail) return;
    setBtmSubmitting(true);
    setBtmError('');

    try {
      const utm = getUTMData();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: btmFirstName,
          lastName: btmLastName,
          email: btmEmail,
          phone: btmPhone || undefined,
          message: btmMessage || undefined,
          leadType: 'property_inquiry',
          propertyAddress: listing.address || `Property ${listing.mls_number}`,
          propertyMlsId: listing.mls_number || undefined,
          propertyPrice: listing.list_price || undefined,
          source: 'Property Detail Page - Bottom Form',
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
      setBtmSubmitted(true);
    } catch {
      setBtmError('Something went wrong. Please try again.');
    } finally {
      setBtmSubmitting(false);
    }
  };

  // Determine available tabs
  const mediaTabs: Array<{ id: MediaTab; label: string }> = [];
  if (hasPhotos) mediaTabs.push({ id: 'gallery', label: 'Gallery' });
  if (hasVideos) mediaTabs.push({ id: 'videos', label: 'Videos' });
  if (hasVirtualTour) mediaTabs.push({ id: 'tours', label: 'Virtual Tour' });
  if (hasDocuments) mediaTabs.push({ id: 'documents', label: 'Documents' });

  // Stats for the property details grid
  const stats: Array<{ label: string; value: string }> = [];
  if (listing.bedrooms !== null && listing.bedrooms !== undefined) {
    stats.push({ label: 'Bedrooms', value: listing.bedrooms.toString() });
  }
  if (listing.bathrooms !== null && listing.bathrooms !== undefined) {
    stats.push({ label: 'Bathrooms', value: listing.bathrooms.toString() });
  }
  if (listing.square_feet) {
    stats.push({ label: 'Square Feet', value: listing.square_feet.toLocaleString() });
  }
  if (listing.lot_size) {
    stats.push({
      label: 'Lot Size',
      value: listing.lot_size >= 1
        ? `${listing.lot_size.toFixed(2)} Acres`
        : `${(listing.lot_size * 43560).toLocaleString()} SF`,
    });
  }
  if (listing.year_built) {
    stats.push({ label: 'Year Built', value: listing.year_built.toString() });
  }
  if (listing.property_type) {
    stats.push({ label: 'Property Type', value: listing.property_type });
  }

  // Gallery photos for grid (up to 12)
  const gridPhotos = photos.slice(0, 12);

  // Input field classes (reusable)
  const inputClasses =
    'w-full px-4 py-3 bg-white border border-[var(--rc-brown)]/20 text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/40 focus:border-[var(--rc-gold)] focus:outline-none transition-colors text-sm';
  const labelClasses =
    'text-[10px] tracking-[0.15em] text-[var(--rc-brown)]/60 uppercase block mb-1.5';

  return (
    <div className="min-h-screen bg-[var(--rc-cream)]" style={{ fontFamily: 'var(--font-figtree), sans-serif' }}>
      {/* ═══════════════════════════════════════════
          HERO SLIDESHOW
          ═══════════════════════════════════════════ */}
      <section className="relative w-full h-screen overflow-hidden bg-[var(--rc-navy)]">
        {heroPhoto ? (
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.15)`, willChange: 'transform' }}
          >
            <Image
              src={heroPhoto}
              alt={`${listing.address} - Photo ${heroIndex + 1}`}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--rc-navy)] to-[#1a3a5c]" />
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Prev / Next arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goHeroPrev}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-all duration-300 z-10"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goHeroNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-all duration-300 z-10"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Bottom bar: photo count + View Gallery */}
        {photos.length > 0 && (
          <div className="absolute bottom-6 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between z-10">
            <span className="text-white/80 text-sm tracking-wide">
              {heroIndex + 1} / {photos.length} Photos
            </span>
            <div className="flex items-center gap-3">
              {hasVideos && (
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-sm border border-white/30 text-white text-xs tracking-[0.15em] uppercase hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  View Video
                </button>
              )}
              {hasVirtualTour && (
                <button
                  onClick={() => {
                    setActiveTab('tours');
                    document.getElementById('tours-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-sm border border-white/30 text-white text-xs tracking-[0.15em] uppercase hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  Virtual Tour
                </button>
              )}
              <button
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-sm border border-white/30 text-white text-xs tracking-[0.15em] uppercase hover:bg-[var(--rc-gold)] hover:border-[var(--rc-gold)] transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Gallery
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Video Modal */}
      {videoModalOpen && hasVideos && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[var(--rc-gold)] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-[16/9] bg-black">
              <iframe
                src={allVideos[0].embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title={allVideos[0].title}
              />
            </div>
            <div className="bg-[var(--rc-navy)] p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{displayPrice}</p>
                <p className="text-white/60 text-sm font-light">{streetAddress}, {cityState}</p>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-[11px] uppercase tracking-wider text-[var(--rc-gold)] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PROPERTY INFO BAR
          ═══════════════════════════════════════════ */}
      <section className="bg-white border-b border-[var(--rc-brown)]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Address */}
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-[var(--rc-navy)] tracking-wide">
                {streetAddress}
              </h1>
              <p className="text-[var(--rc-brown)]/70 text-sm mt-1 tracking-wide">
                {cityState}{listing.zip_code ? ` ${listing.zip_code}` : ''}
              </p>
            </div>

            {/* Price + quick stats */}
            <div className="flex flex-wrap items-center gap-6 md:gap-8">
              {(listing.bedrooms !== null && listing.bedrooms !== undefined) && (
                <div className="text-center">
                  <p className="text-lg font-light text-[var(--rc-navy)]">{listing.bedrooms}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--rc-brown)]/50">Beds</p>
                </div>
              )}
              {(listing.bathrooms !== null && listing.bathrooms !== undefined) && (
                <div className="text-center">
                  <p className="text-lg font-light text-[var(--rc-navy)]">{listing.bathrooms}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--rc-brown)]/50">Baths</p>
                </div>
              )}
              {listing.square_feet && (
                <div className="text-center">
                  <p className="text-lg font-light text-[var(--rc-navy)]">{listing.square_feet.toLocaleString()}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--rc-brown)]/50">Sq Ft</p>
                </div>
              )}

              <div className="h-10 w-px bg-[var(--rc-brown)]/15 hidden md:block" />

              <div>
                <p className="font-serif text-2xl md:text-3xl text-[var(--rc-navy)]">
                  {displayPrice}
                </p>
                {listing.status === 'Closed' && listing.sold_date && (
                  <p className="text-[var(--rc-brown)]/50 text-xs mt-0.5">
                    Sold {new Date(listing.sold_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TWO-COLUMN LAYOUT
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
          {/* ─── LEFT COLUMN (2/3) ─── */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-[var(--rc-navy)] mb-6">
                About This Property
              </h2>
              <div className="w-12 h-[2px] bg-[var(--rc-gold)] mb-6" />
              {listing.description ? (
                <div className="space-y-4 text-[var(--rc-brown)] leading-relaxed text-[15px]">
                  {listing.description.split('\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--rc-brown)]/70 leading-relaxed">
                  Contact us for more details about this exceptional property.
                </p>
              )}
            </div>

            {/* ─── Property Details Grid ─── */}
            {stats.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-[var(--rc-navy)] mb-6">
                  Property Details
                </h2>
                <div className="w-12 h-[2px] bg-[var(--rc-gold)] mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--rc-brown)]/10">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-5 text-center">
                      <p className="text-xl font-light text-[var(--rc-navy)] mb-1">{stat.value}</p>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--rc-brown)]/50">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Additional property info */}
                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {listing.mls_number && (
                    <div className="flex justify-between py-2 border-b border-[var(--rc-brown)]/10">
                      <span className="text-[var(--rc-brown)]/50">MLS #</span>
                      <span className="text-[var(--rc-navy)]">{listing.mls_number}</span>
                    </div>
                  )}
                  {listing.status && (
                    <div className="flex justify-between py-2 border-b border-[var(--rc-brown)]/10">
                      <span className="text-[var(--rc-brown)]/50">Status</span>
                      <span className="text-[var(--rc-navy)]">{listing.status}</span>
                    </div>
                  )}
                  {listing.neighborhood && (
                    <div className="flex justify-between py-2 border-b border-[var(--rc-brown)]/10">
                      <span className="text-[var(--rc-brown)]/50">Neighborhood</span>
                      <span className="text-[var(--rc-navy)]">{listing.neighborhood}</span>
                    </div>
                  )}
                  {listing.days_on_market !== null && listing.days_on_market !== undefined && (
                    <div className="flex justify-between py-2 border-b border-[var(--rc-brown)]/10">
                      <span className="text-[var(--rc-brown)]/50">Days on Market</span>
                      <span className="text-[var(--rc-navy)]">{listing.days_on_market}</span>
                    </div>
                  )}
                  {listing.listing_date && (
                    <div className="flex justify-between py-2 border-b border-[var(--rc-brown)]/10">
                      <span className="text-[var(--rc-brown)]/50">Listed</span>
                      <span className="text-[var(--rc-navy)]">{new Date(listing.listing_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Tabbed Media Section ─── */}
            {mediaTabs.length > 0 && (
              <div id="tours-section">
                {/* Tab headers */}
                <div className="flex border-b border-[var(--rc-brown)]/15 mb-8 overflow-x-auto">
                  {mediaTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors duration-200 border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'border-[var(--rc-gold)] text-[var(--rc-navy)] font-medium'
                          : 'border-transparent text-[var(--rc-brown)]/50 hover:text-[var(--rc-navy)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Gallery Tab */}
                {activeTab === 'gallery' && hasPhotos && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {gridPhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                          className="relative aspect-[4/3] overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rc-gold)]"
                        >
                          <Image
                            src={photo}
                            alt={`${streetAddress} - Photo ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-sm">
                              {index + 1}/{photos.length}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {photos.length > 12 && (
                      <div className="text-center mt-6">
                        <button
                          onClick={() => {
                            setLightboxIndex(0);
                            setLightboxOpen(true);
                          }}
                          className="text-sm tracking-[0.15em] uppercase text-[var(--rc-gold)] hover:text-[var(--rc-navy)] transition-colors"
                        >
                          View All {photos.length} Photos
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Videos Tab */}
                {activeTab === 'videos' && hasVideos && (
                  <div className="space-y-6">
                    {allVideos.map((video) => (
                      <div key={video.key}>
                        <h3 className="text-sm font-medium text-[var(--rc-navy)] mb-2">{video.title}</h3>
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={video.embedUrl}
                            className="absolute top-0 left-0 w-full h-full border-0"
                            allowFullScreen
                            allow="autoplay; fullscreen; picture-in-picture"
                            loading="lazy"
                            title={video.title}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Virtual Tours Tab */}
                {activeTab === 'tours' && hasVirtualTour && (
                  <div>
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
                    <p className="text-[var(--rc-brown)]/60 text-sm mt-4">
                      Click and drag to navigate through the 3D space.
                    </p>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && hasDocuments && (
                  <div className="space-y-3">
                    {documents!.map((doc) => (
                      <a
                        key={doc._key}
                        href={doc.file.asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 bg-white border border-[var(--rc-brown)]/10 hover:border-[var(--rc-gold)]/50 transition-all duration-300"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-[var(--rc-gold)]/10 flex items-center justify-center group-hover:bg-[var(--rc-gold)]/20 transition-colors">
                          <svg className="w-5 h-5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-sm font-medium text-[var(--rc-navy)] group-hover:text-[var(--rc-gold)] transition-colors">
                            {doc.title}
                          </h3>
                          {doc.description && (
                            <p className="text-xs text-[var(--rc-brown)]/50 mt-0.5 line-clamp-1">{doc.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="text-[9px] tracking-[0.1em] uppercase text-[var(--rc-brown)]/40 bg-[var(--rc-brown)]/5 px-2 py-0.5">
                            {doc.documentType || 'PDF'}
                          </span>
                          <svg className="w-4 h-4 text-[var(--rc-brown)]/30 group-hover:text-[var(--rc-gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ─── RIGHT COLUMN (1/3) ─── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Agent Card */}
              {agent && (
                <div className="bg-white border border-[var(--rc-brown)]/10 p-6">
                  <div className="flex items-start gap-4">
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
                      <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--rc-gold)] mb-1">Listing Agent</p>
                      <Link
                        href={`/team/${agent.slug.current}`}
                        className="font-serif text-lg text-[var(--rc-navy)] hover:text-[var(--rc-gold)] transition-colors"
                      >
                        {agent.name}
                      </Link>
                      {agent.title && (
                        <p className="text-xs text-[var(--rc-brown)]/60 mt-0.5">{agent.title}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {agent.phone && (
                      <a
                        href={`tel:${phoneHref(agent.phone)}`}
                        className="flex items-center gap-2 text-[var(--rc-brown)] hover:text-[var(--rc-gold)] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {formatPhone(agent.phone)}
                      </a>
                    )}
                    {agent.email && (
                      <a
                        href={`mailto:${agent.email}`}
                        className="flex items-center gap-2 text-[var(--rc-brown)] hover:text-[var(--rc-gold)] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {agent.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Sidebar Contact Form */}
              <div className="bg-white border border-[var(--rc-brown)]/10 p-6">
                <h3 className="font-serif text-lg text-[var(--rc-navy)] mb-1">Inquire About This Property</h3>
                <div className="w-8 h-[2px] bg-[var(--rc-gold)] mb-5" />

                {formSubmitted ? (
                  <div className="text-center py-8">
                    <svg className="w-10 h-10 text-[var(--rc-gold)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[var(--rc-navy)] font-medium">Thank you for your inquiry.</p>
                    <p className="text-[var(--rc-brown)]/60 text-sm mt-1">We will be in touch shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSidebarFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="sb-firstName" className={labelClasses}>First Name</label>
                        <input
                          id="sb-firstName"
                          type="text"
                          required
                          value={formFirstName}
                          onChange={(e) => setFormFirstName(e.target.value)}
                          className={inputClasses}
                          placeholder="First"
                        />
                      </div>
                      <div>
                        <label htmlFor="sb-lastName" className={labelClasses}>Last Name</label>
                        <input
                          id="sb-lastName"
                          type="text"
                          required
                          value={formLastName}
                          onChange={(e) => setFormLastName(e.target.value)}
                          className={inputClasses}
                          placeholder="Last"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="sb-email" className={labelClasses}>Email</label>
                      <input
                        id="sb-email"
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className={inputClasses}
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label htmlFor="sb-phone" className={labelClasses}>Phone</label>
                      <input
                        id="sb-phone"
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className={inputClasses}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="sb-message" className={labelClasses}>Message</label>
                      <textarea
                        id="sb-message"
                        rows={3}
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className={`${inputClasses} resize-none`}
                        placeholder={`I'm interested in ${streetAddress}...`}
                      />
                    </div>

                    {formError && (
                      <p className="text-red-600 text-xs">{formError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="sir-btn w-full py-3 text-xs tracking-[0.15em] uppercase disabled:opacity-50"
                    >
                      {formSubmitting ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </form>
                )}
              </div>

              {/* Schedule Private Viewing CTA */}
              <a
                href="#contact"
                className="sir-btn block w-full text-center py-4 text-xs tracking-[0.2em] uppercase"
              >
                Schedule Private Viewing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MAP SECTION
          ═══════════════════════════════════════════ */}
      {hasMap && (
        <section id="location" className="bg-[var(--color-sothebys-blue)]">
          <div className="text-center py-12">
            <h2 className="font-serif text-2xl md:text-3xl text-white">Location</h2>
            <div className="w-12 h-[2px] bg-[var(--rc-gold)] mx-auto mt-4 mb-3" />
            <p className="text-white/60 text-sm">{fullAddress}</p>
          </div>

            <div className="relative h-[500px] md:h-[600px]">
              <PropertyMap
                latitude={listing.latitude!}
                longitude={listing.longitude!}
                address={listing.address || undefined}
                price={listing.list_price}
              />
            </div>

          <div className="flex justify-center py-6">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--rc-gold)] hover:text-[var(--rc-navy)] transition-colors"
              >
                Get Directions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          BOTTOM CONTACT SECTION
          ═══════════════════════════════════════════ */}
      <section id="contact" className="py-16 md:py-24 bg-[#f5f3ef]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-[var(--rc-gold)] text-xs tracking-[0.3em] uppercase mb-3">Schedule a Private Showing</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[var(--rc-navy)]">Inquire About This Property</h2>
            <div className="w-16 h-[2px] bg-[var(--rc-gold)] mx-auto mt-5" />
          </div>

          <div className="grid md:grid-cols-2 gap-0 shadow-lg overflow-hidden">
            {/* Agent info side — dark navy card */}
            <div className="relative bg-[var(--rc-navy)] p-10 flex flex-col justify-between">
              {photos[0] && (
                <div className="absolute inset-0">
                  <Image src={photos[0]} alt="" fill className="object-cover opacity-15" sizes="50vw" />
                </div>
              )}
              <div className="relative space-y-6">
                {agent && (
                  <>
                    <div className="flex items-start gap-5">
                      {agent.imageUrl && (
                        <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden border-2 border-[var(--rc-gold)]/30">
                          <Image
                            src={agent.imageUrl}
                            alt={agent.name}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--rc-gold)] mb-1">Listing Agent</p>
                        <Link
                          href={`/team/${agent.slug.current}`}
                          className="font-serif text-xl text-white hover:text-[var(--rc-gold)] transition-colors"
                        >
                          {agent.name}
                        </Link>
                        {agent.title && (
                          <p className="text-sm text-white/50 mt-0.5">{agent.title}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      {agent.phone && (
                        <a
                          href={`tel:${phoneHref(agent.phone)}`}
                          className="flex items-center gap-3 text-white/80 hover:text-[var(--rc-gold)] transition-colors text-sm"
                        >
                          <svg className="w-4 h-4 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {formatPhone(agent.phone)}
                        </a>
                      )}
                      {agent.email && (
                        <a
                          href={`mailto:${agent.email}`}
                          className="flex items-center gap-3 text-white/80 hover:text-[var(--rc-gold)] transition-colors text-sm"
                        >
                          <svg className="w-4 h-4 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {agent.email}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
              <p className="relative text-white/30 text-xs italic mt-8">
                All inquiries are handled with the utmost discretion and confidentiality.
              </p>
            </div>

            {/* Contact Form — clean white card */}
            <div className="bg-white p-10">
              {btmSubmitted ? (
                <div className="text-center py-10">
                  <svg className="w-12 h-12 text-[var(--rc-gold)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[var(--rc-navy)] font-serif text-xl">Thank you for your inquiry.</p>
                  <p className="text-[var(--rc-brown)]/60 text-sm mt-2">
                    A member of our team will be in touch shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBottomFormSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="btm-firstName" className={labelClasses}>First Name</label>
                      <input
                        id="btm-firstName"
                        type="text"
                        required
                        value={btmFirstName}
                        onChange={(e) => setBtmFirstName(e.target.value)}
                        className={inputClasses}
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="btm-lastName" className={labelClasses}>Last Name</label>
                      <input
                        id="btm-lastName"
                        type="text"
                        required
                        value={btmLastName}
                        onChange={(e) => setBtmLastName(e.target.value)}
                        className={inputClasses}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="btm-email" className={labelClasses}>Email Address</label>
                    <input
                      id="btm-email"
                      type="email"
                      required
                      value={btmEmail}
                      onChange={(e) => setBtmEmail(e.target.value)}
                      className={inputClasses}
                      placeholder="Email Address"
                    />
                  </div>
                  <div>
                    <label htmlFor="btm-phone" className={labelClasses}>Phone Number</label>
                    <input
                      id="btm-phone"
                      type="tel"
                      value={btmPhone}
                      onChange={(e) => setBtmPhone(e.target.value)}
                      className={inputClasses}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div>
                    <label htmlFor="btm-message" className={labelClasses}>Message</label>
                    <textarea
                      id="btm-message"
                      rows={4}
                      value={btmMessage}
                      onChange={(e) => setBtmMessage(e.target.value)}
                      className={`${inputClasses} resize-none`}
                      placeholder={`I'm interested in learning more about ${streetAddress}...`}
                    />
                  </div>

                  {btmError && (
                    <p className="text-red-600 text-xs">{btmError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={btmSubmitting}
                    className="sir-btn w-full py-4 text-xs tracking-[0.15em] uppercase disabled:opacity-50"
                  >
                    {btmSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MLS DISCLAIMER FOOTER
          ═══════════════════════════════════════════ */}
      <div className="bg-[var(--rc-navy)] border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-[10px] text-white/30 leading-relaxed">
            MLS# {listing.mls_number}. Listing information is deemed reliable but not guaranteed.
            All measurements and square footage are approximate. Buyer to verify all information.
            Information sourced from the Multiple Listing Service.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          LIGHTBOX OVERLAY
          ═══════════════════════════════════════════ */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white hover:text-[var(--rc-gold)] transition-colors z-10"
            aria-label="Close gallery"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={lbPrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white hover:text-[var(--rc-gold)] transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative w-full max-w-5xl aspect-video mx-16">
            <Image
              src={photos[lightboxIndex]}
              alt={`${streetAddress} - Photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Next */}
          <button
            onClick={lbNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white hover:text-[var(--rc-gold)] transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 text-center w-full">
            <p className="text-white/70 text-sm tracking-wide">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
