'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, cloneElement, isValidElement } from 'react';

interface LayoutWrapperProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  template?: string;
}

export default function LayoutWrapper({ header, footer, children, template }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Check if we're on any Sanity Studio route or its sub-routes
  const isSanityRoute =
    pathname?.startsWith('/studio') ||
    pathname?.startsWith('/structure') ||
    pathname?.startsWith('/vision') ||
    pathname?.startsWith('/mux');

  // Check if we're on the homepage (no padding needed for full-height hero)
  const isHomepage = pathname === '/';

  // Check if we're on a community page (no padding needed for full-height hero)
  const isCommunityPage = pathname?.startsWith('/communities/');

  // Pages that have a transparent hero band the header should sit on
  // top of (rather than getting forced into the solid blue state).
  const hasTransparentHero =
    pathname === '/exclusive-and-new' ||
    pathname === '/sold-by-klug-properties' ||
    pathname === '/market-reports' ||
    pathname === '/living-aspen' ||
    pathname === '/blog' ||
    pathname === '/in-the-news' ||
    pathname === '/why-klug-properties' ||
    pathname === '/testimonials' ||
    pathname === '/affiliated-partners' ||
    pathname === '/affiliated-partners/ski-town' ||
    pathname === '/affiliated-partners/market-leaders';

  // Check if we're on the listings page (no footer, fixed height layout)
  const isListingsPage = pathname === '/listings';

  // RC Sotheby's header is static (not fixed), so no forceBackground needed
  const isRCSothebys = template === 'rcsothebys-custom';

  // Force blue header on ALL pages except those with transparent hero overlays
  const needsForceBackground = pathname != null && !isRCSothebys && !isHomepage && !isCommunityPage && !hasTransparentHero;

  // Clone header element to add forceBackground prop if needed
  const headerWithProps = needsForceBackground && isValidElement(header)
    ? cloneElement(header as React.ReactElement<any>, { forceBackground: true })
    : header;

  if (isSanityRoute) {
    // Sanity routes: no header/footer, no padding
    return <>{children}</>;
  }

  if (isListingsPage) {
    // Listings page: header but no footer, fixed viewport height
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-[var(--color-navy)] focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline focus:outline-2 focus:outline-[var(--color-gold)]">
          Skip to main content
        </a>
        {headerWithProps}
        <main id="main-content" className={`flex-1 overflow-hidden ${isRCSothebys ? '' : 'pt-20'}`}>
          {children}
        </main>
      </div>
    );
  }

  // Custom-one property pages handle their own padding
  const isPropertyPage = pathname?.startsWith('/listings/');
  const isCustomOnePropertyPage = template === 'custom-one' && isPropertyPage;

  // Regular pages: include header/footer with padding (except homepage, community pages, custom-one property pages, and rcsothebys-custom)
  // RC Sotheby's header is static so no padding offset needed
  // Transparent-hero pages drop the pt-20 so the hero sits behind the header.
  const needsPadding = !isRCSothebys && !isHomepage && !isCommunityPage && !isCustomOnePropertyPage && !hasTransparentHero;

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-[var(--color-navy)] focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline focus:outline-2 focus:outline-[var(--color-gold)]">
        Skip to main content
      </a>
      {headerWithProps}
      <main id="main-content" className={needsPadding ? 'pt-20' : ''}>
        {children}
      </main>
      {footer}
    </>
  );
}
