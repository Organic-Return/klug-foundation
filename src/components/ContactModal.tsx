'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentInfo;
}

export default function ContactModal({ isOpen, onClose, agent }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    privacyConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          privacyConsent: false,
        });
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2">
          {/* Agent Info Section */}
          <div className="bg-[var(--color-sothebys-blue)] text-white p-8 md:p-12">
            <h2 className="text-2xl font-serif font-light mb-6 tracking-wide">Get In Touch</h2>

            {agent?.headshot && (
              <div className="relative w-32 h-32 mb-6 overflow-hidden">
                <Image
                  src={agent.headshot}
                  alt={agent.name || 'Agent'}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {agent?.name && (
              <h3 className="text-xl font-light mb-1">{agent.name}</h3>
            )}
            {agent?.title && (
              <p className="text-white/70 text-sm mb-6">{agent.title}</p>
            )}

            <div className="space-y-4 mb-8">
              {agent?.phone && (
                <a
                  href={`tel:${agent.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm tracking-wide">{agent.phone}</span>
                </a>
              )}
              {agent?.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm tracking-wide">{agent.email}</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {agent?.instagram && (
                <a
                  href={agent.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {agent?.facebook && (
                <a
                  href={agent.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {agent?.linkedin && (
                <a
                  href={agent.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {agent?.youtube && (
                <a
                  href={agent.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
            </div>

            {/* Office Hours */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Office Hours</p>
              <p className="text-sm text-white/80">Monday - Friday: 9AM - 6PM</p>
              <p className="text-sm text-white/80">Saturday: 10AM - 4PM</p>
              <p className="text-sm text-white/80">Sunday: By Appointment</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-serif font-light text-[var(--color-sothebys-blue)] mb-2">
              Send a Message
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Fill out the form below and we&apos;ll get back to you shortly.
            </p>

            {submitStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif text-[var(--color-sothebys-blue)] mb-2">Message Sent!</h3>
                <p className="text-gray-500">We&apos;ll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border-0 border-b border-gray-300 py-2 px-0 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full border-0 border-b border-gray-300 py-2 px-0 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border-0 border-b border-gray-300 py-2 px-0 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full border-0 border-b border-gray-300 py-2 px-0 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    name="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-4 h-4 border-gray-300 rounded text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
                  />
                  <label htmlFor="privacyConsent" className="text-xs text-gray-500 leading-relaxed">
                    I agree to the{' '}
                    <a href="/privacy-policy" className="text-[var(--color-sothebys-blue)] hover:underline">
                      Privacy Policy
                    </a>{' '}
                    and consent to being contacted regarding my inquiry. I understand my information will be handled in accordance with applicable data protection laws. <span className="text-red-500">*</span>
                  </label>
                </div>

                {submitStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    There was an error sending your message. Please try again or contact us directly.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-8 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:text-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
