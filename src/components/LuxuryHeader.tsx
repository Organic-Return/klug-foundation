'use client';

import { useState, useEffect, useRef } from 'react';
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
  titleUrl?: string;
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
  email?: string;
  forceBackground?: boolean;
}

export default function LuxuryHeader({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  navItems = [],
  phoneNumber,
  email,
  forceBackground = false,
}: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if we should show scrolled state (white background)
  const showScrolledState = (isScrolled || forceBackground) && !mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const toggleMobileDropdown = (index: number) => {
    setActiveMobileDropdown(activeMobileDropdown === index ? null : index);
  };

  const hasDropdown = (item: NavItem) => {
    return item.hasMegaMenu || (item.simpleDropdown && item.simpleDropdown.length > 0);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showScrolledState
            ? 'bg-white shadow-md'
            : 'bg-transparent'
        }`}
      >
        {/* Main Header - Logo, Contact Info all in one row */}
        <div className={`mx-auto max-w-[1800px] px-6 lg:px-8 border-b transition-colors duration-500 ${
          showScrolledState ? 'border-gray-200' : 'border-white/20'
        }`}>
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Left - Mobile Menu Button / Desktop Contact Icons */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden flex items-center gap-2 p-2 -ml-2 transition-colors ${
                  showScrolledState ? 'text-[#00254a] hover:text-[#00254a]/70' : 'text-white hover:text-white/70'
                }`}
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-1.5 w-5">
                  <span className={`block h-[1px] bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`block h-[1px] bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block h-[1px] bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </div>
              </button>

              {/* Desktop Contact Icons */}
              <div className="hidden lg:flex items-center gap-6">
                {phoneNumber && (
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                    className={`flex items-center gap-2 transition-colors group ${
                      showScrolledState ? 'text-gray-500 hover:text-[#00254a]' : 'text-white/70 hover:text-white'
                    }`}
                    aria-label={phoneNumber}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12 10.36a.9.9 0 0 0-.91 0l-1.42.85a.89.89 0 0 1-1-.06 21.83 21.83 0 0 1-2-1.77 23.17 23.17 0 0 1-1.76-2 .89.89 0 0 1-.06-1l.85-1.42a.92.92 0 0 0 0-.92L3.55.45a.88.88 0 0 0-1-.42 2.86 2.86 0 0 0-1.37.83C-.43 2.47-1.29 5.18 4.76 11.24s8.77 5.19 10.38 3.58a2.86 2.86 0 0 0 .86-1.38.89.89 0 0 0-.41-1z" />
                    </svg>
                    <span className="text-xs tracking-wide">{phoneNumber}</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className={`flex items-center gap-2 transition-colors ${
                      showScrolledState ? 'text-gray-500 hover:text-[#00254a]' : 'text-white/70 hover:text-white'
                    }`}
                    aria-label={email}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 17 11">
                      <path d="M8.25 4.583L15.583.021C15.503.008 15.423 0 15.34 0H1.16C1.077 0 .996.009.917.02L8.25 4.584z" />
                      <path d="M8.691 6.06l-.03.016-.03.017a.8.8 0 0 1-.17.07l-.018.004a.8.8 0 0 1-.192.026H8.25a.788.788 0 0 1-.192-.026l-.018-.004a.824.824 0 0 1-.201-.087c-.01-.006-.02-.01-.03-.017L.023.917A1.67 1.67 0 0 0 0 1.184v8.253C0 10.3.66 11 1.476 11h13.548c.815 0 1.476-.7 1.476-1.563V1.184c0-.092-.009-.18-.023-.267L8.69 6.059z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Centered Logo */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              {logo?.asset?.url ? (
                <div className="relative h-16 w-48 sm:h-18 sm:w-54 lg:h-20 lg:w-64">
                  <Image
                    src={urlFor(logo).width(600).url()}
                    alt={logoAlt}
                    fill
                    className={`object-contain transition-all duration-500 ${
                      showScrolledState ? '' : 'brightness-0 invert'
                    }`}
                    priority
                  />
                </div>
              ) : (
                <span className={`text-sm lg:text-base font-light tracking-[0.2em] uppercase transition-colors duration-500 ${
                  showScrolledState ? 'text-[#00254a]' : 'text-white'
                }`}>
                  {siteTitle}
                </span>
              )}
            </Link>

            {/* Right - Contact Button */}
            <div className="flex items-center gap-6">
              {/* Mobile placeholder for balance */}
              <div className="lg:hidden w-8" />

              {/* Desktop Contact Link */}
              <Link
                href="/contact-us"
                className={`hidden lg:block text-xs tracking-wide transition-colors ${
                  showScrolledState ? 'text-gray-500 hover:text-[#00254a]' : 'text-white/70 hover:text-white'
                }`}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="hidden lg:block" ref={dropdownRef}>
          <nav className="mx-auto max-w-[1800px] px-8">
            <ul className="flex items-center justify-center gap-1">
              {navItems.map((item, index) => (
                <li key={index} className="relative">
                  {item.url && !hasDropdown(item) ? (
                    <Link
                      href={item.url}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                      className={`block px-5 py-4 text-[13px] tracking-[0.1em] font-light hover:text-[var(--color-gold)] transition-colors ${
                        showScrolledState ? 'text-[#00254a]' : 'text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggleDropdown(index)}
                      className={`flex items-center gap-1 px-5 py-4 text-[13px] tracking-[0.1em] font-light transition-colors ${
                        activeDropdown === index
                          ? 'text-[var(--color-gold)]'
                          : showScrolledState
                            ? 'text-[#00254a] hover:text-[var(--color-gold)]'
                            : 'text-white hover:text-[var(--color-gold)]'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Mega Menu Dropdown - Always dark background */}
          {activeDropdown !== null && navItems[activeDropdown] && (
            <div className="absolute left-0 right-0 bg-[#00254a] border-t border-white/10 shadow-2xl">
              <div className="mx-auto max-w-[1400px] px-8 py-10">
                {navItems[activeDropdown].hasMegaMenu && navItems[activeDropdown].megaMenuColumns && (
                  <div className={`grid gap-12 ${
                    navItems[activeDropdown].megaMenuColumns!.length === 4 ? 'grid-cols-4' :
                    navItems[activeDropdown].megaMenuColumns!.length === 3 ? 'grid-cols-3' :
                    navItems[activeDropdown].megaMenuColumns!.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {navItems[activeDropdown].megaMenuColumns!.map((column, colIndex) => (
                      <div key={colIndex}>
                        {column.title && (
                          column.titleUrl ? (
                            <Link
                              href={column.titleUrl}
                              className="block mb-4 text-[var(--color-gold)] text-sm font-medium tracking-wide hover:text-white transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {column.title}
                            </Link>
                          ) : (
                            <p className="mb-4 text-[var(--color-gold)] text-sm font-medium tracking-wide">
                              {column.title}
                            </p>
                          )
                        )}
                        {column.featuredImage && (
                          <div className="relative h-32 w-full mb-4 overflow-hidden">
                            <Image
                              src={urlFor(column.featuredImage).width(400).url()}
                              alt={column.title || 'Featured'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <ul className="space-y-3">
                          {column.links?.map((link, linkIndex) => (
                            <li key={linkIndex}>
                              <Link
                                href={link.url}
                                target={link.openInNewTab ? '_blank' : undefined}
                                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                className="block text-white/70 text-sm font-light hover:text-white transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {link.label}
                                {link.description && (
                                  <span className="block text-white/40 text-xs mt-0.5">
                                    {link.description}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {!navItems[activeDropdown].hasMegaMenu && navItems[activeDropdown].simpleDropdown && (
                  <ul className="flex flex-wrap gap-x-12 gap-y-3">
                    {navItems[activeDropdown].simpleDropdown!.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href={link.url}
                          target={link.openInNewTab ? '_blank' : undefined}
                          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="block text-white/70 text-sm font-light hover:text-white transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-[#00254a]" />

        <div className="relative h-full pt-20 overflow-y-auto">
          <div className="px-6 py-8">
            {/* Mobile Navigation */}
            <nav>
              <ul className="space-y-0">
                {navItems.map((item, index) => (
                  <li key={index} className="border-b border-white/10">
                    {item.url && !hasDropdown(item) ? (
                      <Link
                        href={item.url}
                        target={item.openInNewTab ? '_blank' : undefined}
                        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="block py-4 text-white text-lg font-light tracking-wide hover:text-[var(--color-gold)] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleMobileDropdown(index)}
                          className="w-full flex items-center justify-between py-4 text-white text-lg font-light tracking-wide hover:text-[var(--color-gold)] transition-colors"
                        >
                          <span>{item.label}</span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-300 ${
                              activeMobileDropdown === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            activeMobileDropdown === index ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="pb-4 pl-4">
                            {item.hasMegaMenu && item.megaMenuColumns?.map((column, colIndex) => (
                              <div key={colIndex} className="mb-4">
                                {column.title && (
                                  <p className="text-[var(--color-gold)] text-xs uppercase tracking-[0.2em] mb-2">
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
                                        onClick={() => setMobileMenuOpen(false)}
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
                                onClick={() => setMobileMenuOpen(false)}
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

            {/* Mobile Contact Info */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="space-y-4">
                {phoneNumber && (
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12 10.36a.9.9 0 0 0-.91 0l-1.42.85a.89.89 0 0 1-1-.06 21.83 21.83 0 0 1-2-1.77 23.17 23.17 0 0 1-1.76-2 .89.89 0 0 1-.06-1l.85-1.42a.92.92 0 0 0 0-.92L3.55.45a.88.88 0 0 0-1-.42 2.86 2.86 0 0 0-1.37.83C-.43 2.47-1.29 5.18 4.76 11.24s8.77 5.19 10.38 3.58a2.86 2.86 0 0 0 .86-1.38.89.89 0 0 0-.41-1z" />
                    </svg>
                    <span className="text-sm">{phoneNumber}</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 17 11">
                      <path d="M8.25 4.583L15.583.021C15.503.008 15.423 0 15.34 0H1.16C1.077 0 .996.009.917.02L8.25 4.584z" />
                      <path d="M8.691 6.06l-.03.016-.03.017a.8.8 0 0 1-.17.07l-.018.004a.8.8 0 0 1-.192.026H8.25a.788.788 0 0 1-.192-.026l-.018-.004a.824.824 0 0 1-.201-.087c-.01-.006-.02-.01-.03-.017L.023.917A1.67 1.67 0 0 0 0 1.184v8.253C0 10.3.66 11 1.476 11h13.548c.815 0 1.476-.7 1.476-1.563V1.184c0-.092-.009-.18-.023-.267L8.69 6.059z" />
                    </svg>
                    <span className="text-sm">{email}</span>
                  </a>
                )}
                <Link
                  href="/contact-us"
                  className="inline-block mt-4 text-[11px] uppercase tracking-[0.2em] font-light bg-[var(--color-gold)] text-white px-6 py-3 hover:bg-white hover:text-[#00254a] transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
