'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, cloneElement, isValidElement } from 'react';

interface LayoutWrapperProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export default function LayoutWrapper({ header, footer, children }: LayoutWrapperProps) {
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

  // Check if we're on the listings page (no footer, fixed height layout)
  const isListingsPage = pathname === '/listings';

  // Check if we're on a property detail page
  const isPropertyPage = pathname?.startsWith('/listings/');

  // Check if we're on the why-klug-properties page
  const isWhyKlugPage = pathname === '/why-klug-properties';

  // Check if we're on an off-market page
  const isOffMarketPage = pathname?.startsWith('/off-market');

  // Check if we're on the saved properties page
  const isSavedPropertiesPage = pathname === '/saved-properties';

  // Pages that need forced blue background on header
  const needsForceBackground = isListingsPage || isPropertyPage || isWhyKlugPage || isOffMarketPage || isSavedPropertiesPage;

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
        {headerWithProps}
        <div className="flex-1 pt-20 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Regular pages: include header/footer with padding (except homepage and community pages)
  const needsPadding = !isHomepage && !isCommunityPage;

  return (
    <>
      {headerWithProps}
      <div className={needsPadding ? 'pt-20' : ''}>
        {children}
      </div>
      {footer}
    </>
  );
}
