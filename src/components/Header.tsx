'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';
import ContactModal from './ContactModal';

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

// Available cities from MLS configuration
const LOCATIONS = [
  'Aspen',
  'Basalt',
  'Carbondale',
  'El Jebel',
  'Glenwood Springs',
  'Marble',
  'Meredith',
  'New Castle',
  'Parachute',
  'Redstone',
  'Rifle',
  'Silt',
  'Snowmass',
  'Snowmass Village',
  'Thomasville',
  'Woody Creek',
];

// Property types
const PROPERTY_TYPES = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Condominium', label: 'Condo' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'RES Vacant Land', label: 'Land' },
  { value: 'Commercial Sale', label: 'Commercial' },
];

// Price ranges
const PRICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '500000', label: '$500K' },
  { value: '750000', label: '$750K' },
  { value: '1000000', label: '$1M' },
  { value: '1500000', label: '$1.5M' },
  { value: '2000000', label: '$2M' },
  { value: '3000000', label: '$3M' },
  { value: '5000000', label: '$5M' },
  { value: '7500000', label: '$7.5M' },
  { value: '10000000', label: '$10M' },
  { value: '15000000', label: '$15M' },
  { value: '20000000', label: '$20M+' },
];

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

interface AgentInfo {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  headshot?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
}

interface HeaderProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  navItems?: NavItem[];
  forceBackground?: boolean;
  agent?: AgentInfo;
}

