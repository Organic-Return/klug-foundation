'use client';

import AuthModal from './AuthModal';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { OffMarketListing, formatPrice, offMarketToMLSProperty } from '@/lib/offMarketListings';
import { useOffMarketAccess } from '@/lib/useOffMarketAccess';
import CustomOneListingContent from './CustomOneListingContent';

interface OffMarketListingDetailProps {
  listing: OffMarketListing;
}

export default function OffMarketListingDetail({ listing }: OffMarketListingDetailProps) {
  const { loading, hasAccess, unlockWithPasscode } = useOffMarketAccess();
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    );
  }

  // Show gate if listing requires registration AND visitor has no access
  if (!hasAccess && listing.requiresRegistration) {
    const handlePasscodeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (unlockWithPasscode(passcodeInput)) {
        setPasscodeError('');
      } else {
        setPasscodeError('Incorrect passcode. Please try again.');
      }
    };

    return (
      <div className="min-h-[80vh] bg-gray-50">
        <div className="relative">
          {/* Blurred preview */}
          <div className="absolute inset-0 overflow-hidden">
            {listing.featuredImageUrl && (
              <div className="h-[50vh] relative blur-md opacity-50">
                <Image
                  src={listing.featuredImageUrl}
                  alt="Property preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Registration overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 bg-gradient-to-b from-white/80 via-white/90 to-white">
            <div className="text-center mb-8 max-w-2xl">
              <h1 className="text-[var(--color-sothebys-blue)] mb-4">
                Exclusive Off-Market Property
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {listing.city}, {listing.state}
              </p>
              <p className="text-2xl font-bold text-[var(--color-gold)] mb-4">
                {formatPrice(listing.listPrice)}
              </p>
              <p className="text-gray-600">
                Register or sign in to view full property details, photos, and contact information.
              </p>
            </div>

            <AuthModal />

            {/* Passcode bypass */}
            <div className="mt-8 w-full max-w-md">
              {!showPasscodeForm ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowPasscodeForm(true)}
                    className="text-sm text-[var(--color-sothebys-blue)] hover:text-[var(--color-gold)] underline transition-colors"
                  >
                    Have a passcode? Enter it to bypass registration
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasscodeSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <label htmlFor="passcode" className="block text-sm font-medium text-[var(--color-sothebys-blue)] mb-2">
                    Enter Member Passcode
                  </label>
                  <input
                    id="passcode"
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => { setPasscodeInput(e.target.value); setPasscodeError(''); }}
                    placeholder="Passcode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[var(--color-gold)] text-sm"
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-red-600 text-xs mt-2">{passcodeError}</p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[var(--color-sothebys-blue)] text-white py-3 rounded-md text-sm font-medium hover:bg-[var(--color-sothebys-blue)]/90 transition-colors"
                    >
                      Unlock
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPasscodeForm(false); setPasscodeInput(''); setPasscodeError(''); }}
                      className="px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <Link
              href="/off-market"
              className="mt-6 text-gray-500 hover:text-gray-700"
            >
              &larr; Back to Off-Market Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Access granted — render with the same exclusive listing template as Klug listings
  const mlsProperty = offMarketToMLSProperty(listing);
  const agent = listing.agentName
    ? {
        name: listing.agentName,
        slug: { current: 'contact' },
        title: undefined,
        imageUrl: null,
        email: listing.agentEmail || undefined,
        phone: listing.agentPhone || undefined,
      }
    : null;

  return <CustomOneListingContent listing={mlsProperty} agent={agent} />;
}
