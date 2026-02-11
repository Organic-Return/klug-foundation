'use client';

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

interface RCSothebysFooterProps {
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
  footer?: {
    portraitImage?: any;
    taglineImage?: any;
    brokerageLogo?: any;
  };
  cities?: string[];
}

// Fallback footer image from the live site
const FALLBACK_FOOTER_BG = 'https://drupal-storage.s3.amazonaws.com/retter/public/2024-12/footer-bg.jpg';

export default function RCSothebysFooter({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Real Estate',
  columns = [],
  socialMedia,
  contactInfo,
  footer,
  cities = [],
}: RCSothebysFooterProps) {
  const currentYear = new Date().getFullYear();

  const footerBgUrl = footer?.portraitImage
    ? urlFor(footer.portraitImage).width(1200).height(900).quality(85).url()
    : FALLBACK_FOOTER_BG;

  const brokerageLogoUrl = footer?.brokerageLogo
    ? urlFor(footer.brokerageLogo).width(200).url()
    : null;

  return (
    <footer className="bg-[var(--rc-navy)]">
      {/* Gold top border */}
      <div className="h-[3px] bg-[var(--rc-gold)]" />

      {/* ─── Main footer container ─── */}
      <div className="relative w-full mx-auto flex flex-row">
        {/* Left background image — absolute, spans full height on md+ */}
        <div
          className="hidden md:block md:absolute md:left-0 md:w-1/3 lg:w-1/2 md:h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${footerBgUrl})` }}
        />

        {/* Right content column — stacked sections */}
        <div className="relative w-full flex flex-col">
          {/* Mobile-only image */}
          <div className="md:hidden relative w-full h-[240px]">
            <Image
              src={footerBgUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          {/* ─── Link Columns Section ─── */}
          <div className="bg-[var(--rc-navy)] text-white md:self-end w-full md:w-2/3 lg:w-1/2 flex flex-col md:flex-row p-6 md:p-6 lg:p-10 xl:p-14">
            {columns.map((column, index) => (
              <dl key={index} className="md:mr-6 lg:mr-12 xl:mr-20 mb-6 md:mb-0">
                {column.title && (
                  <dt
                    className="uppercase tracking-widest leading-9 text-xl pr-5 pb-3.5 mb-5 border-b border-[var(--rc-gold)] font-bold"
                    style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', color: 'var(--rc-gold)' }}
                  >
                    {column.title}
                  </dt>
                )}
                {column.links?.map((link, linkIndex) => (
                  <dd key={linkIndex} className="mb-2">
                    <Link
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      className="text-sm leading-6 tracking-widest font-semibold text-white hover:text-white/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </dd>
                ))}
              </dl>
            ))}
          </div>

          {/* ─── City Ticker Bar — full width ─── */}
          {cities.length > 0 && (
            <div className="w-full bg-[var(--rc-cream)]">
              <ul className="list-none flex flex-row justify-center flex-wrap py-6 gap-y-2 uppercase px-4">
                {cities.map((city, index) => (
                  <li
                    key={index}
                    className={`px-2 ${index < cities.length - 1 ? 'border-r border-[var(--rc-navy)]/20' : ''}`}
                  >
                    <span
                      className="text-sm leading-6 tracking-widest font-semibold text-[var(--rc-navy)]"
                      style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                    >
                      {city}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── Social / Copyright / Brokerage Section ─── */}
          <div className="bg-[var(--rc-navy)] text-white md:self-end w-full md:w-2/3 lg:w-1/2 flex flex-col md:flex-row items-center p-6 lg:p-10 xl:p-14 gap-y-4 xl:gap-x-20">
            <div className="flex flex-col items-start">
              {/* Social icons */}
              {socialMedia && (
                <div className="flex flex-row flex-wrap mb-3">
                  {socialMedia.facebook && (
                    <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="p-3 text-white hover:text-[var(--rc-gold)] transition-colors" aria-label="Facebook">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
                    </a>
                  )}
                  {socialMedia.instagram && (
                    <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-3 text-white hover:text-[var(--rc-gold)] transition-colors" aria-label="Instagram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                    </a>
                  )}
                  {socialMedia.youtube && (
                    <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="p-3 text-white hover:text-[var(--rc-gold)] transition-colors" aria-label="YouTube">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
                    </a>
                  )}
                  {socialMedia.twitter && (
                    <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-3 text-white hover:text-[var(--rc-gold)] transition-colors" aria-label="Twitter">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    </a>
                  )}
                  {socialMedia.linkedin && (
                    <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 text-white hover:text-[var(--rc-gold)] transition-colors" aria-label="LinkedIn">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                </div>
              )}

              {/* Copyright */}
              <div className="md:w-56 xl:w-72 text-xs text-white/80">
                &copy; {currentYear} {siteTitle}. All rights reserved.
              </div>
            </div>

            {/* Brokerage logo */}
            {brokerageLogoUrl && (
              <a className="flex flex-row flex-nowrap items-center text-white hover:text-white/80 transition-colors mt-4 md:mt-0" href="https://www.organicreturn.com/" target="_blank" rel="noopener noreferrer">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src={brokerageLogoUrl}
                    alt="Organic Return"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="pl-2 w-48 text-xs">
                  Real Estate Website Design, Development and Optimization by Organic Return
                </span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Disclaimer ─── */}
      <div className="relative py-5 px-4 text-xs bg-[var(--rc-cream)] text-[var(--rc-brown)]">
        <div className="w-full mx-auto max-w-screen-2xl pb-1">
          &copy; {currentYear} {siteTitle}. All rights reserved.
        </div>
        <div className="w-full mx-auto max-w-screen-2xl pb-1 leading-relaxed mt-2">
          Sotheby&apos;s International Realty&reg; and the Sotheby&apos;s International Realty Logo are service marks licensed to Sotheby&apos;s International Realty Affiliates LLC and used with permission. Each franchise is independently owned and operated. Any services or products provided by independently owned and operated franchises are not provided by, affiliated with, or related to Sotheby&apos;s International Realty Affiliates LLC nor any of its affiliated companies.
        </div>
      </div>
    </footer>
  );
}
