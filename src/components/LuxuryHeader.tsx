'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = imageUrlBuilder(client);

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

interface LuxuryHeaderProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  navItems?: NavItem[];
  phoneNumber?: string;
  forceBackground?: boolean;
}

export default function LuxuryHeader({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  navItems = [],
  phoneNumber,
  forceBackground = false,
}: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleCategory = (index: number) => {
    setActiveCategory(activeCategory === index ? null : index);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          (isScrolled || forceBackground) && !menuOpen
            ? 'bg-[#00254a]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 lg:h-24">

            {/* Left - Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-3 p-2 -ml-2 transition-colors ${
                menuOpen
                  ? 'text-white'
                  : 'text-white hover:text-white/70'
              }`}
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1.5 w-6">
                <span className={`block h-[1.5px] bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-[1.5px] bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-[1.5px] bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
              <span className={`text-[11px] uppercase tracking-[0.25em] font-light hidden sm:block ${menuOpen ? 'text-white' : ''}`}>
                {menuOpen ? 'Close' : 'Menu'}
              </span>
            </button>

            {/* Center - Logo */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
              onClick={() => setMenuOpen(false)}
            >
              {logo?.asset?.url ? (
                <div className="relative h-16 w-48 sm:h-20 sm:w-56 md:h-24 md:w-72 lg:h-28 lg:w-88">
                  <Image
                    src={urlFor(logo).width(800).url()}
                    alt={logoAlt}
                    fill
                    className="object-contain transition-all duration-300 brightness-0 invert"
                    priority
                  />
                </div>
              ) : (
                <span className="text-base lg:text-lg font-extralight tracking-[0.2em] uppercase transition-colors duration-300 text-white">
                  {siteTitle}
                </span>
              )}
            </Link>

            {/* Right - Contact Link and Phone */}
            <div className="flex items-center gap-6">
              <Link
                href="/contact-us"
                className="text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-5 py-2.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
              >
                Contact Us
              </Link>
              {phoneNumber && (
                <>
                  <span className="hidden sm:block w-px h-4 bg-white/30" />
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                    className="hidden sm:block text-[11px] tracking-[0.1em] font-light transition-colors text-white hover:text-white/70"
                  >
                    {phoneNumber}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Full Screen Menu Overlay - One&Only Style */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Dark overlay background */}
        <div className="absolute inset-0 bg-[var(--color-navy)]" />

        {/* Menu Content */}
        <div className="relative h-full pt-24 lg:pt-28 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12">
            <div className="flex flex-col items-center">

              {/* Main Navigation - Centered */}
              <nav className="w-full max-w-md text-center">
                <ul className="space-y-0">
                  {navItems.map((item, index) => (
                    <li key={index} className="border-b border-white/10">
                      {item.url && !item.hasMegaMenu && !item.simpleDropdown ? (
                        <Link
                          href={item.url}
                          target={item.openInNewTab ? '_blank' : undefined}
                          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="block py-5 text-white text-lg font-normal tracking-[0.1em] hover:text-[var(--color-gold)] transition-colors duration-300"
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <div>
                          <button
                            onClick={() => toggleCategory(index)}
                            className="w-full flex items-center justify-center gap-3 py-5 text-white text-lg font-normal tracking-[0.1em] hover:text-[var(--color-gold)] transition-colors duration-300"
                          >
                            <span>{item.label}</span>
                            <svg
                              className={`w-5 h-5 transition-transform duration-300 ${
                                activeCategory === index ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Submenu */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              activeCategory === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="pb-6">
                              {item.hasMegaMenu && item.megaMenuColumns?.map((column, colIndex) => (
                                <div key={colIndex} className="mb-4">
                                  {column.title && (
                                    <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-[0.3em] mb-3">
                                      {column.title}
                                    </p>
                                  )}
                                  <ul className="space-y-2">
                                    {column.links?.map((link, linkIndex) => (
                                      <li key={linkIndex}>
                                        <Link
                                          href={link.url}
                                          target={link.openInNewTab ? '_blank' : undefined}
                                          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                          className="block text-white/70 text-sm font-light hover:text-white transition-colors"
                                          onClick={() => setMenuOpen(false)}
                                        >
                                          {link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}

                              {!item.hasMegaMenu && item.simpleDropdown?.map((link, linkIndex) => (
                                <Link
                                  key={linkIndex}
                                  href={link.url}
                                  target={link.openInNewTab ? '_blank' : undefined}
                                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                  className="block py-2 text-white/70 text-sm font-light hover:text-white transition-colors"
                                  onClick={() => setMenuOpen(false)}
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

            </div>

            {/* Bottom Section - Centered */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-8">
                  <Link
                    href="/contact-us"
                    className="text-white/60 text-[11px] uppercase tracking-[0.2em] font-light hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/about"
                    className="text-white/60 text-[11px] uppercase tracking-[0.2em] font-light hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>
                <div className="flex items-center gap-6">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
