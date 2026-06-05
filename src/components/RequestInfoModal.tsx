'use client';

import { useState, useEffect } from 'react';
import { getUTMData } from './UTMCapture';
import { trackLeadSubmitted } from '@/lib/tracking';

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress: string;
  propertyMlsId?: string;
  propertyPrice?: number;
}

export default function RequestInfoModal({
  isOpen,
  onClose,
  propertyAddress,
  propertyMlsId,
  propertyPrice,
}: RequestInfoModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const utm = getUTMData();
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          message: message || undefined,
          leadType: 'property_inquiry',
          inquiryType,
          propertyAddress,
          propertyMlsId,
          propertyPrice,
          source: 'Property Detail Page',
          sourceUrl: utm.source_url,
          referrer: utm.referrer,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          utmContent: utm.utm_content,
          utmTerm: utm.utm_term,
          gclid: utm.gclid,
          fbclid: utm.fbclid,
          msclkid: utm.msclkid,
          landingPage: utm.landing_page,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send request');
      }

      trackLeadSubmitted({
        leadType: 'property_inquiry',
        inquiryType,
        propertyMlsId,
        propertyAddress,
        propertyPrice,
        email,
        phone: phone || undefined,
      });
      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setInquiryType('general');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        <div className="sticky top-0 bg-[var(--color-sothebys-blue)] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-light text-white">Request Information</h2>
            <p className="text-white/70 text-sm mt-1 truncate max-w-md">{propertyAddress}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-600 text-sm">An agent will respond within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-3 uppercase tracking-wider">I&apos;m interested in</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'general', label: 'General Info' },
                  { value: 'pricing', label: 'Pricing Details' },
                  { value: 'financing', label: 'Financing Options' },
                  { value: 'neighborhood', label: 'Neighborhood' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInquiryType(option.value)}
                    className={`py-3 px-4 border text-sm transition-all duration-300 ${
                      inquiryType === option.value
                        ? 'border-[var(--color-sothebys-blue)] bg-[var(--color-sothebys-blue)] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reqFirstName" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">First Name</label>
                  <input type="text" id="reqFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors" />
                </div>
                <div>
                  <label htmlFor="reqLastName" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">Last Name</label>
                  <input type="text" id="reqLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="reqEmail" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">Email</label>
                <input type="email" id="reqEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors" />
              </div>
              <div>
                <label htmlFor="reqPhone" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">Phone</label>
                <input type="tel" id="reqPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors" />
              </div>
              <div>
                <label htmlFor="reqMessage" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">Message</label>
                <textarea id="reqMessage" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`I'd like more information about ${propertyAddress}...`} rows={4} className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors resize-none" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={!firstName || !lastName || !email || submitting} className="w-full inline-flex items-center justify-center gap-3 py-4 bg-[var(--color-sothebys-blue)] text-white hover:bg-[#001a38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light">
                {submitting ? 'Sending...' : 'Send Request'}
                {!submitting && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">An agent will respond to your inquiry within 24 hours</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
