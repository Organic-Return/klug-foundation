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

interface ModernHeaderProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  navItems?: NavItem[];
  phoneNumber?: string;
  email?: string;
  forceBackground?: boolean;
}

export default function ModernHeader({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  navItems = [],
  phoneNumber,
  email,
  forceBackground = false,
}: ModernHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showScrolledState = isScrolled || forceBackground;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownEnter = (index: number) => {
    setActiveDropdown(index);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  const toggleMobileDropdown = (index: number) => {
    setActiveMobileDropdown(activeMobileDropdown === index ? null : index);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showScrolledState
            ? 'bg-[var(--modern-black)] shadow-lg'
            : 'bg-transparent'
        }`}
      >
        {/* Top Bar */}
        <div
          className={`hidden lg:block border-b transition-colors duration-500 ${
            showScrolledState ? 'border-white/10' : 'border-white/10'
          }`}
        >
          <div className="max-w-[1800px] mx-auto px-8">
            <div className="flex items-center justify-between h-10">
              {/* Left - Contact */}
              <div className="flex items-center gap-8">
                {phoneNumber && (
                  <a
                    href={`tel:${phoneNumber}`}
                    className="modern-nav transition-colors duration-300 text-white/70 hover:text-[var(--modern-gold)]"
                  >
                    {phoneNumber}
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="modern-nav transition-colors duration-300 text-white/70 hover:text-[var(--modern-gold)]"
                  >
                    {email}
                  </a>
                )}
              </div>

              {/* Right - Secondary links */}
              <div className="flex items-center gap-6">
                <Link
                  href="/contact-us"
                  className="modern-nav transition-colors duration-300 text-white/70 hover:text-[var(--modern-gold)]"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Navigation */}
            <nav className="hidden lg:flex items-center gap-10" ref={dropdownRef}>
              {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => (item.hasMegaMenu || item.simpleDropdown) && handleDropdownEnter(index)}
                  onMouseLeave={handleDropdownLeave}
                >
                  {item.url && !item.hasMegaMenu && !item.simpleDropdown ? (
                    <Link
                      href={item.url}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="modern-nav py-2 transition-colors duration-300 text-white hover:text-[var(--modern-gold)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className="modern-nav py-2 flex items-center gap-1.5 transition-colors duration-300 text-white hover:text-[var(--modern-gold)]"
                    >
                      {item.label}
                      <svg
                        className={`w-3 h-3 transition-transform duration-300 ${
                          activeDropdown === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {(item.hasMegaMenu || item.simpleDropdown) && activeDropdown === index && (
                    <div className="absolute top-full left-0 pt-2">
                      <div className="bg-white shadow-2xl min-w-[280px]">
                        {item.simpleDropdown && (
                          <div className="py-4">
                            {item.simpleDropdown.map((link, linkIndex) => (
                              <Link
                                key={linkIndex}
                                href={link.url}
                                target={link.openInNewTab ? '_blank' : undefined}
                                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                className="block px-6 py-3 text-[var(--modern-gray)] hover:text-[var(--modern-black)] hover:bg-[var(--modern-gray-bg)] modern-nav transition-colors duration-200"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        )}
                        {item.hasMegaMenu && item.megaMenuColumns && (
                          <div className="p-8 grid grid-cols-3 gap-8 min-w-[600px]">
                            {item.megaMenuColumns.map((column, colIndex) => (
                              <div key={colIndex}>
                                {column.title && (
                                  <div className="mb-4">
                                    {column.titleUrl ? (
                                      <Link
                                        href={column.titleUrl}
                                        className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--modern-black)] hover:text-[var(--modern-gold)] transition-colors"
                                      >
                                        {column.title}
                                      </Link>
                                    ) : (
                                      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--modern-black)]">
                                        {column.title}
                                      </span>
                                    )}
                                    <div className="modern-divider mt-2" />
                                  </div>
                                )}
                                {column.links?.map((link, linkIndex) => (
                                  <Link
                                    key={linkIndex}
                                    href={link.url}
                                    target={link.openInNewTab ? '_blank' : undefined}
                                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                    className="block py-2 text-sm text-[var(--modern-gray)] hover:text-[var(--modern-black)] transition-colors duration-200"
                                  >
                                    {link.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Center Logo */}
            <Link href="/" className="flex-shrink-0">
              {logo?.asset ? (
                <Image
                  src={urlFor(logo).width(200).url()}
                  alt={logoAlt}
                  width={160}
                  height={50}
                  className="h-12 w-auto object-contain transition-all duration-500 brightness-0 invert"
                  priority
                />
              ) : (
                <span
                  className="text-2xl font-light tracking-[0.15em] uppercase transition-colors duration-500 text-white"
                >
                  {siteTitle}
                </span>
              )}
            </Link>

            {/* Right Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {navItems.slice(Math.ceil(navItems.length / 2)).map((item, index) => {
                const actualIndex = index + Math.ceil(navItems.length / 2);
                return (
                  <div
                    key={actualIndex}
                    className="relative"
                    onMouseEnter={() => (item.hasMegaMenu || item.simpleDropdown) && handleDropdownEnter(actualIndex)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {item.url && !item.hasMegaMenu && !item.simpleDropdown ? (
                      <Link
                        href={item.url}
                        target={item.openInNewTab ? '_blank' : undefined}
                        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="modern-nav py-2 transition-colors duration-300 text-white hover:text-[var(--modern-gold)]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        className="modern-nav py-2 flex items-center gap-1.5 transition-colors duration-300 text-white hover:text-[var(--modern-gold)]"
                      >
                        {item.label}
                        <svg
                          className={`w-3 h-3 transition-transform duration-300 ${
                            activeDropdown === actualIndex ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {(item.hasMegaMenu || item.simpleDropdown) && activeDropdown === actualIndex && (
                      <div className="absolute top-full right-0 pt-2">
                        <div className="bg-white shadow-2xl min-w-[280px]">
                          {item.simpleDropdown && (
                            <div className="py-4">
                              {item.simpleDropdown.map((link, linkIndex) => (
                                <Link
                                  key={linkIndex}
                                  href={link.url}
                                  target={link.openInNewTab ? '_blank' : undefined}
                                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                  className="block px-6 py-3 text-[var(--modern-gray)] hover:text-[var(--modern-black)] hover:bg-[var(--modern-gray-bg)] modern-nav transition-colors duration-200"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 transition-colors duration-300 text-white"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--modern-black)] lg:hidden overflow-y-auto">
          <div className="min-h-screen px-6 py-24">
            <nav className="space-y-1">
              {navItems.map((item, index) => (
                <div key={index}>
                  {item.url && !item.hasMegaMenu && !item.simpleDropdown ? (
                    <Link
                      href={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-4 text-white text-lg font-light tracking-[0.1em] uppercase border-b border-white/10"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleMobileDropdown(index)}
                        className="w-full flex items-center justify-between py-4 text-white text-lg font-light tracking-[0.1em] uppercase border-b border-white/10"
                      >
                        {item.label}
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            activeMobileDropdown === index ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {activeMobileDropdown === index && (
                        <div className="py-4 pl-4 space-y-3">
                          {item.simpleDropdown?.map((link, linkIndex) => (
                            <Link
                              key={linkIndex}
                              href={link.url}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-white/70 text-sm font-light tracking-[0.1em] uppercase hover:text-white transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                          {item.megaMenuColumns?.map((column, colIndex) =>
                            column.links?.map((link, linkIndex) => (
                              <Link
                                key={`${colIndex}-${linkIndex}`}
                                href={link.url}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-white/70 text-sm font-light tracking-[0.1em] uppercase hover:text-white transition-colors"
                              >
                                {link.label}
                              </Link>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Contact */}
            <div className="mt-12 pt-8 border-t border-white/10">
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="block text-white/70 text-sm tracking-[0.1em] uppercase mb-4 hover:text-white transition-colors"
                >
                  {phoneNumber}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="block text-white/70 text-sm tracking-[0.1em] uppercase hover:text-white transition-colors"
                >
                  {email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Spacer */}
      <div className="h-[120px] lg:h-[120px]" />
    </>
  );
}
