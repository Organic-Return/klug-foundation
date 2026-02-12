'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, PolygonF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import type { MLSProperty } from '@/lib/listings';

interface ListingsMapProps {
  listings: MLSProperty[];
  onDrawComplete?: (filteredListings: MLSProperty[]) => void;
  onDrawClear?: () => void;
  hasLocationFilter?: boolean; // true when city or neighborhood is selected
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

// Format price for map markers (e.g., $4.9M, $799K)
function formatPriceShort(price: number | null): string {
  if (!price) return 'N/A';
  if (price >= 1000000) {
    const millions = price / 1000000;
    // Show one decimal if not a whole number
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (price >= 1000) {
    const thousands = price / 1000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`;
  }
  return `$${price}`;
}

// Sotheby's blue color
const SOTHEBYS_BLUE = '#00254a';

// Price flag marker component
interface PriceMarkerProps {
  position: google.maps.LatLngLiteral;
  price: number | null;
  status: string;
  onClick: () => void;
  isSelected: boolean;
}

function PriceMarker({ position, price, status, onClick, isSelected }: PriceMarkerProps) {
  const isClosed = status === 'Closed';

  return (
    <OverlayViewF
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div
        onClick={onClick}
        className={`cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'scale-110 z-10' : ''}`}
        style={{ position: 'relative' }}
      >
        {/* Flag body */}
        <div
          className={`px-2 py-1 rounded-sm text-white text-xs font-semibold whitespace-nowrap shadow-md ${
            isClosed ? 'opacity-60' : ''
          }`}
          style={{
            backgroundColor: isSelected ? '#c5a047' : SOTHEBYS_BLUE,
            minWidth: '45px',
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
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `8px solid ${isSelected ? '#c5a047' : SOTHEBYS_BLUE}`,
            opacity: isClosed ? 0.6 : 1,
          }}
        />
      </div>
    </OverlayViewF>
  );
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: { lat: number; lng: number }, polygon: google.maps.LatLngLiteral[]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Grayscale map styles to match the individual listing page
const grayscaleStyles: google.maps.MapTypeStyle[] = [
  {
    // Apply grayscale to all elements
    elementType: 'all',
    stylers: [{ saturation: -100 }],
  },
  {
    // Slightly lighten water for better contrast
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ lightness: 20 }],
  },
  {
    // Make roads slightly lighter
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ lightness: 40 }],
  },
  {
    // Subtle road outlines
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ lightness: 60 }],
  },
  {
    // Lighten POI backgrounds
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ lightness: 20 }],
  },
  {
    // Make labels more readable
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ lightness: -20 }],
  },
];

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: grayscaleStyles,
};

const polygonOptions = {
  fillColor: SOTHEBYS_BLUE,
  fillOpacity: 0.2,
  strokeColor: SOTHEBYS_BLUE,
  strokeOpacity: 0.8,
  strokeWeight: 2,
};

export default function ListingsMap({ listings, onDrawComplete, onDrawClear, hasLocationFilter }: ListingsMapProps) {
  const [selectedListing, setSelectedListing] = useState<MLSProperty | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [completedPolygon, setCompletedPolygon] = useState<google.maps.LatLngLiteral[] | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  // Filter listings with valid finite coordinates
  const listingsWithCoords = listings.filter(
    (listing) =>
      typeof listing.latitude === 'number' &&
      typeof listing.longitude === 'number' &&
      isFinite(listing.latitude) &&
      isFinite(listing.longitude)
  );

  // Calculate center of all listings
  const center = listingsWithCoords.length > 0
    ? {
        lat:
          listingsWithCoords.reduce((sum, l) => sum + (l.latitude || 0), 0) /
          listingsWithCoords.length,
        lng:
          listingsWithCoords.reduce((sum, l) => sum + (l.longitude || 0), 0) /
          listingsWithCoords.length,
      }
    : { lat: 39.1911, lng: -106.8175 };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (listingsWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      listingsWithCoords.forEach((listing) => {
        bounds.extend({ lat: listing.latitude!, lng: listing.longitude! });
      });
      map.fitBounds(bounds);

      // When a city/neighborhood is selected, zoom in more after fitBounds
      if (hasLocationFilter) {
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom < 13) {
            map.setZoom(13);
          }
        });
      }
    }
  }, [listingsWithCoords, hasLocationFilter]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return;

    const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setDrawingPoints((prev) => [...prev, newPoint]);
  }, [isDrawing]);

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
    setCompletedPolygon(null);
    if (mapRef.current) {
      mapRef.current.setOptions({ draggableCursor: 'crosshair' });
    }
  };

  const completeDrawing = () => {
    if (drawingPoints.length >= 3) {
      setCompletedPolygon(drawingPoints);
      setIsDrawing(false);
      if (mapRef.current) {
        mapRef.current.setOptions({ draggableCursor: null });
      }

      // Filter listings within the polygon
      const filteredListings = listingsWithCoords.filter((listing) =>
        isPointInPolygon(
          { lat: listing.latitude!, lng: listing.longitude! },
          drawingPoints
        )
      );

      if (onDrawComplete) {
        onDrawComplete(filteredListings);
      }
    }
  };

  const clearDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
    setCompletedPolygon(null);
    if (mapRef.current) {
      mapRef.current.setOptions({ draggableCursor: null });
    }
    if (onDrawClear) {
      onDrawClear();
    }
  };

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        clearDrawing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  if (!apiKey || loadError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Map unavailable</p>
          <p className="text-sm mt-1">Switch to list view to browse properties</p>
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
    <div className="relative w-full h-full">
      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {!isDrawing && !completedPolygon && (
          <button
            onClick={startDrawing}
            className="px-4 py-2 bg-white rounded-md shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Draw to Search
          </button>
        )}

        {isDrawing && (
          <>
            <div className="px-4 py-2 bg-blue-600 rounded-md shadow-md text-sm font-medium text-white">
              Click on map to draw area
            </div>
            <div className="flex gap-2">
              <button
                onClick={completeDrawing}
                disabled={drawingPoints.length < 3}
                className={`px-4 py-2 rounded-md shadow-md text-sm font-medium flex items-center gap-2 ${
                  drawingPoints.length >= 3
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete ({drawingPoints.length} points)
              </button>
              <button
                onClick={clearDrawing}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md text-sm font-medium hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded">
              Press Esc to cancel
            </p>
          </>
        )}

        {completedPolygon && (
          <button
            onClick={clearDrawing}
            className="px-4 py-2 bg-white rounded-md shadow-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Area Search
          </button>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        options={{
          ...mapOptions,
          draggable: !isDrawing,
        }}
        onLoad={onLoad}
        onClick={handleMapClick}
      >
        {/* Drawing polygon (in progress) */}
        {isDrawing && drawingPoints.length >= 2 && (
          <PolygonF
            paths={drawingPoints}
            options={{
              ...polygonOptions,
              fillOpacity: 0.1,
              strokeWeight: 2,
              strokeOpacity: 0.5,
            }}
          />
        )}

        {/* Completed polygon */}
        {completedPolygon && (
          <PolygonF
            paths={completedPolygon}
            options={polygonOptions}
          />
        )}

        {/* Drawing points markers */}
        {isDrawing && drawingPoints.map((point, index) => (
          <MarkerF
            key={`draw-point-${index}`}
            position={point}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: SOTHEBYS_BLUE,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Listing price markers */}
        {listingsWithCoords.map((listing) => (
          <PriceMarker
            key={listing.id}
            position={{ lat: listing.latitude!, lng: listing.longitude! }}
            price={listing.list_price}
            status={listing.status}
            onClick={() => setSelectedListing(listing)}
            isSelected={selectedListing?.id === listing.id}
          />
        ))}

        {selectedListing && (
          <InfoWindowF
            position={{
              lat: selectedListing.latitude!,
              lng: selectedListing.longitude!,
            }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="min-w-[200px] p-1">
              <p className="font-bold text-lg text-gray-900">
                {formatPrice(selectedListing.list_price)}
              </p>
              <p className="text-sm text-gray-600">{selectedListing.address}</p>
              <p className="text-sm text-gray-500">
                {selectedListing.bedrooms} bd | {selectedListing.bathrooms} ba
                {selectedListing.square_feet &&
                  ` | ${selectedListing.square_feet.toLocaleString()} sqft`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MLS# {selectedListing.mls_number}
              </p>
              <a
                href={`/listings/${selectedListing.id}`}
                className="mt-2 inline-block text-sm text-[#00254a] hover:underline font-medium"
              >
                View Details
              </a>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {listingsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 pointer-events-none">
          <p className="text-gray-500">No properties with location data</p>
        </div>
      )}
    </div>
  );
}
