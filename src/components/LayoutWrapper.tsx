'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, cloneElement, isValidElement, useDeferredValue } from 'react';

interface LayoutWrapperProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  template?: string;
}

export default function LayoutWrapper({ header, footer, children, template }: LayoutWrapperProps) {
  // usePathname updates the moment the URL changes, but server-rendered
  // page children can take a beat to stream in. If we let the layout's
  // padding / forceBackground flip ahead of the new page, the user sees
  // the layout's empty <main> (body bg = white) under a transparent nav
  // before the new hero arrives. Defer the pathname so the layout stays
  // on the previous configuration until React has the new children ready,
  // then both flip together — same atomic feel as a hard reload.
  const rawPathname = usePathname();
  const pathname = useDeferredValue(rawPathname);

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
    pathname === '/aspen-snowmass-market-reports' ||
    pathname === '/media/living-aspen-magazine' ||
    pathname === '/media/videos' ||
    pathname === '/about/blog' ||
    pathname === '/in-the-news' ||
    pathname === '/about/why-klug-properties' ||
    pathname === '/about/testimonials' ||
    pathname === '/about/partners' ||
    pathname === '/about/ski-town-partners' ||
    pathname === '/affiliated-partners/market-leaders' ||
    pathname === '/about/our-team' ||
    pathname === '/contact-us' ||
    pathname === '/terms-of-service' ||
    pathname === '/rentals' ||
    pathname === '/commercial' ||
    pathname === '/land' ||
    pathname?.startsWith('/rentals/') === true ||
    pathname?.startsWith('/commercial/') === true ||
    pathname?.startsWith('/land/') === true ||
    // Market Leader listing detail pages share the full-screen
    // property template, which has its own image hero — let the
    // header sit transparently on top of it.
    pathname?.startsWith('/affiliated-partners/market-leaders/listings/') === true ||
    // Off-market listing detail pages have their own photo hero
    // (or a blurred registration gate); header sits on top transparently.
    pathname?.startsWith('/off-market/') === true ||
    // MLS listing detail pages always lead with a property image hero;
    // /real-estate-for-sale (the index) keeps its solid header.
    (pathname?.startsWith('/real-estate-for-sale/') === true && pathname !== '/real-estate-for-sale');

  // Check if we're on the listings page (no footer, fixed height layout)
  const isListingsPage = pathname === '/real-estate-for-sale';

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
  const isPropertyPage = pathname?.startsWith('/real-estate-for-sale/');
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
