'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';
import Image from 'next/image';
import Link from 'next/link';
import { OffMarketListing, formatPrice } from '@/lib/offMarketListings';
import { useOffMarketAccess } from '@/lib/useOffMarketAccess';

interface OffMarketListingsContentProps {
  listings: OffMarketListing[];
}

export default function OffMarketListingsContent({ listings }: OffMarketListingsContentProps) {
  const {
    user,
    loading,
    signOut,
    unlockWithPasscode,
    lockPasscode,
    hasAccess,
  } = useOffMarketAccess();
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockWithPasscode(passcodeInput)) {
      setPasscodeError('');
    } else {
      setPasscodeError('Incorrect passcode. Please try again.');
    }
  };

  const handlePasscodeSignOut = () => {
    lockPasscode();
    setPasscodeInput('');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    );
  }

  // Show registration gate if user has no access (no auth + no passcode)
  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] bg-gray-50">
        {/* Hero Section with blurred preview */}
        <div className="relative">
          {/* Blurred preview of listings */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 blur-sm opacity-50">
              {listings.slice(0, 6).map((listing) => (
                <div key={listing._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200 relative">
                    {listing.featuredImageUrl && (
                      <Image
                        src={listing.featuredImageUrl}
                        alt={listing.address || 'Property'}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registration overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 bg-gradient-to-b from-white/80 via-white/90 to-white">
            <div className="text-center mb-8 max-w-2xl">
              <h1 className="text-[var(--color-sothebys-blue)] mb-4">
                Exclusive Off-Market Listings
              </h1>
              <p className="text-lg text-gray-600">
                Access our private collection of off-market properties not available to the general public.
                Register for free to view exclusive listings and get early access to premium properties.
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

            <div className="mt-8 flex items-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No Spam</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in - show listings
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[var(--color-sothebys-blue)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-white mb-2">Off-Market Listings</h1>
              <p className="text-white/80">
                Exclusive properties available only to registered members
              </p>
            </div>
            <div className="text-right">
              {user ? (
                <>
                  <p className="text-sm text-white/70 mb-1">Signed in as</p>
                  <p className="font-medium">{user.email}</p>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-white/70 hover:text-white mt-1"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/70 mb-1">Member Access</p>
                  <p className="font-medium">Passcode Verified</p>
                  <button
                    onClick={handlePasscodeSignOut}
                    className="text-sm text-white/70 hover:text-white mt-1"
                  >
                    Lock
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-2">No Off-Market Listings Available</h2>
            <p className="text-gray-600">Check back soon for exclusive properties.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">{listings.length} exclusive {listings.length === 1 ? 'property' : 'properties'} available</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {listings.map((listing) => {
                const totalBaths = (listing.bathroomsFull || 0)
                  + (listing.bathroomsThreeQuarter || 0) * 0.75
                  + (listing.bathroomsHalf || 0) * 0.5;
                return (
                  <div key={listing._id} className="group border border-gray-200 overflow-hidden">
                    <Link href={`/off-market/${listing.slug}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-taupe)]">
                        {listing.featuredImageUrl ? (
                          <Image
                            src={listing.featuredImageUrl}
                            alt={`${listing.address}, ${listing.city}, ${listing.state}`}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-[var(--color-gold)] text-white">
                            Off-Market
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-gray-900 font-semibold" style={{ fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                        {formatPrice(listing.listPrice)}
                      </h3>
                      <p className="leading-snug line-clamp-1 text-sm text-gray-700" style={{ marginBottom: '0.125rem' }}>
                        {listing.address}
                      </p>
                      <p className="leading-snug line-clamp-1 text-xs text-gray-500" style={{ marginBottom: '0.5rem' }}>
                        {listing.city}, {listing.state} {listing.zipCode}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] uppercase text-gray-500 tracking-wider">
                        {listing.bedrooms != null && <span>{listing.bedrooms} Beds</span>}
                        {listing.bedrooms != null && totalBaths > 0 && <span className="w-px h-3 bg-gray-300" />}
                        {totalBaths > 0 && <span>{totalBaths} Baths</span>}
                        {totalBaths > 0 && listing.squareFeet && <span className="w-px h-3 bg-gray-300" />}
                        {listing.squareFeet && <span>{listing.squareFeet.toLocaleString()} SF</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
