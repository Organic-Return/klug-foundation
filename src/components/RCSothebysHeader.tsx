'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface MegaMenuLink {
  label: string;
  url: string;
  description?: string;
  openInNewTab?: boolean;
}

interface MegaMenuColumn {
  title?: string;
  titleUrl?: string;
  subtitle?: string;
  links?: MegaMenuLink[];
  featuredImage?: any;
}

interface DropdownLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

interface NavItem {
  label: string;
  url?: string;
  openInNewTab?: boolean;
  hasMegaMenu?: boolean;
  megaMenuColumns?: MegaMenuColumn[];
  simpleDropdown?: DropdownLink[];
}

interface RCSothebysHeaderProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  navItems?: NavItem[];
  phoneNumber?: string;
  email?: string;
  forceBackground?: boolean;
}

export default function RCSothebysHeader({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  navItems = [],
  phoneNumber,
  email,
}: RCSothebysHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<number | null>(null);
  const pathname = usePathname();

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleMobileDropdown = (index: number) => {
    setActiveMobileDropdown(activeMobileDropdown === index ? null : index);
  };

  return (
    <header className="relative w-full bg-[var(--rc-cream)] shadow-lg z-50">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {logo?.asset?.url ? (
              <div className="relative h-10 sm:h-12 md:h-14 w-[8rem] sm:w-[10rem] md:w-[14rem]">
                <Image
                  src={urlFor(logo).width(420).url()}
                  alt={logoAlt}
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            ) : (
              <span className="text-lg font-light uppercase tracking-[0.15em] text-[var(--rc-navy)]">
                {siteTitle}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-8">
            {navItems.map((item, index) => (
              <div key={index} className="relative nav-dropdown-container">
                {(item.hasMegaMenu || (item.simpleDropdown && item.simpleDropdown.length > 0)) ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(index)}
                      className="flex items-center gap-1 text-[var(--rc-navy)] rc-nav py-2 border-b-2 border-transparent hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-all duration-300"
                    >
                      {item.label}
                      <svg
                        className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega Menu */}
                    {item.hasMegaMenu && activeDropdown === index && (
                      <div className="absolute top-full right-0 mt-0 bg-[var(--rc-cream)] shadow-xl border-t-2 border-[var(--rc-gold)] min-w-[600px] z-50">
                        <div className="grid grid-cols-3 gap-8 p-8">
                          {item.megaMenuColumns?.map((column, colIndex) => (
                            <div key={colIndex}>
                              {column.title && (
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rc-navy)] mb-4 pb-2 border-b border-[var(--rc-gold)]">
                                  {column.titleUrl ? (
                                    <Link href={column.titleUrl} onClick={() => setActiveDropdown(null)}>
                                      {column.title}
                                    </Link>
                                  ) : (
                                    column.title
                                  )}
                                </h4>
                              )}
                              {column.subtitle && (
                                <p className="text-xs text-[var(--rc-brown)] mb-3">{column.subtitle}</p>
                              )}
                              <ul className="space-y-2 list-none">
                                {column.links?.map((link, linkIndex) => (
                                  <li key={linkIndex} className="list-none">
                                    <Link
                                      href={link.url}
                                      target={link.openInNewTab ? '_blank' : undefined}
                                      onClick={() => setActiveDropdown(null)}
                                      className="text-sm text-[var(--rc-brown)] hover:text-[var(--rc-navy)] transition-colors duration-200"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simple Dropdown */}
                    {!item.hasMegaMenu && activeDropdown === index && (
                      <div className="absolute top-full left-0 mt-0 bg-[var(--rc-cream)] shadow-xl border-t-2 border-[var(--rc-gold)] min-w-[220px] z-50">
                        <div className="py-3">
                          {item.simpleDropdown?.map((link, linkIndex) => (
                            <Link
                              key={linkIndex}
                              href={link.url}
                              target={link.openInNewTab ? '_blank' : undefined}
                              onClick={() => setActiveDropdown(null)}
                              className="block px-6 py-2 text-sm text-[var(--rc-brown)] hover:text-[var(--rc-navy)] hover:bg-[var(--rc-navy)]/5 transition-colors duration-200"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.url || '#'}
                    target={item.openInNewTab ? '_blank' : undefined}
                    className="text-[var(--rc-navy)] rc-nav py-2 border-b-2 border-transparent hover:border-[var(--rc-gold)] hover:text-[var(--rc-gold)] transition-all duration-300"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-[var(--rc-navy)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[var(--rc-cream)] border-t border-[var(--rc-gold)]/20 shadow-inner">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item, index) => (
              <div key={index}>
                {(item.hasMegaMenu || (item.simpleDropdown && item.simpleDropdown.length > 0)) ? (
                  <>
                    <button
                      onClick={() => toggleMobileDropdown(index)}
                      className="flex items-center justify-between w-full py-3 text-sm uppercase tracking-[0.15em] font-medium text-[var(--rc-navy)]"
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${activeMobileDropdown === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeMobileDropdown === index && (
                      <div className="pl-4 pb-2 space-y-1">
                        {item.hasMegaMenu ? (
                          item.megaMenuColumns?.map((column, colIndex) => (
                            <div key={colIndex} className="mb-3">
                              {column.title && (
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--rc-navy)] mb-2">
                                  {column.title}
                                </p>
                              )}
                              {column.links?.map((link, linkIndex) => (
                                <Link
                                  key={linkIndex}
                                  href={link.url}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block py-1.5 text-sm text-[var(--rc-brown)] hover:text-[var(--rc-navy)]"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          ))
                        ) : (
                          item.simpleDropdown?.map((link, linkIndex) => (
                            <Link
                              key={linkIndex}
                              href={link.url}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-1.5 text-sm text-[var(--rc-brown)] hover:text-[var(--rc-navy)]"
                            >
                              {link.label}
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.url || '#'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 text-sm uppercase tracking-[0.15em] font-medium text-[var(--rc-navy)]"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Contact info in mobile menu */}
            {(phoneNumber || email) && (
              <div className="pt-4 mt-4 border-t border-[var(--rc-navy)]/10">
                {phoneNumber && (
                  <a href={`tel:${phoneNumber}`} className="block py-2 text-sm text-[var(--rc-brown)]">
                    {phoneNumber}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="block py-2 text-sm text-[var(--rc-brown)]">
                    {email}
                  </a>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
