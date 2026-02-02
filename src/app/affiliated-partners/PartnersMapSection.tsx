'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import type { EnrichedPartner } from './components';
import { getPartnerUrl } from './components';

interface PartnersMapSectionProps {
  partners: EnrichedPartner[];
  title?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#e0e0e0' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6a6a6a' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#c9c9c9' }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#e8e8e8' }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#d6d6d6' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#dadada' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#c0c0c0' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
  ],
};

function PartnerMarker({
  partner,
  isSelected,
  onClick
}: {
  partner: EnrichedPartner;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!partner.latitude || !partner.longitude) return null;

  return (
    <OverlayViewF
      position={{ lat: partner.latitude, lng: partner.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        onClick={onClick}
        className={`relative -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          isSelected ? 'scale-125 z-20' : 'scale-100 z-10 hover:scale-110'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full overflow-hidden border-3 shadow-lg transition-all duration-300 ${
            isSelected
              ? 'border-[var(--color-gold)] ring-4 ring-[var(--color-gold)]/30'
              : 'border-white hover:border-[var(--color-gold)]'
          }`}
        >
          {partner.photoUrl ? (
            <img
              src={partner.photoUrl}
              alt={`${partner.firstName} ${partner.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center text-[#aaa]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
        {/* Location pin below the photo */}
        <div className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent transition-colors duration-300 ${
          isSelected ? 'border-t-[var(--color-gold)]' : 'border-t-white'
        }`} />
      </button>
    </OverlayViewF>
  );
}

function PartnerListCard({
  partner,
  isSelected,
  onClick,
}: {
  partner: EnrichedPartner;
  isSelected: boolean;
  onClick: () => void;
}) {
  const partnerUrl = getPartnerUrl(partner);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`p-4 border-b border-[#e8e6e3] dark:border-gray-800 cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-[var(--color-gold)]/10 border-l-4 border-l-[var(--color-gold)]'
          : 'hover:bg-[#f8f7f5] dark:hover:bg-[#252525]'
      }`}
    >
      <div className="flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-[#f0f0f0] dark:bg-gray-800">
          {partner.photoUrl ? (
            <Image
              src={partner.photoUrl}
              alt={`${partner.firstName} ${partner.lastName}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#aaa] dark:text-gray-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-[#1a1a1a] dark:text-white">
            {partner.firstName} {partner.lastName}
          </h3>
          {partner.title && (
            <p className="text-sm text-[var(--color-gold)]">{partner.title}</p>
          )}
          {partner.company && (
            <p className="text-sm text-[#6a6a6a] dark:text-gray-400">{partner.company}</p>
          )}
          {partner.location && (
            <p className="text-sm text-[#888] dark:text-gray-500 flex items-center gap-1 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {partner.location}
            </p>
          )}

          {/* Contact & View Details */}
          <div className="flex items-center gap-3 mt-3">
            {partner.email && (
              <a
                href={`mailto:${partner.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
                title="Email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            )}
            {partner.phone && (
              <a
                href={`tel:${partner.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
                title="Phone"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}
            <Link
              href={partnerUrl}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-xs uppercase tracking-wider text-[var(--color-gold)] hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnersMapSection({ partners, title = 'Our Partner Network' }: PartnersMapSectionProps) {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Filter partners with valid coordinates
  const partnersWithCoords = partners.filter(
    (p) => p.latitude !== null && p.latitude !== undefined &&
           p.longitude !== null && p.longitude !== undefined
  );

  // Calculate center of all partners
  const center = partnersWithCoords.length > 0
    ? {
        lat: partnersWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / partnersWithCoords.length,
        lng: partnersWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / partnersWithCoords.length,
      }
    : { lat: 39.1911, lng: -106.8175 }; // Default to Aspen

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (partnersWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      partnersWithCoords.forEach((partner) => {
        if (partner.latitude && partner.longitude) {
          bounds.extend({ lat: partner.latitude, lng: partner.longitude });
        }
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [partnersWithCoords]);

  const handlePartnerClick = (partnerId: string) => {
    setSelectedPartner(partnerId === selectedPartner ? null : partnerId);

    // Pan to the selected partner
    const partner = partners.find((p) => p._id === partnerId);
    if (partner?.latitude && partner?.longitude && mapRef.current) {
      mapRef.current.panTo({ lat: partner.latitude, lng: partner.longitude });
      mapRef.current.setZoom(10);
    }
  };

  // Don't render if no partners have coordinates
  if (partnersWithCoords.length === 0) {
    return null;
  }

  if (loadError) {
    return (
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center text-gray-500">
            <p>Unable to load map</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center tracking-wide">
          {title}
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 border-y border-[#e8e6e3] dark:border-gray-800 overflow-hidden">
          {/* Partner List - Left Side */}
          <div className="w-full lg:w-2/5 max-h-[800px] overflow-y-auto bg-white dark:bg-[#1a1a1a]">
            <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-[#e8e6e3] dark:border-gray-800 p-4 z-10">
              <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                {partnersWithCoords.length} {partnersWithCoords.length === 1 ? 'Partner' : 'Partners'} with locations
              </p>
            </div>
            {partners.map((partner) => (
              <PartnerListCard
                key={partner._id}
                partner={partner}
                isSelected={selectedPartner === partner._id}
                onClick={() => handlePartnerClick(partner._id)}
              />
            ))}
          </div>

          {/* Map - Right Side */}
          <div className="w-full lg:w-3/5 h-[600px] lg:h-[800px] bg-[#f0f0f0] dark:bg-gray-800">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#6a6a6a] dark:text-gray-400">Loading map...</div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={5}
                options={mapOptions}
                onLoad={onMapLoad}
              >
                {partnersWithCoords.map((partner) => (
                  <PartnerMarker
                    key={partner._id}
                    partner={partner}
                    isSelected={selectedPartner === partner._id}
                    onClick={() => handlePartnerClick(partner._id)}
                  />
                ))}
              </GoogleMap>
            )}
          </div>
        </div>
    </section>
  );
}
