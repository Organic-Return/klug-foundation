import type { MetadataRoute } from 'next';

/**
 * PWA manifest — drives the Android home-screen "install" tile colors,
 * the favicon's preferred PNG when iconography is requested by mid-tier
 * browsers, and the Lighthouse PWA score. Theme + background colors are
 * sampled from the navy in the CK logo so the home-screen install is
 * seamless with the icon art.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Klug Properties',
    short_name: 'Klug',
    description:
      'Luxury real estate in Aspen, Snowmass Village, and the Roaring Fork Valley.',
    start_url: '/',
    display: 'standalone',
    background_color: '#031129',
    theme_color: '#031129',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
