'use client';

import { useState } from 'react';
import { getUTMData } from './UTMCapture';

interface ListingContactFormProps {
  propertyAddress: string;
  propertyMlsId?: string;
  propertyPrice?: number;
  template?: string;
}

export default function ListingContactForm({
  propertyAddress,
  propertyMlsId,
  propertyPrice,
  template,
}: ListingContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isCustomOne = template === 'custom-one';
  const shortAddress = propertyAddress?.split(',')[0] || propertyAddress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;
    setSubmitting(true);
    setError('');

    try {
      const utm = getUTMData();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          message: message || undefined,
          leadType: 'property_inquiry',
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isCustomOne ? 'bg-green-100' : 'bg-white/20'}`}>
          <svg className={`w-8 h-8 ${isCustomOne ? 'text-green-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className={`text-lg font-medium mb-2 ${isCustomOne ? 'text-gray-900' : 'text-white'}`}>Message Sent!</h3>
        <p className={`text-sm ${isCustomOne ? 'text-gray-600' : 'text-white/70'}`}>An agent will respond within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="lcfFirstName" className={`block text-sm mb-2 uppercase tracking-wider ${isCustomOne ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
            First Name
          </label>
          <input
            type="text"
            id="lcfFirstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={`w-full px-4 py-3 border focus:outline-none transition-colors ${isCustomOne ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
            placeholder="First Name"
          />
        </div>
        <div>
          <label htmlFor="lcfLastName" className={`block text-sm mb-2 uppercase tracking-wider ${isCustomOne ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
            Last Name
          </label>
          <input
            type="text"
            id="lcfLastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className={`w-full px-4 py-3 border focus:outline-none transition-colors ${isCustomOne ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
            placeholder="Last Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="lcfEmail" className={`block text-sm mb-2 uppercase tracking-wider ${isCustomOne ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
            Email
          </label>
          <input
            type="email"
            id="lcfEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-4 py-3 border focus:outline-none transition-colors ${isCustomOne ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
            placeholder="Email Address"
          />
        </div>
        <div>
          <label htmlFor="lcfPhone" className={`block text-sm mb-2 uppercase tracking-wider ${isCustomOne ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
            Phone
          </label>
          <input
            type="tel"
            id="lcfPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full px-4 py-3 border focus:outline-none transition-colors ${isCustomOne ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
            placeholder="Phone Number"
          />
        </div>
      </div>

      <div>
        <label htmlFor="lcfMessage" className={`block text-sm mb-2 uppercase tracking-wider ${isCustomOne ? 'text-[var(--modern-gray)]' : 'text-white/80'}`}>
          Message
        </label>
        <textarea
          id="lcfMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 border focus:outline-none transition-colors resize-none ${isCustomOne ? 'bg-[#f8f7f5] border-[var(--modern-black)]/10 text-[var(--modern-black)] placeholder-[var(--modern-gray)] focus:border-[var(--modern-gold)]' : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50'}`}
          placeholder={`I'm interested in learning more about ${shortAddress}...`}
        />
      </div>

      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={submitting || !firstName || !lastName || !email}
          className={`inline-flex items-center gap-3 px-12 py-4 border transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light disabled:opacity-50 disabled:cursor-not-allowed ${isCustomOne ? 'bg-[var(--modern-gold)] border-[var(--modern-gold)] text-white hover:bg-[#c99158] hover:border-[#c99158]' : 'bg-transparent border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)]'}`}
        >
          {submitting ? 'Sending...' : 'Send Message'}
          {!submitting && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
