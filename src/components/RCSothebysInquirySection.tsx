'use client';

import { useState } from 'react';
import Image from 'next/image';

interface RCSothebysInquirySectionProps {
  title?: string;
  subtitle?: string;
  bodyText?: string;
  logoUrl?: string;
  logoAlt?: string;
}

export default function RCSothebysInquirySection({
  title = 'Get In Touch',
  subtitle = 'We would love to hear from you',
  bodyText = 'Whether you are looking to buy, sell, or simply have questions about the real estate market, our team is here to help. Reach out to us and one of our experienced agents will get back to you promptly.',
  logoUrl,
  logoAlt = 'Logo',
}: RCSothebysInquirySectionProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          interest: 'General inquiry from homepage',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full bg-transparent text-[var(--rc-navy)] text-sm py-3 border-0 border-b border-[var(--rc-brown)]/30 focus:border-[var(--rc-gold)] focus:ring-0 outline-none placeholder:text-[var(--rc-brown)]/50 placeholder:text-sm';

  return (
    <section className="bg-[var(--rc-cream)]">
      {/* Logo bar */}
      {logoUrl && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 pt-12 pb-8">
          <div className="relative h-10 sm:h-12 w-[10rem] sm:w-[14rem]">
            <Image
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-contain object-left"
            />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 pb-16 md:pb-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left column — text content */}
          <div className="w-full lg:w-1/2">
            <h2
              className="text-[var(--rc-navy)] text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] mb-4"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
            >
              {title}
            </h2>

            {/* Gold divider */}
            <div className="w-full max-w-[500px] h-[2px] bg-[var(--rc-gold)] mb-8" />

            {subtitle && (
              <h3
                className="text-[var(--rc-navy)] text-lg md:text-xl font-bold mb-6"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                {subtitle}
              </h3>
            )}

            {bodyText && (
              <p className="text-[var(--rc-brown)] text-base font-normal leading-[1.85]">
                {bodyText}
              </p>
            )}
          </div>

          {/* Right column — inquiry form */}
          <div className="w-full lg:w-1/2">
            <h3
              className="text-[var(--rc-navy)] text-lg md:text-xl font-bold uppercase tracking-[0.15em] mb-8"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
            >
              Inquire
            </h3>

            {submitStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--rc-navy)]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--rc-navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[var(--rc-navy)] text-lg font-medium mb-2">Thank you for your inquiry</p>
                <p className="text-[var(--rc-brown)] text-sm">We will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First / Last name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                    className={inputClassName}
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className={inputClassName}
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                  className={inputClassName}
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  className={inputClassName}
                />

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Message..."
                  rows={1}
                  className={inputClassName + ' resize-none'}
                />

                {submitStatus === 'error' && (
                  <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--rc-gold)] text-white px-8 py-4 border border-[var(--rc-gold)] hover:bg-transparent hover:border-[var(--rc-navy)] hover:text-[var(--rc-navy)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit'}
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
