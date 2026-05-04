'use client';

import { useState } from 'react';
import Link from 'next/link';
import ContactModal from '@/components/ContactModal';

interface CTASectionProps {
  title?: string | null;
  description?: string | null;
  buttonText?: string | null;
  buttonAction?: 'link' | 'contact_modal' | null;
  buttonLink?: string | null;
}

export default function CTASection(props: CTASectionProps) {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Default-parameter syntax only handles `undefined`. Sanity GROQ projects
  // unset fields as `null`, which previously slipped through and caused
  // `<Link href={null}>` to crash Next's format-url at prerender. Coerce
  // explicitly so the section is safe regardless of what Sanity returns.
  const title = props.title || 'Looking to Partner With Us?';
  const description = props.description
    || "We're always looking to connect with exceptional real estate professionals who share our commitment to excellence.";
  const buttonText = props.buttonText || 'Get in Touch';
  const buttonAction = props.buttonAction || 'link';
  const buttonLink = props.buttonLink || '/contact-us';

  return (
    <section className="py-20 md:py-28 bg-[var(--color-navy)]">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
          {title}
        </h2>
        <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
        {buttonAction === 'contact_modal' ? (
          <button
            onClick={() => setContactModalOpen(true)}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            {buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        ) : (
          <Link
            href={buttonLink}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            {buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </section>
  );
}
