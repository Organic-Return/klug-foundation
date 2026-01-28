'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { toggleSaveProperty, isPropertySaved } from '@/lib/savedProperties';

interface SavePropertyButtonProps {
  listingId: string;
  listingType?: 'mls' | 'off_market';
  variant?: 'icon' | 'button';
  className?: string;
  onAuthRequired?: () => void;
}

export default function SavePropertyButton({
  listingId,
  listingType = 'mls',
  variant = 'icon',
  className = '',
  onAuthRequired,
}: SavePropertyButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function checkSaved() {
      if (user) {
        const isSaved = await isPropertySaved(listingId, listingType);
        setSaved(isSaved);
      }
      setInitialLoading(false);
    }
    checkSaved();
  }, [user, listingId, listingType]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    setLoading(true);
    const { saved: newSavedState, error } = await toggleSaveProperty(listingId, listingType);
    if (!error) {
      setSaved(newSavedState);
    }
    setLoading(false);
  };

  // Icon variant - small heart icon for cards
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading || initialLoading}
        className={`p-2 rounded-full transition-all ${
          saved
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
        } ${loading || initialLoading ? 'opacity-50' : ''} ${className}`}
        aria-label={saved ? 'Remove from saved' : 'Save property'}
        title={!user ? 'Sign in to save properties' : saved ? 'Remove from saved' : 'Save property'}
      >
        <svg
          className="w-5 h-5"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  // Button variant - full button for detail pages
  return (
    <button
      onClick={handleClick}
      disabled={loading || initialLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
        saved
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-red-500 hover:text-red-500'
      } ${loading || initialLoading ? 'opacity-50' : ''} ${className}`}
      title={!user ? 'Sign in to save properties' : undefined}
    >
      <svg
        className="w-5 h-5"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
