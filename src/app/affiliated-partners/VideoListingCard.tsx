'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface VideoListingCardProps {
  embedUrl: string;
  photoUrl: string | null;
  price: string;
  address: string;
  city: string;
  state: string;
  agentName: string;
  title: string;
  listingId?: string;
}

export default function VideoListingCard({
  embedUrl,
  photoUrl,
  price,
  address,
  city,
  state,
  agentName,
  title,
  listingId,
}: VideoListingCardProps) {
  const [showModal, setShowModal] = useState(false);

  if (!embedUrl) return null;

  return (
    <>
      <div className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 overflow-hidden">
        {/* Image with play button overlay */}
        <div
          className="relative aspect-[16/9] bg-[#f0f0f0] dark:bg-gray-800 cursor-pointer overflow-hidden"
          onClick={() => setShowModal(true)}
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-sothebys-blue)]">
              <span className="text-white/30 font-serif text-lg">{city}</span>
            </div>
          )}
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
              <svg className="w-7 h-7 text-[var(--color-sothebys-blue)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Video badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-[#c9ac77] text-white text-[10px] uppercase tracking-wider px-2 py-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Video Tour
            </span>
          </div>
        </div>

        {/* Property info */}
        <div className="p-5">
          <p className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-1">
            {price}
          </p>
          <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light line-clamp-1 mb-1">
            {address}
          </p>
          <p className="text-xs text-[#c9ac77] font-light mb-3">
            {agentName}
          </p>
          {listingId && (
            <Link
              href={`/listings/${listingId}`}
              className="klug-nav-link text-[10px] uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] hover:text-[#c9ac77] transition-colors font-medium"
            >
              View Property →
            </Link>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="klug-gallery-btn absolute -top-12 right-0 text-white hover:text-[#c9ac77] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Video iframe */}
            <div className="aspect-[16/9] bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title={title}
              />
            </div>
            {/* Info below video */}
            <div className="bg-[var(--color-sothebys-blue)] p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{price}</p>
                <p className="text-white/60 text-sm font-light">{address} &middot; {agentName}</p>
              </div>
              {listingId && (
                <Link
                  href={`/listings/${listingId}`}
                  className="klug-nav-link text-[11px] uppercase tracking-wider text-[#c9ac77] hover:text-white transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  View Property →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
