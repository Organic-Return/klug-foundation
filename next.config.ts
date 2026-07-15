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
