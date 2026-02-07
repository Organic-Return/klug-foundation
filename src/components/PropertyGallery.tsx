'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import ViewAllImagesButton from './ViewAllImagesButton';

interface PropertyGalleryProps {
  photos: string[];
  address?: string;
  constrained?: boolean;
}

export default function PropertyGallery({ photos, address, constrained = false }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  if (!photos || photos.length === 0) {
    return (
      <div className={`${constrained ? 'aspect-[16/10]' : 'h-[calc(100vh-5rem)]'} flex items-center justify-center bg-gray-800`}>
        <div className="text-center text-gray-400">
          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="mt-4">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${constrained ? 'aspect-[16/10]' : 'h-[calc(100vh-5rem)]'} bg-gray-900`}>
      {/* Main Photo */}
      <Image
        src={photos[currentIndex]}
        alt={address ? `${address} - Photo ${currentIndex + 1}` : `Property photo ${currentIndex + 1}`}
        fill
        className="object-cover"
        priority={currentIndex === 0}
        sizes="100vw"
        itemProp="image"
      />

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white text-[#1a1a1a] flex items-center justify-center transition-all duration-300"
            aria-label="Previous photo"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white text-[#1a1a1a] flex items-center justify-center transition-all duration-300"
            aria-label="Next photo"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Bottom Left Controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <div className="bg-black/70 text-white px-4 py-2 rounded text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
        <ViewAllImagesButton photos={photos} address={address} />
      </div>
    </div>
  );
}
