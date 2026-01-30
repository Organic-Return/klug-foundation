'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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

interface FooterSettings {
  portraitImage?: any;
  taglineImage?: any;
  brokerageLogo?: any;
}

interface FooterProps {
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
  copyrightText?: string;
  footer?: FooterSettings;
}

// Default image URLs (used as fallbacks)
const DEFAULT_PORTRAIT = 'https://drupal-storage.s3.amazonaws.com/klug/public/2024-11/chris-portrait.jpg';
const DEFAULT_TAGLINE = 'https://drupal-storage.s3.amazonaws.com/klug/public/2024-11/footer-tagline%402x_20220524164420_0.png';
const DEFAULT_BROKERAGE_LOGO = 'https://drupal-storage.s3.amazonaws.com/klug/public/2024-11/assir-logo%402x.png';

export default function Footer({
  logo,
  logoAlt = 'Logo',
  siteTitle = 'Chris Klug Properties',
  description,
  columns = [],
  socialMedia,
  contactInfo,
  copyrightText,
  footer,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  // Get image URLs from Sanity or use defaults
  const portraitUrl = footer?.portraitImage
    ? urlFor(footer.portraitImage).width(400).url()
    : DEFAULT_PORTRAIT;
  const taglineUrl = footer?.taglineImage
    ? urlFor(footer.taglineImage).width(800).url()
    : DEFAULT_TAGLINE;
  const brokerageLogoUrl = footer?.brokerageLogo
    ? urlFor(footer.brokerageLogo).width(400).url()
    : DEFAULT_BROKERAGE_LOGO;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  // Default links if none provided
  const defaultLinks: FooterLink[] = [
    { label: 'Home', url: '/' },
    { label: 'Featured Properties', url: '/listings' },
    { label: 'About Klug Properties', url: '/about' },
    { label: 'Blog', url: '/blog' },
    { label: 'Living Aspen', url: '/media/living-aspen-magazine' },
    { label: 'Market Reports', url: '/market-reports' },
  ];

  const footerLinks = columns.length > 0 ? columns[0]?.links || defaultLinks : defaultLinks;

  return (
    <footer className="relative flex flex-col items-center w-full">
      {/* Top Section - Sotheby's Blue Background with Portrait and Tagline */}
      <div className="flex flex-col w-full relative mt-14">
        <div className="relative bg-[#00254a] max-w-none w-full flex flex-col items-center p-0">
          <div className="flex flex-wrap xl:flex-nowrap w-full mx-0 px-6 pb-6 md:px-0 md:py-10 md:max-w-xl xl:max-w-screen-xl justify-center items-center">
            {/* Chris Portrait */}
            <div className="lg:max-w-none md:w-4/12 xl:w-2/12 relative w-full m-0 flex flex-col justify-center items-center">
              <Image
                src={portraitUrl}
                alt="Chris Klug"
                width={184}
                height={237}
                className="w-[165px] -mt-6 md:mt-0 md:absolute"
              />
            </div>

            {/* Tagline Image */}
            <Link href="/" className="w-full md:w-8/12 xl:w-4/12 lg:max-w-none pb-0 xl:pl-10">
              <span className="sr-only">Homepage</span>
              <Image
                src={taglineUrl}
                alt={siteTitle}
                width={416}
                height={80}
                className="w-full"
              />
            </Link>

            {/* Social Icons */}
            <nav className="w-full xl:w-3/12 lg:max-w-none flex flex-wrap justify-center pt-4 md:pt-24 xl:pt-0 pb-2 text-4xl" aria-label="Social media">
                {(socialMedia?.facebook || true) && (
                  <a
                    className="p-3 text-white"
                    href={socialMedia?.facebook || 'https://www.facebook.com/KlugProperties'}
                    title="Chris Klug Properties on Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="1em" width="1em">
                      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
                    </svg>
                  </a>
                )}
                {(socialMedia?.instagram || true) && (
                  <a
                    className="p-3 text-white"
                    href={socialMedia?.instagram || 'https://www.instagram.com/klugproperties/'}
                    title="Chris Klug Properties on Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em">
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                    </svg>
                  </a>
                )}
                {(socialMedia?.twitter || true) && (
                  <a
                    className="p-3 text-white"
                    href={socialMedia?.twitter || 'https://twitter.com/klugproperties'}
                    title="Chris Klug Properties on Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
                      <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                    </svg>
                  </a>
                )}
                {(socialMedia?.youtube || true) && (
                  <a
                    className="p-3 text-white"
                    href={socialMedia?.youtube || 'https://www.youtube.com/user/klugproperties'}
                    title="Chris Klug Properties on YouTube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em">
                      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path>
                    </svg>
                  </a>
                )}
            </nav>

            {/* ASSIR Logo */}
            <div className="w-1/2 md:w-1/4 lg:w-auto xl:w-1/4 lg:max-w-none">
              <Image
                src={brokerageLogoUrl}
                alt="Aspen Snowmass Sotheby's International Realty"
                width={200}
                height={60}
                className="w-full max-w-[200px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Newsletter, Links, Terms */}
      <div className="flex flex-col items-center w-full max-w-screen-xl">
        <div className="flex flex-row flex-wrap justify-center w-full gap-y-6 py-14 px-4">
          {/* Newsletter Signup */}
          <div className="w-full lg:w-1/3 max-w-md px-4 lg:pr-7 lg:pl-0">
            <h3 className="text-3xl w-full border-b border-gray-300 mb-9 pb-3 font-light">
              Sign Up For Email Newsletter
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="bg-no-repeat bg-cover">
              <fieldset className="!p-0 border-0">
                <legend className="hidden">Contact</legend>
                <ul className="!my-0 list-none grid gap-4">
                  <li>
                    <label htmlFor="email" className="sr-only">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="EMAIL ADDRESS"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-0 border-b border-gray-400 placeholder-gray-500 leading-10 w-full rounded-none focus:border-[var(--color-gold)] focus:ring-0 outline-none"
                    />
                  </li>
                  <li className="text-center italic">
                    <button
                      type="submit"
                      className="max-w-sm border border-gray-400 px-3 capitalize cursor-pointer leading-10 w-full rounded-none hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                    >
                      Submit
                    </button>
                  </li>
                </ul>
              </fieldset>
            </form>
          </div>

          {/* Links */}
          <div className="w-full lg:w-1/3 max-w-md px-4 lg:px-7">
            <h3 className="text-3xl w-full border-b border-gray-300 mb-9 pb-3 font-light">
              Links
            </h3>
            <div className="text-sm mb-4 space-y-2">
              {footerLinks.map((link, index) => (
                <p key={index}>
                  <Link
                    href={link.url}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </p>
              ))}
            </div>
          </div>

          {/* Terms of Service */}
          <div className="w-full lg:w-1/3 max-w-md px-4 lg:pl-7 lg:pr-0">
            <h3 className="text-3xl w-full border-b border-gray-300 mb-9 pb-3 font-light">
              Terms Of Service
            </h3>
            <div className="flex flex-row flex-wrap justify-between gap-x-4 lg:mr-14">
              <dl>
                <dd className="text-sm mb-3">
                  <Link href="/privacy" className="hover:text-[var(--color-gold)] transition-colors">
                    Privacy Policy
                  </Link>
                </dd>
                <dd className="text-sm mb-3">
                  <Link href="/terms-of-service" className="hover:text-[var(--color-gold)] transition-colors">
                    Terms Of Service
                  </Link>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="w-full max-w-[1440px] mx-auto mt-9 border-t border-gray-200" />

      {/* Legal Disclaimer */}
      <div className="w-full py-9 px-4">
        <div className="max-w-[1440px] w-full mx-auto text-[8px] text-gray-600">
          <p style={{ maxWidth: 'none', fontSize: '8px', marginBottom: '0.5em' }}>
            © {currentYear} Sotheby&apos;s International Realty Affiliates LLC. All rights reserved. Sotheby&apos;s International Realty® and the Sotheby&apos;s International Realty Logo are service marks licensed to Sotheby&apos;s International Realty Affiliates LLC and used with permission. Sotheby&apos;s International Realty Affiliates LLC fully supports the principles of the Fair Housing Act and the Equal Opportunity Act. Each office is independently owned and operated.
          </p>
          <p style={{ maxWidth: 'none', fontSize: '8px', marginBottom: '0' }}>
            This website is not the official website of Sotheby&apos;s International Realty. Real estate agents affiliated with Sotheby&apos;s International Realty are independent contractors and are not employees of Sotheby&apos;s International Realty. The information set forth on this site is based upon information which we consider reliable, but because it has been supplied by third parties to our franchisees (who in turn supplied it to us), we can not represent that it is accurate or complete, and it should not be relied upon as such. The offerings are subject to errors, omissions, changes, including price, or withdrawal without notice. All dimensions are approximate and have not been verified by the selling party and can not be verified by Sotheby&apos;s International Realty Affiliates LLC. It is recommended that you hire a professional in the business of determining dimensions, such as an appraiser, architect or civil engineer, to determine such information.
          </p>
        </div>
      </div>

      {/* Attribution */}
      <div className="text-xs text-center pb-7 text-gray-500">
        Real estate website design, development and optimization by{' '}
        <a href="https://www.organicreturn.com/" className="font-bold hover:text-[var(--color-gold)] transition-colors">
          Organic Return
        </a>
      </div>
    </footer>
  );
}
