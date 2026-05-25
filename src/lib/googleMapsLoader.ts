'use client';

import { useJsApiLoader, type Libraries } from '@react-google-maps/api';

// Single source of truth for Google Maps loader options.
//
// @react-google-maps/api keeps a process-level singleton for the loader.
// If two components call useJsApiLoader with DIFFERENT options anywhere
// in the same browser session (across SPA navigations), the loader
// throws: "Loader must not be called again with different options."
//
// Previously each Map component computed apiKey independently and some
// fell back to '' when the env var or prop was missing — which produced
// option mismatches between e.g. /affiliated-partners (PartnersMapSection)
// and /real-estate-for-sale/[id] (PropertyMap). All Map components must
// now call this hook so options stay identical.
//
// Libraries array is constant by reference to avoid the secondary
// react-google-maps warning about re-renders.
const LIBRARIES: Libraries = ['maps'];

export function useSharedGoogleMapsLoader() {
  return useJsApiLoader({
    id: 'shared-google-maps',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
}

export function isGoogleMapsConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}
