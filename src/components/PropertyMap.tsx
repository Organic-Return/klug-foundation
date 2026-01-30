'use client';

import { useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  price?: number | null;
}

// Sotheby's blue color
const SOTHEBYS_BLUE = '#00254a';

// Format price for map markers (e.g., $4.9M, $799K)
function formatPriceShort(price: number | null | undefined): string {
  if (!price) return 'N/A';
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (price >= 1000) {
    const thousands = price / 1000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`;
  }
  return `$${price}`;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};


export default function PropertyMap({ latitude, longitude, address, price }: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);

  // Grayscale map styles - memoized to prevent re-renders
  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        elementType: 'all',
        stylers: [{ saturation: -100 }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ lightness: 20 }],
      },
      {
        featureType: 'road',
        elementType: 'geometry.fill',
        stylers: [{ lightness: 40 }],
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ lightness: 60 }],
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ lightness: 20 }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ lightness: -20 }],
      },
    ],
  }), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Error loading map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      options={mapOptions}
      onLoad={onLoad}
    >
      {/* Price flag marker */}
      <OverlayViewF
        position={center}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        getPixelPositionOffset={(width, height) => ({
          x: -(width / 2),
          y: -height,
        })}
      >
        <div style={{ position: 'relative' }} title={address}>
          {/* Flag body */}
          <div
            className="px-3 py-1.5 rounded-sm text-white text-sm font-semibold whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: SOTHEBYS_BLUE,
              minWidth: '50px',
              textAlign: 'center',
            }}
          >
            {formatPriceShort(price)}
          </div>
          {/* Flag pointer/triangle */}
          <div
            className="mx-auto"
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `10px solid ${SOTHEBYS_BLUE}`,
            }}
          />
        </div>
      </OverlayViewF>
    </GoogleMap>
  );
}
