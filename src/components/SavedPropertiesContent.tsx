'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';
import SavePropertyButton from './SavePropertyButton';
import { getSavedProperties, SavedProperty } from '@/lib/savedProperties';
import { getListingHref, MLSProperty } from '@/lib/listings';
import { OffMarketListing } from '@/lib/offMarketListings';

interface SavedPropertiesContentProps {
  mlsListings: MLSProperty[];
  offMarketListings: OffMarketListing[];
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function SavedPropertiesContent({
  mlsListings,
  offMarketListings,
}: SavedPropertiesContentProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      if (user) {
        const saved = await getSavedProperties();
        setSavedProperties(saved);
      }
      setLoading(false);
    }
    fetchSaved();
  }, [user]);

  // Filter listings to only show saved ones
  const savedMlsListings = mlsListings.filter((listing) =>
    savedProperties.some(
      (saved) => saved.listing_id === listing.id && saved.listing_type === 'mls'
    )
  );

  const savedOffMarketListings = offMarketListings.filter((listing) =>
    savedProperties.some(
      (saved) => saved.listing_id === listing._id && saved.listing_type === 'off_market'
    )
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    );
  }

  // Show registration gate if user is not logged in
  if (!user) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8 max-w-2xl">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h1 className="text-[var(--color-sothebys-blue)] mb-4">
            Your Saved Properties
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to view and manage your saved properties.
          </p>
        </div>

        <AuthModal />
      </div>
    );
  }

  const totalSaved = savedMlsListings.length + savedOffMarketListings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[var(--color-sothebys-blue)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-white mb-2">Saved Properties</h1>
              <p className="text-white/80">
                {totalSaved === 0
                  ? 'You haven\'t saved any properties yet'
                  : `${totalSaved} saved ${totalSaved === 1 ? 'property' : 'properties'}`}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalSaved === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-2">No Saved Properties</h2>
            <p className="text-gray-600 mb-6">
              Start exploring properties and click the heart icon to save your favorites.
            </p>
            <Link
              href="/listings"
              className="inline-block bg-[var(--color-gold)] text-white font-semibold py-3 px-6 rounded-md hover:bg-transparent hover:text-[var(--color-gold)] border-2 border-[var(--color-gold)] transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* MLS Listings */}
            {savedMlsListings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-4">
                  MLS Listings ({savedMlsListings.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedMlsListings.map((listing) => (
                    <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                      <Link href={getListingHref(listing)}>
                        <div className="aspect-[4/3] relative bg-gray-200">
                          {listing.photos && listing.photos[0] ? (
                            <Image
                              src={listing.photos[0]}
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
                          <div className="absolute top-3 right-3">
                            <SavePropertyButton listingId={listing.id} listingType="mls" />
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {formatPrice(listing.list_price)}
                        </p>
                        <p className="text-gray-900 font-medium">{listing.address}</p>
                        <p className="text-gray-500 text-sm mb-3">
                          {listing.city}, {listing.state} {listing.zip_code}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {listing.bedrooms !== null && <span>{listing.bedrooms} bed</span>}
                          {listing.bathrooms !== null && <span>{listing.bathrooms} bath</span>}
                          {listing.square_feet && <span>{listing.square_feet.toLocaleString()} sqft</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Off-Market Listings */}
            {savedOffMarketListings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-4">
                  Off-Market Listings ({savedOffMarketListings.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedOffMarketListings.map((listing) => (
                    <div key={listing._id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                      <Link href={`/off-market/${listing.slug}`}>
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
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-[var(--color-gold)] text-white">
                              Off-Market
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <SavePropertyButton listingId={listing._id} listingType="off_market" />
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {formatPrice(listing.listPrice)}
                        </p>
                        <p className="text-gray-900 font-medium">{listing.address}</p>
                        <p className="text-gray-500 text-sm mb-3">
                          {listing.city}, {listing.state} {listing.zipCode}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {listing.bedrooms !== null && <span>{listing.bedrooms} bed</span>}
                          {(listing.bathroomsFull || listing.bathroomsHalf) && (
                            <span>
                              {(listing.bathroomsFull || 0) + (listing.bathroomsThreeQuarter || 0) * 0.75 + (listing.bathroomsHalf || 0) * 0.5} bath
                            </span>
                          )}
                          {listing.squareFeet && <span>{listing.squareFeet.toLocaleString()} sqft</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
