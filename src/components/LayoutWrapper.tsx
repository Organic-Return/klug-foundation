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

  // Check if we're on the listings page (no footer, fixed height layout)
  const isListingsPage = pathname === '/listings';

  // RC Sotheby's header is static (not fixed), so no forceBackground needed
  const isRCSothebys = template === 'rcsothebys-custom';

  // Force blue header on ALL pages except homepage and community pages (which have transparent hero overlays)
  // Skip for rcsothebys-custom since its header is always cream/static
  const needsForceBackground = !isRCSothebys && !isHomepage && !isCommunityPage;

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
        <div className={`flex-1 overflow-hidden ${isRCSothebys ? '' : 'pt-20'}`}>
          {children}
        </div>
      </div>
    );
  }

  // Custom-one property pages handle their own padding
  const isPropertyPage = pathname?.startsWith('/listings/');
  const isCustomOnePropertyPage = template === 'custom-one' && isPropertyPage;

  // Regular pages: include header/footer with padding (except homepage, community pages, custom-one property pages, and rcsothebys-custom)
  // RC Sotheby's header is static so no padding offset needed
  const needsPadding = !isRCSothebys && !isHomepage && !isCommunityPage && !isCustomOnePropertyPage;

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
