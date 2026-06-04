'use client';

import { useState } from 'react';
import { getUTMData } from './UTMCapture';
import { trackLeadSubmitted } from '@/lib/tracking';

export default function ContactPageForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
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
          leadType: 'contact',
          source: 'Contact Page',
          sourceUrl: utm.source_url,
          referrer: utm.referrer,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          utmContent: utm.utm_content,
          utmTerm: utm.utm_term,
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      trackLeadSubmitted({ leadType: 'contact', email, phone: phone || undefined });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-[var(--rc-navy,#002349)] mb-2">Thank you</h2>
        <p className="text-[#4a4a4a]">A member of our team will be in touch within 24 hours.</p>
      </div>
    );
  }

  const inputClasses =
    'w-full px-4 py-3 bg-white border border-[var(--rc-brown,#6a6a6a)]/20 text-[var(--rc-navy,#002349)] placeholder:text-[var(--rc-brown,#6a6a6a)]/40 focus:border-[var(--rc-gold,#c9ac77)] focus:outline-none transition-colors text-sm';
  const labelClasses = 'text-[10px] tracking-[0.15em] text-[var(--rc-brown,#6a6a6a)]/60 uppercase block mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="firstName" className={labelClasses}>First Name</label>
          <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClasses}>Last Name</label>
          <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClasses} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className={labelClasses}>Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>Phone</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClasses}>Message</label>
        <textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClasses} resize-none`} />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || !firstName || !lastName || !email}
          className="sir-btn px-12 py-3 text-xs tracking-[0.15em] uppercase disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
