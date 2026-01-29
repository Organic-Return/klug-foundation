'use client';

import { useState } from 'react';
import ScheduleTourModal from './ScheduleTourModal';

interface ScheduleTourButtonProps {
  propertyAddress: string;
}

export default function ScheduleTourButton({ propertyAddress }: ScheduleTourButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center gap-3 py-4 px-8 bg-[var(--color-sothebys-blue)] border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
      >
        Schedule a Tour
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>

      <ScheduleTourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyAddress={propertyAddress}
      />
    </>
  );
}
