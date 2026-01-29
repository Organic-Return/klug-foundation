'use client';

import { useState, useEffect } from 'react';

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress: string;
}

export default function RequestInfoModal({
  isOpen,
  onClose,
  propertyAddress,
}: RequestInfoModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('general');

  // Close on escape key
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log({
      propertyAddress,
      inquiryType,
      firstName,
      lastName,
      email,
      phone,
      message,
    });
    // Reset form and close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-sothebys-blue)] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-light text-white">
              Request Information
            </h2>
            <p className="text-white/70 text-sm mt-1 truncate max-w-md">
              {propertyAddress}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Inquiry Type */}
          <div>
            <label className="block text-sm text-gray-600 mb-3 uppercase tracking-wider">
              I'm interested in
            </label>
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

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reqFirstName" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  id="reqFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="reqLastName" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  id="reqLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reqEmail" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                id="reqEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reqPhone" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                id="reqPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reqMessage" className="block text-sm text-gray-600 mb-2 uppercase tracking-wider">
                Message
              </label>
              <textarea
                id="reqMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`I'd like more information about ${propertyAddress}...`}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!firstName || !lastName || !email}
              className="w-full inline-flex items-center justify-center gap-3 py-4 bg-[var(--color-sothebys-blue)] text-white hover:bg-[#001a38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              Send Request
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              An agent will respond to your inquiry within 24 hours
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
