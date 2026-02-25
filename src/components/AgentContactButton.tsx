'use client';

import { useState, useEffect } from 'react';
import AgentContactForm from './AgentContactForm';

interface AgentContactButtonProps {
  agentName: string;
  agentEmail?: string;
}

export default function AgentContactButton({ agentName, agentEmail }: AgentContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border border-[var(--rc-gold)] text-white text-xs uppercase tracking-[0.2em] font-light hover:bg-[var(--rc-gold)] hover:text-[var(--rc-navy)] transition-all duration-300"
      >
        Contact {agentName.split(' ')[0]}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-[var(--rc-navy)] w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/40 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 md:p-10">
              <h2
                className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-white mb-2"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                Contact {agentName.split(' ')[0]}
              </h2>
              <p className="text-white/60 text-sm font-light mb-8">
                Fill out the form below and {agentName.split(' ')[0]} will get back to you shortly.
              </p>

              <AgentContactForm agentName={agentName} agentEmail={agentEmail} inverted />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
