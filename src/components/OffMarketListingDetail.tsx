'use client';

import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';
import SavePropertyButton from './SavePropertyButton';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { OffMarketListing, formatPrice, getTotalBathrooms } from '@/lib/offMarketListings';

interface OffMarketListingDetailProps {
  listing: OffMarketListing;
}

export default function OffMarketListingDetail({ listing }: OffMarketListingDetailProps) {
  const { user, loading, signOut } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Combine featured image with other photos
  const allPhotos = [
    ...(listing.featuredImageUrl ? [listing.featuredImageUrl] : []),
    ...listing.photos.filter(p => p !== listing.featuredImageUrl),
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    );
  }

  // Show registration gate if user is not logged in and listing requires registration
  if (!user && listing.requiresRegistration) {
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

  // User is logged in or listing doesn't require registration - show full details
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-[var(--color-sothebys-blue)]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
              </li>
              <li className="text-white/50">/</li>
              <li>
                <Link href="/off-market" className="text-white/70 hover:text-white transition-colors">Off-Market</Link>
              </li>
              <li className="text-white/50">/</li>
              <li className="text-white font-medium">
                {listing.address || 'Property'}
              </li>
            </ol>
            {user && (
              <div className="flex items-center gap-4 text-white/70 text-sm">
                <span>{user.email}</span>
                <button onClick={() => signOut()} className="hover:text-white">
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Photo Gallery */}
      {allPhotos.length > 0 && (
        <div className="relative h-[calc(100vh-5rem)] bg-black">
          <Image
            src={allPhotos[currentPhotoIndex]}
            alt={`${listing.address} - Photo ${currentPhotoIndex + 1}`}
            fill
            className="object-contain"
            priority
          />

          {/* Navigation Arrows */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex(prev => prev === 0 ? allPhotos.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                aria-label="Previous photo"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(prev => prev === allPhotos.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                aria-label="Next photo"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Photo Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                {currentPhotoIndex + 1} / {allPhotos.length}
              </div>
            </>
          )}

          {/* Off-Market Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 text-sm font-semibold rounded bg-[var(--color-gold)] text-white">
              Off-Market Exclusive
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <header>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    listing.status === 'Active' ? 'bg-green-100 text-green-800' :
                    listing.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    listing.status === 'Coming Soon' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status}
                  </span>
                  {listing.propertyType && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {listing.propertyType}
                    </span>
                  )}
                </div>
                <SavePropertyButton listingId={listing._id} listingType="off_market" variant="button" />
              </div>

              <h1 className="text-[var(--color-sothebys-blue)] mb-2">
                {formatPrice(listing.listPrice)}
              </h1>

              <p className="text-xl text-gray-600">{listing.address}</p>
              <p className="text-gray-500">
                {listing.city}, {listing.state} {listing.zipCode}
              </p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {listing.bedrooms !== null && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{listing.bedrooms}</div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                </div>
              )}
              {(listing.bathroomsFull || listing.bathroomsThreeQuarter || listing.bathroomsHalf) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{getTotalBathrooms(listing)}</div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {[
                      listing.bathroomsFull && `${listing.bathroomsFull} full`,
                      listing.bathroomsThreeQuarter && `${listing.bathroomsThreeQuarter} ¾`,
                      listing.bathroomsHalf && `${listing.bathroomsHalf} half`,
                    ].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {listing.squareFeet && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{listing.squareFeet.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Sq Ft</div>
                </div>
              )}
              {listing.yearBuilt && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{listing.yearBuilt}</div>
                  <div className="text-sm text-gray-500">Year Built</div>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Virtual Tour */}
            {listing.virtualTourUrl && listing.virtualTourUrl.includes('matterport') && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-4">Virtual Tour</h2>
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={listing.virtualTourUrl}
                    title={`Virtual tour of ${listing.address}`}
                  />
                </div>
              </div>
            )}

            {/* Map */}
            {listing.latitude && listing.longitude && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-[var(--color-sothebys-blue)] mb-4">Location</h2>
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${listing.latitude},${listing.longitude}&zoom=15`}
                    title={`Map of ${listing.address}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Agent Info */}
            {listing.agentName && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{listing.agentName}</p>
                    {listing.officeName && (
                      <p className="text-sm text-gray-500">{listing.officeName}</p>
                    )}
                    {listing.agentEmail && (
                      <a href={`mailto:${listing.agentEmail}`} className="text-sm text-blue-600 hover:underline block">
                        {listing.agentEmail}
                      </a>
                    )}
                    {listing.agentPhone && (
                      <a href={`tel:${listing.agentPhone}`} className="text-sm text-blue-600 hover:underline block">
                        {listing.agentPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
              <dl className="space-y-3">
                {listing.propertyType && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-900">{listing.propertyType}</dd>
                  </div>
                )}
                {listing.subdivisionName && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Subdivision</dt>
                    <dd className="font-medium text-gray-900">{listing.subdivisionName}</dd>
                  </div>
                )}
                {listing.mlsAreaMinor && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Area</dt>
                    <dd className="font-medium text-gray-900">{listing.mlsAreaMinor}</dd>
                  </div>
                )}
                {listing.yearBuilt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Year Built</dt>
                    <dd className="font-medium text-gray-900">{listing.yearBuilt}</dd>
                  </div>
                )}
                {listing.lotSize && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Lot Size</dt>
                    <dd className="font-medium text-gray-900">
                      {listing.lotSize >= 1
                        ? `${listing.lotSize.toFixed(2)} acres`
                        : `${(listing.lotSize * 43560).toLocaleString()} sq ft`}
                    </dd>
                  </div>
                )}
                {listing.furnished && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Furnished</dt>
                    <dd className="font-medium text-gray-900">{listing.furnished}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Interior Features */}
            {(listing.fireplaceYn || listing.cooling?.length || listing.heating?.length || listing.laundryFeatures?.length) && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interior Features</h3>
                <dl className="space-y-3">
                  {listing.fireplaceYn && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Fireplace</dt>
                      <dd className="font-medium text-gray-900">
                        {listing.fireplaceTotal ? `${listing.fireplaceTotal} fireplace${listing.fireplaceTotal > 1 ? 's' : ''}` : 'Yes'}
                      </dd>
                    </div>
                  )}
                  {listing.fireplaceFeatures && listing.fireplaceFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Fireplace Features</dt>
                      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.fireplaceFeatures.join(', ')}</dd>
                    </div>
                  )}
                  {listing.cooling && listing.cooling.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Cooling</dt>
                      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.cooling.join(', ')}</dd>
                    </div>
                  )}
                  {listing.heating && listing.heating.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Heating</dt>
                      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.heating.join(', ')}</dd>
                    </div>
                  )}
                  {listing.laundryFeatures && listing.laundryFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Laundry</dt>
                      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.laundryFeatures.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Parking */}
            {(listing.attachedGarageYn || listing.parkingFeatures?.length) && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parking</h3>
                <dl className="space-y-3">
                  {listing.attachedGarageYn && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Attached Garage</dt>
                      <dd className="font-medium text-gray-900">Yes</dd>
                    </div>
                  )}
                  {listing.parkingFeatures && listing.parkingFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Parking Features</dt>
                      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{listing.parkingFeatures.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Association Amenities */}
            {listing.associationAmenities && listing.associationAmenities.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Association Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.associationAmenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="bg-[var(--color-gold)] p-6 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Interested in this property?</h3>
              <p className="text-white/80 text-sm mb-4">
                This is an exclusive off-market listing. Contact us for more information or to schedule a private viewing.
              </p>
              <button className="w-full bg-white text-[var(--color-gold)] font-semibold py-3 px-4 rounded-md hover:bg-gray-100 transition-colors">
                Request Private Showing
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
