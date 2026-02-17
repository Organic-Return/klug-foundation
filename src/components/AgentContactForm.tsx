'use client';

import { useState } from 'react';

interface AgentContactFormProps {
  agentName: string;
  agentEmail?: string;
}

export default function AgentContactForm({ agentName, agentEmail }: AgentContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
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
          ...formData,
          interest: `Agent inquiry for ${agentName}`,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[var(--rc-gold)]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3
          className="text-xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-2"
          style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
        >
          Message Sent!
        </h3>
        <p className="text-[var(--rc-brown)] text-sm">We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="agent-name" className="block text-[11px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="agent-name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full border-0 border-b border-[var(--rc-brown)]/20 bg-transparent py-2 px-0 text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/30 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="agent-email" className="block text-[11px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="agent-email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full border-0 border-b border-[var(--rc-brown)]/20 bg-transparent py-2 px-0 text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/30 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label htmlFor="agent-phone" className="block text-[11px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="agent-phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full border-0 border-b border-[var(--rc-brown)]/20 bg-transparent py-2 px-0 text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/30 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label htmlFor="agent-message" className="block text-[11px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="agent-message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={4}
          className="w-full border-0 border-b border-[var(--rc-brown)]/20 bg-transparent py-2 px-0 text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/30 focus:border-[var(--rc-gold)] focus:ring-0 outline-none transition-colors resize-none"
          placeholder={`I'd like to connect with ${agentName.split(' ')[0]}...`}
        />
      </div>

      {submitStatus === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          There was an error sending your message. Please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--rc-gold)] text-white px-8 py-4 border border-[var(--rc-gold)] hover:bg-transparent hover:text-[var(--rc-gold)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
