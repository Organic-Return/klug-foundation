'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = imageUrlBuilder(client);

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

interface LuxuryStayConnectedProps {
  logo?: any;
  logoAlt?: string;
  siteTitle?: string;
  columns?: FooterColumn[];
  socialMedia?: SocialMedia;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export default function LuxuryStayConnected({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Chris Klug Properties',
  columns = [],
  socialMedia,
  contactInfo,
}: LuxuryStayConnectedProps) {
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();

  const toggleColumn = (index: number) => {
    setOpenColumn(openColumn === index ? null : index);
  };

  return (
    <section className="bg-white">
      {/* Top: Logo */}
      <div className="flex flex-col items-center pt-16 pb-10 px-6">
        {logo?.asset?.url ? (
          <Link href="/" className="block">
            <div className="relative h-16 w-48 sm:h-20 sm:w-60">
              <Image
                src={urlFor(logo).width(500).url()}
                alt={logoAlt}
                fill
                className="object-contain"
              />
            </div>
          </Link>
        ) : (
          <Link href="/" className="text-lg tracking-[0.3em] uppercase font-light font-luxury text-[var(--color-charcoal)]">
            {siteTitle}
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6">
        <hr className="border-[var(--color-taupe)]/40" />
      </div>

      {/* Stay Connected heading */}
      <div className="text-center py-8">
        <h3 className="text-xs tracking-[0.3em] uppercase font-light font-luxury text-[var(--color-charcoal)]">
          Stay Connected
        </h3>
      </div>

      {/* Link Columns */}
      <div className="mx-auto max-w-5xl px-6 pb-10">
        {/* Desktop: Grid of columns */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-8">
          {columns.map((column, index) => (
            <div key={index}>
              {column.title && (
                <h4 className="text-[11px] tracking-[0.2em] uppercase font-medium mb-4 font-luxury-body text-[var(--color-charcoal)]">
                  {column.title}
                </h4>
              )}
              <ul className="space-y-2.5">
                {column.links?.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          {contactInfo && (contactInfo.phone || contactInfo.email) && (
            <div>
              <h4 className="text-[11px] tracking-[0.2em] uppercase font-medium mb-4 font-luxury-body text-[var(--color-charcoal)]">
                Contact
              </h4>
              <ul className="space-y-2.5">
                {contactInfo.phone && (
                  <li>
                    <a
                      href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`}
                      className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                    >
                      {contactInfo.phone}
                    </a>
                  </li>
                )}
                {contactInfo.email && (
                  <li>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                    >
                      {contactInfo.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Mobile: Collapsible columns */}
        <div className="md:hidden divide-y divide-[var(--color-taupe)]/20">
          {columns.map((column, index) => (
            <div key={index}>
              <button
                onClick={() => toggleColumn(index)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-[11px] tracking-[0.2em] uppercase font-medium font-luxury-body text-[var(--color-charcoal)]">
                  {column.title || 'Links'}
                </span>
                <span className="text-[var(--color-warm-gray)] text-lg leading-none">
                  {openColumn === index ? '\u2212' : '+'}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openColumn === index ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
                }`}
              >
                <ul className="space-y-2.5 pl-1">
                  {column.links?.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.url}
                        target={link.openInNewTab ? '_blank' : undefined}
                        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Contact collapsible */}
          {contactInfo && (contactInfo.phone || contactInfo.email) && (
            <div>
              <button
                onClick={() => toggleColumn(columns.length)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-[11px] tracking-[0.2em] uppercase font-medium font-luxury-body text-[var(--color-charcoal)]">
                  Contact
                </span>
                <span className="text-[var(--color-warm-gray)] text-lg leading-none">
                  {openColumn === columns.length ? '\u2212' : '+'}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openColumn === columns.length ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
                }`}
              >
                <ul className="space-y-2.5 pl-1">
                  {contactInfo.phone && (
                    <li>
                      <a
                        href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`}
                        className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                      >
                        {contactInfo.phone}
                      </a>
                    </li>
                  )}
                  {contactInfo.email && (
                    <li>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-[var(--color-warm-gray)] text-sm font-light hover:text-[var(--color-charcoal)] transition-colors font-luxury-body"
                      >
                        {contactInfo.email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Media Icons */}
      {socialMedia && (
        <div className="flex justify-center items-center gap-6 pb-8">
          {socialMedia.facebook && (
            <a
              href={socialMedia.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 320 512">
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
              </svg>
            </a>
          )}
          {socialMedia.instagram && (
            <a
              href={socialMedia.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </a>
          )}
          {socialMedia.twitter && (
            <a
              href={socialMedia.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
              </svg>
            </a>
          )}
          {socialMedia.youtube && (
            <a
              href={socialMedia.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 576 512">
                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
              </svg>
            </a>
          )}
          {socialMedia.linkedin && (
            <a
              href={socialMedia.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.83-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Copyright */}
      <div className="text-center pb-8 px-6">
        <p className="text-[var(--color-warm-gray)]/50 text-xs font-light font-luxury-body">
          &copy; {currentYear} {siteTitle}. All Rights Reserved.
        </p>
      </div>
    </section>
  );
}
