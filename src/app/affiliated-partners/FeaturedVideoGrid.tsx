'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface VideoListing {
  id: string;
  embedUrl: string;
  photoUrl: string | null;
  price: string;
  street: string;
  city: string;
  state: string;
  agentName: string;
}

export default function FeaturedVideoGrid({ listings }: { listings: VideoListing[] }) {
  const [activeVideo, setActiveVideo] = useState<VideoListing | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {listings.map((listing) => (
          <div key={listing.id} className="group relative">
            <div
              className="relative aspect-[16/9] bg-black cursor-pointer overflow-hidden"
              onClick={() => setActiveVideo(listing)}
            >
              {listing.photoUrl ? (
                <Image
                  src={listing.photoUrl}
                  alt={`${listing.street}, ${listing.city}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--color-sothebys-blue)]">
                  <span className="text-white/30 font-serif text-lg">{listing.city}</span>
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
            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-xl font-semibold mb-1">
                {listing.price}
              </p>
              <p className="text-white/70 text-sm font-light">
                {listing.street}, {listing.city}, {listing.state}
              </p>
              <p className="text-[#c9ac77] text-xs font-light mt-1">
                {listing.agentName}
              </p>
              <Link
                href={`/listings/${listing.id}`}
                className="klug-nav-link inline-block mt-3 text-[10px] uppercase tracking-[0.15em] text-white hover:text-[#c9ac77] transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View Property &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="klug-gallery-btn absolute -top-12 right-0 text-white hover:text-[#c9ac77] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-[16/9] bg-black">
              <iframe
                src={activeVideo.embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title={`${activeVideo.street}, ${activeVideo.city}`}
              />
            </div>
            <div className="bg-[var(--color-sothebys-blue)] p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{activeVideo.price}</p>
                <p className="text-white/60 text-sm font-light">
                  {activeVideo.street}, {activeVideo.city} &middot; {activeVideo.agentName}
                </p>
              </div>
              <Link
                href={`/listings/${activeVideo.id}`}
                className="klug-nav-link text-[11px] uppercase tracking-wider text-[#c9ac77] hover:text-white transition-colors"
                onClick={() => setActiveVideo(null)}
              >
                View Property &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
