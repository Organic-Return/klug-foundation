'use client';

import { useState, useEffect, useRef } from 'react';
import { getUTMData } from './UTMCapture';
import { getRecaptchaToken } from '@/lib/recaptchaClient';

export default function ModernContactCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const recaptchaToken = await getRecaptchaToken('submit_lead');
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recaptchaToken,
          ...formState,
          source: 'Homepage Contact Form',
          ...getUTMData(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
      setFormState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Column - Text */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="inline-block text-[var(--modern-gold)] text-xs uppercase tracking-[0.3em] mb-4">
              Get in Touch
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] mb-6">
              Let&apos;s Start a Conversation
            </h2>
            <p className="text-[var(--modern-gray)] text-base md:text-lg font-light leading-relaxed mb-8">
              Whether you&apos;re looking to buy, sell, or simply explore the market,
              we&apos;re here to provide the guidance and expertise you deserve.
              Reach out and let us help you find your next chapter.
            </p>
            <div className="w-16 h-[1px] bg-[var(--modern-gold)]" />
          </div>

          {/* Right Column - Form */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 border border-[var(--modern-gold)] flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[var(--modern-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light text-[var(--modern-black)] mb-3">
                  Thank You
                </h3>
                <p className="text-[var(--modern-gray)] font-light">
                  We&apos;ve received your message and will be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cta-firstName" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      First Name *
                    </label>
                    <input
                      id="cta-firstName"
                      type="text"
                      required
                      value={formState.firstName}
                      onChange={(e) => setFormState(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-lastName" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Last Name *
                    </label>
                    <input
                      id="cta-lastName"
                      type="text"
                      required
                      value={formState.lastName}
                      onChange={(e) => setFormState(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cta-email" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Email *
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-phone" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Phone
                    </label>
                    <input
                      id="cta-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cta-message" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                    Message
                  </label>
                  <textarea
                    id="cta-message"
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm font-light">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-3 bg-[var(--modern-black)] text-white text-xs uppercase tracking-[0.2em] px-10 py-4 hover:bg-[var(--modern-gold)] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                  {!submitting && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
