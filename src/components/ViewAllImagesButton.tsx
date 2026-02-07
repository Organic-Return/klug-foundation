'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ViewAllImagesButtonProps {
  photos: string[];
  address?: string;
}

export default function ViewAllImagesButton({ photos, address }: ViewAllImagesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeModal]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--modern-gold)] hover:bg-[#c99158] text-white text-sm tracking-wide transition-all duration-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>View All Images</span>
        <span className="text-white/60">({photos.length})</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-medium">
                  {address || 'Property Photos'}
                </h2>
                <p className="text-white/60 text-sm">{photos.length} images</p>
              </div>
              <button
                onClick={closeModal}
                className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                <span className="text-sm">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Images Grid */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative w-full bg-gray-900 rounded-lg overflow-hidden"
                >
                  <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                    <Image
                      src={photo}
                      alt={address ? `${address} - Photo ${index + 1}` : `Property photo ${index + 1}`}
                      fill
                      className="object-contain bg-gray-900"
                      sizes="(max-width: 1400px) 100vw, 1400px"
                      priority={index < 3}
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm backdrop-blur-sm">
                    {index + 1} / {photos.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back to top button */}
          <div className="sticky bottom-8 flex justify-center pb-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm tracking-wide transition-all duration-300 rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
