'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import type { EnrichedPartner } from './components';
import { getPartnerUrl } from './components';
import { phoneHref } from '@/lib/phoneUtils';

interface PartnersMapSectionProps {
  partners: EnrichedPartner[];
  title?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Dark luxury map style inspired by Patek Philippe
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8a9ab5' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }, { weight: 2 }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a3040' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#3a4050' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#6a7a95' }] },
    { featureType: 'administrative.province', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1e2333' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1e2333' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#141824' }] },
    { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
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
        className={`klug-gallery-btn relative -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          isSelected ? 'scale-150 z-20' : 'scale-100 z-10 hover:scale-125'
        }`}
      >
        {/* Gold dot marker */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isSelected
              ? 'bg-white shadow-[0_0_12px_rgba(201,172,119,0.8)]'
              : 'bg-[#c9ac77] shadow-[0_0_6px_rgba(201,172,119,0.4)]'
          }`}
        />
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
      className={`p-4 border-b border-[#2a3040] cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-[#c9ac77]/10 border-l-4 border-l-[#c9ac77]'
          : 'hover:bg-[#222840]'
      }`}
    >
      <div className="flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-[#2a3040]">
          {partner.photoUrl ? (
            <Image
              src={partner.photoUrl}
              alt={`${partner.firstName} ${partner.lastName}`}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#5a6a85]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base text-white">
            {partner.firstName} {partner.lastName}
          </h3>
          {partner.company && (
            <p className="text-xs text-[#8a9ab5] mt-0.5">{partner.company}</p>
          )}
          {partner.location && (
            <p className="text-xs text-[#6a7a95] flex items-center gap-1 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {partner.location}
            </p>
          )}

          {/* View Details */}
          <div className="mt-2">
            <Link
              href={partnerUrl}
              onClick={(e) => e.stopPropagation()}
              className="klug-nav-link text-[10px] uppercase tracking-wider text-[#c9ac77] hover:text-white transition-colors"
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

  // Center on the US
  const center = { lat: 39.5, lng: -98.5 };

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
      // Zoom in ~20% after fitting bounds
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom != null) map.setZoom(currentZoom + 1);
      });
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
      <section className="py-16 md:py-24 bg-[#141824]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center text-[#8a9ab5]">
            <p>Unable to load map</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#141824]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white text-center tracking-wide">
          {title}
        </h2>
        <div className="w-12 h-px bg-[#c9ac77] mx-auto mt-6" />
      </div>

      <div className="flex flex-col lg:flex-row gap-0 border-y border-[#2a3040] overflow-hidden">
          {/* Partner List - Left Side */}
          <div className="w-full lg:w-2/5 max-h-[800px] overflow-y-auto bg-[#1a1f2e]">
            <div className="sticky top-0 bg-[#1a1f2e] border-b border-[#2a3040] p-4 z-10">
              <p className="text-sm text-[#8a9ab5] font-light">
                {partnersWithCoords.length} {partnersWithCoords.length === 1 ? 'Partner' : 'Partners'}
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
          <div className="w-full lg:w-3/5 h-[600px] lg:h-[800px] bg-[#141824]">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#8a9ab5]">Loading map...</div>
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
