'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { formatPhone, phoneHref } from '@/lib/phoneUtils';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface FooterLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

interface FooterColumn {
  title?: string;
  links?: FooterLink[];
}

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

interface FooterSettings {
  portraitImage?: any;
  taglineImage?: any;
  brokerageLogo?: any;
}

interface ModernFooterProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  description?: string;
  columns?: FooterColumn[];
  socialMedia?: SocialMedia;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  footer?: FooterSettings;
}

const DEFAULT_BROKERAGE_LOGO = 'https://drupal-storage.s3.amazonaws.com/klug/public/2024-11/assir-logo%402x.png';

export default function ModernFooter({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Chris Klug Properties',
  columns = [],
  socialMedia,
  contactInfo,
  footer,
}: ModernFooterProps) {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const brokerageLogoUrl = footer?.brokerageLogo
    ? urlFor(footer.brokerageLogo).width(400).url()
    : DEFAULT_BROKERAGE_LOGO;

  const logoUrl = logo ? urlFor(logo).width(300).url() : null;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  const defaultLinks: FooterLink[] = [
    { label: 'Home', url: '/' },
    { label: 'Properties', url: '/listings' },
    { label: 'About', url: '/about' },
    { label: 'Market Reports', url: '/market-reports' },
    { label: 'Communities', url: '/communities' },
    { label: 'Contact', url: '/contact' },
  ];

  const footerLinks = columns.length > 0 ? columns[0]?.links || defaultLinks : defaultLinks;

  return (
    <footer className="bg-[var(--modern-black)] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            {logoUrl ? (
              <Link href="/" className="inline-block mb-6">
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={180}
                  height={50}
                  className="brightness-0 invert opacity-90"
                />
              </Link>
            ) : (
              <Link href="/" className="inline-block mb-6">
                <span className="text-xl font-light tracking-wide">{siteTitle}</span>
              </Link>
            )}
            {contactInfo?.address && (
              <p className="text-white/40 text-sm font-light leading-relaxed mb-4">
                {contactInfo.address}
              </p>
            )}
            {contactInfo?.phone && (
              <a
                href={`tel:${phoneHref(contactInfo.phone)}`}
                className="block text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors mb-1"
              >
                {formatPhone(contactInfo.phone)}
              </a>
            )}
            {contactInfo?.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="block text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors"
              >
                {contactInfo.email}
              </a>
            )}
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              Navigate
            </h4>
            <ul className="space-y-3">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">
              Stay Informed
            </h4>
            <p className="text-white/40 text-sm font-light mb-5">
              Receive exclusive property updates and market insights.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 text-white text-sm font-light py-2 placeholder-white/30 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
              />
              <button
                type="submit"
                className="text-xs uppercase tracking-[0.2em] text-[var(--modern-gold)] hover:text-white transition-colors duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Social + Brokerage Row */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Social Icons */}
          <div className="flex items-center gap-5">
            {socialMedia?.facebook && (
              <a
                href={socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[var(--modern-gold)] transition-colors duration-300"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 320 512">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
            )}
            {socialMedia?.instagram && (
              <a
                href={socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[var(--modern-gold)] transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
              </a>
            )}
            {socialMedia?.twitter && (
              <a
                href={socialMedia.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[var(--modern-gold)] transition-colors duration-300"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
                </svg>
              </a>
            )}
            {socialMedia?.youtube && (
              <a
                href={socialMedia.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[var(--modern-gold)] transition-colors duration-300"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 576 512">
                  <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                </svg>
              </a>
            )}
            {socialMedia?.linkedin && (
              <a
                href={socialMedia.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[var(--modern-gold)] transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
                </svg>
              </a>
            )}
          </div>

          {/* Brokerage Logo */}
          <div>
            <Image
              src={brokerageLogoUrl}
              alt="Aspen Snowmass Sotheby's International Realty"
              width={180}
              height={50}
              className="brightness-0 invert opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          {/* Legal Disclaimer */}
          <p className="text-white/20 text-[9px] leading-relaxed mb-4">
            &copy; {currentYear} Sotheby&apos;s International Realty Affiliates LLC. All rights reserved. Sotheby&apos;s International Realty&reg; and the Sotheby&apos;s International Realty Logo are service marks licensed to Sotheby&apos;s International Realty Affiliates LLC and used with permission. Each office is independently owned and operated.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-white/20 text-[10px]">
              &copy; {currentYear} {siteTitle}. All rights reserved.
            </p>
            <p className="text-white/20 text-[10px]">
              Design by{' '}
              <a
                href="https://www.organicreturn.com/"
                className="hover:text-[var(--modern-gold)] transition-colors duration-300"
              >
                Organic Return
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
