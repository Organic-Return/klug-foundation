'use client';

import { useState } from 'react';
import RequestInfoModal from './RequestInfoModal';

interface RequestInfoButtonProps {
  propertyAddress: string;
}

export default function RequestInfoButton({ propertyAddress }: RequestInfoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full inline-flex items-center justify-center gap-3 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
      >
        Request Info
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>

      <RequestInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyAddress={propertyAddress}
      />
    </>
  );
}
