import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Lighthouse Best Practices flags missing source maps for large
  // first-party JS bundles. Marketing site code is fine to expose.
  productionBrowserSourceMaps: true,


  // Image optimization with modern formats
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // MLS image sources
      {
        protocol: 'https',
        hostname: '*.mlsmatrix.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.photos.flexmls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photos.flexmls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.mls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ssl.cdn-redfin.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.zillowstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ap.rdcpix.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.listingphotos.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    // Enable AVIF and WebP for better compression and quality
    formats: ['image/avif', 'image/webp'],
  },
  // Permanent redirects from legacy/renamed paths to their live routes. These
  // paths 404 today and are still linked from external sites, old crawls, and
  // some CMS-managed navigation. Sources are EXACT where a sibling subtree is a
  // real route that must not be caught:
  //   /affiliated-partners/market-leaders (real), /affiliated-partners/ski-town/[slug]
  //   (real agent pages), and /team/[slug] (real) must all keep resolving.
  async redirects() {
    return [
      { source: '/market-reports', destination: '/aspen-snowmass-market-reports', permanent: true },
      { source: '/market-reports/:slug*', destination: '/aspen-snowmass-market-reports/:slug*', permanent: true },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/team', destination: '/about/our-team', permanent: true },
      { source: '/affiliated-partners', destination: '/about/partners', permanent: true },
      { source: '/affiliated-partners/ski-town', destination: '/about/ski-town-partners', permanent: true },
      // Drupal-era paths that the rebuild moved but nothing redirected. Every
      // one of these 404s today while the live page's canonical tag still
      // pointed at it, so search engines were told the real version of each
      // page was a dead URL.
      { source: '/listings', destination: '/real-estate-for-sale', permanent: true },
      // Constrained to an 11-char YouTube id, because /media/videos/[id] looks
      // the video up by YouTube id and nothing else. The Drupal site also had
      // slug-style video URLs (/videos/chaparral-ranch-lot-6) that can never
      // resolve there — those keep 404ing honestly instead of taking a hop to
      // a 404.
      { source: '/videos/:id([A-Za-z0-9_-]{11})', destination: '/media/videos/:id', permanent: true },
      { source: '/living-aspen', destination: '/media/living-aspen-magazine', permanent: true },
      { source: '/living-aspen/:slug', destination: '/media/living-aspen-magazine/:slug', permanent: true },
      { source: '/testimonials', destination: '/about/testimonials', permanent: true },
      { source: '/blog', destination: '/about/blog', permanent: true },
      { source: '/why-klug-properties', destination: '/about/why-klug-properties', permanent: true },
    ];
  },
  async headers() {
    // Baseline security headers Lighthouse Best Practices checks for.
    // CSP is intentionally omitted: Next.js + Sanity Studio + inline
    // analytics snippets need a tested allowlist before turning it on.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