export default function Header({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  navItems = [],
  forceBackground = false,
  agent,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [keyword, setKeyword] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Check if on certain pages to force blue background
  const isPartnersPage = pathname?.startsWith('/affiliated-partners');
  const isMarketReportsPage = pathname?.startsWith('/market-reports');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('city', location);
    if (propertyType) params.append('type', propertyType);
    if (priceMin) params.append('minPrice', priceMin);
    if (priceMax) params.append('maxPrice', priceMax);
    if (keyword.trim()) params.append('q', keyword.trim());
    router.push(`/listings?${params.toString()}`);
    setSearchOpen(false);
  };

  const resetSearch = () => {
    setLocation('');
    setPropertyType('');
    setPriceMin('');
    setPriceMax('');
    setKeyword('');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || forceBackground || isPartnersPage || isMarketReportsPage
          ? 'bg-[var(--color-sothebys-blue)] shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {logo?.asset?.url ? (
              <div className="relative h-12 sm:h-16 md:h-20 lg:h-27 w-[10rem] sm:w-[14rem] md:w-[18rem] lg:w-[22.5rem]">
                <Image
                  src={urlFor(logo).width(675).url()}
                  alt={logoAlt}
                  fill
                  className={`object-contain object-left transition-all duration-300 ${
                    isScrolled ? 'brightness-0 invert' : 'brightness-0 invert'
                  }`}
                  priority
                />
              </div>
            ) : (
              <span className={`text-base sm:text-lg md:text-xl font-serif font-semibold transition-colors duration-300 ${
                isScrolled ? 'text-white' : 'text-white drop-shadow-lg'
              }`}>
                {siteTitle}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const hasDropdown = item.hasMegaMenu || (item.simpleDropdown && item.simpleDropdown.length > 0);

              return (
              <div
                key={index}
                className="relative nav-dropdown-container"
              >
                {item.url && !hasDropdown ? (
                  <Link
                    href={item.url}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="relative px-4 py-2 text-[16px] font-medium uppercase tracking-[0.15em] text-white group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleDropdown(index)}
                    className="relative px-4 py-2 text-[16px] font-medium uppercase tracking-[0.15em] text-white group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </button>
                )}

                {/* Mega Menu Dropdown */}
                {item.hasMegaMenu && item.megaMenuColumns && activeDropdown === index && (() => {
                  const isSkiTown = item.label.toLowerCase().includes('ski town') || item.label.toLowerCase().includes('affiliated');
                  return (
                  <div className="fixed left-1/2 -translate-x-1/2 top-20 pt-2 w-screen max-w-4xl px-4">
                    <div className={`shadow-2xl p-8 border relative ${isSkiTown ? 'bg-[#00254a] border-[#00254a]' : 'bg-white border-gray-100'}`}>
                      <button
                        onClick={() => setActiveDropdown(null)}
                        className={`absolute top-4 right-4 p-1 transition-colors ${isSkiTown ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        aria-label="Close menu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className={`grid gap-8 ${item.megaMenuColumns.length === 4 ? 'grid-cols-4' : item.megaMenuColumns.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {item.megaMenuColumns.map((column, colIndex) => (
                          <div key={colIndex}>
                            {column.title && (
                              column.titleUrl ? (
                                <Link
                                  href={column.titleUrl}
                                  className="block mb-2 group"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  <h3 className={`relative inline-block ${isSkiTown ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(1.5rem, 3vw, 1.5rem)', fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                                    {column.title}
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-gold)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                  </h3>
                                </Link>
                              ) : (
                                <h3 className={`mb-2 ${isSkiTown ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(1.5rem, 3vw, 1.5rem)', fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                                  {column.title}
                                </h3>
                              )
                            )}
                            {column.subtitle && (
                              <p className={`text-sm mb-4 font-light ${isSkiTown ? 'text-white/70' : 'text-gray-500'}`}>
                                {column.subtitle}
                              </p>
                            )}
                            {column.featuredImage && (
                              <div className="relative h-32 w-full mb-4 rounded-lg overflow-hidden">
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
                                    className="block group"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    <span className={`relative inline-block text-sm font-medium capitalize ${isSkiTown ? 'text-white/90' : 'text-gray-700'}`}>
                                      {link.label}
                                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-gold)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    </span>
                                    {link.description && (
                                      <div className={`text-xs mt-1 line-clamp-2 ${isSkiTown ? 'text-white/60' : 'text-gray-500'}`}>
                                        {link.description}
                                      </div>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Simple Dropdown */}
                {!item.hasMegaMenu && item.simpleDropdown && item.simpleDropdown.length > 0 && activeDropdown === index && (
                  <div className="fixed left-1/2 -translate-x-1/2 top-20 pt-2 w-64">
                    <div className="bg-white shadow-xl py-4 border border-gray-100 relative">
                      <button
                        onClick={() => setActiveDropdown(null)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close menu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {item.simpleDropdown.map((link, linkIndex) => (
                        <Link
                          key={linkIndex}
                          href={link.url}
                          target={link.openInNewTab ? '_blank' : undefined}
                          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </nav>

          {/* Search & CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search Icon Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 transition-colors ${
                isScrolled
                  ? 'text-white hover:text-[var(--color-gold)]'
                  : 'text-white hover:text-[var(--color-gold)]'
              }`}
              aria-label="Toggle search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Contact CTA */}
            <button
              onClick={() => setContactModalOpen(true)}
              className="text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-5 py-2.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
            >
              Contact Us
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 transition-colors ${
              isScrolled
                ? 'text-white hover:text-[var(--color-gold)]'
                : 'text-white hover:text-white/80'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {navItems.map((item, index) => (
              <div key={index}>
                {item.url && !item.hasMegaMenu && !item.simpleDropdown ? (
                  <Link
                    href={item.url}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg uppercase tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleMobileDropdown(index)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg uppercase tracking-wider"
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeMobileDropdown === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {activeMobileDropdown === index && (
                      <div className="ml-4 mt-2 space-y-2">
                        {item.hasMegaMenu && item.megaMenuColumns?.map((column, colIndex) => (
                          <div key={colIndex} className="mb-4">
                            {column.title && (
                              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {column.title}
                              </div>
                            )}
                            {column.links?.map((link, linkIndex) => (
                              <Link
                                key={linkIndex}
                                href={link.url}
                                target={link.openInNewTab ? '_blank' : undefined}
                                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        ))}

                        {!item.hasMegaMenu && item.simpleDropdown?.map((link, linkIndex) => (
                          <Link
                            key={linkIndex}
                            href={link.url}
                            target={link.openInNewTab ? '_blank' : undefined}
                            rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile CTA */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setContactModalOpen(true);
              }}
              className="block w-full text-center text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-5 py-3 border border-[var(--color-gold)] hover:bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a] mt-4"
            >
              Contact Us
            </button>
          </nav>
        </div>
      )}

      {/* Search Panel - Slides down from header */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-[var(--color-sothebys-blue)] shadow-xl border-t border-gray-800 z-40">
          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6">
            <form onSubmit={handleSearch} className="flex flex-wrap items-end justify-center gap-4 lg:gap-0">
              {/* Location Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-40">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-600 text-white py-2 px-0 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '1.25rem',
                    paddingRight: '1.5rem'
                  }}
                >
                  <option value="" className="bg-[var(--color-sothebys-blue)]">All Locations</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} className="bg-[var(--color-sothebys-blue)]">{loc}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-gray-700 mx-6" />

              {/* Type Dropdown */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-36">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-600 text-white py-2 px-0 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '1.25rem',
                    paddingRight: '1.5rem'
                  }}
                >
                  <option value="" className="bg-[var(--color-sothebys-blue)]">All Types</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value} className="bg-[var(--color-sothebys-blue)]">{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-gray-700 mx-6" />

              {/* Min Price Dropdown */}
              <div className="w-[calc(50%-0.5rem)] sm:w-auto sm:flex-1 lg:flex-none lg:w-28">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Min Price</label>
                <select
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-600 text-white py-2 px-0 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '1.25rem',
                    paddingRight: '1.5rem'
                  }}
                >
                  <option value="" className="bg-[var(--color-sothebys-blue)]">Any</option>
                  {PRICE_OPTIONS.slice(1).map((price) => (
                    <option key={`min-${price.value}`} value={price.value} className="bg-[var(--color-sothebys-blue)]">{price.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-gray-700 mx-6" />

              {/* Max Price Dropdown */}
              <div className="w-[calc(50%-0.5rem)] sm:w-auto sm:flex-1 lg:flex-none lg:w-28">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Max Price</label>
                <select
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-600 text-white py-2 px-0 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '1.25rem',
                    paddingRight: '1.5rem'
                  }}
                >
                  <option value="" className="bg-[var(--color-sothebys-blue)]">Any</option>
                  {PRICE_OPTIONS.slice(1).map((price) => (
                    <option key={`max-${price.value}`} value={price.value} className="bg-[var(--color-sothebys-blue)]">{price.label}</option>
                  ))}
                </select>
              </div>

              {/* Divider - Desktop */}
              <div className="hidden lg:block w-px h-8 bg-gray-700 mx-6" />

              {/* MLS# / Keyword Input */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-44">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">MLS# / Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword..."
                  className="w-full bg-transparent border-0 border-b border-gray-600 text-white py-2 px-0 text-sm font-light tracking-wide focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors placeholder:text-gray-500"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="ml-6 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-8 py-2.5 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
              >
                SEARCH
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  resetSearch();
                }}
                className="ml-2 p-2.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Close search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        agent={agent}
      />
    </header>
  );
}
