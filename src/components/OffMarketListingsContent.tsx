'use client';

import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';
import SavePropertyButton from './SavePropertyButton';
import Image from 'next/image';
import Link from 'next/link';
import { OffMarketListing, formatPrice, getTotalBathrooms } from '@/lib/offMarketListings';

interface OffMarketListingsContentProps {
  listings: OffMarketListing[];
}

export default function OffMarketListingsContent({ listings }: OffMarketListingsContentProps) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    );
  }

  // Show registration gate if user is not logged in
  if (!user) {
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
              <p className="text-sm text-white/70 mb-1">Signed in as</p>
              <p className="font-medium">{user.email}</p>
              <button
                onClick={() => signOut()}
                className="text-sm text-white/70 hover:text-white mt-1"
              >
                Sign Out
              </button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing._id}
                  href={`/off-market/${listing.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] relative bg-gray-200">
                    {listing.featuredImageUrl ? (
                      <Image
                        src={listing.featuredImageUrl}
                        alt={listing.address || 'Property'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        listing.status === 'Active' ? 'bg-green-500 text-white' :
                        listing.status === 'Pending' ? 'bg-yellow-500 text-white' :
                        listing.status === 'Coming Soon' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {listing.status}
                      </span>
                    </div>

                    {/* Off-Market Badge & Save Button */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-[var(--color-gold)] text-white">
                        Off-Market
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <SavePropertyButton listingId={listing._id} listingType="off_market" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {formatPrice(listing.listPrice)}
                    </p>
                    <p className="text-gray-900 font-medium">{listing.address}</p>
                    <p className="text-gray-500 text-sm mb-3">
                      {listing.city}, {listing.state} {listing.zipCode}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {listing.bedrooms !== null && (
                        <span>{listing.bedrooms} bed</span>
                      )}
                      {(listing.bathroomsFull || listing.bathroomsHalf) && (
                        <span>{getTotalBathrooms(listing)} bath</span>
                      )}
                      {listing.squareFeet && (
                        <span>{listing.squareFeet.toLocaleString()} sqft</span>
                      )}
                    </div>

                    {listing.propertyType && (
                      <p className="text-xs text-gray-400 mt-2">{listing.propertyType}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
