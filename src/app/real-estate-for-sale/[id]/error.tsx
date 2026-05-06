'use client';

import { useEffect } from 'react';

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Listing page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Something went wrong loading this listing
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-[var(--rc-navy,#002349)] text-white text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
