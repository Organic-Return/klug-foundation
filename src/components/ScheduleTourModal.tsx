'use client';

import { useState, useEffect } from 'react';

interface ScheduleTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress: string;
}

export default function ScheduleTourModal({
  isOpen,
  onClose,
  propertyAddress,
}: ScheduleTourModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [tourType, setTourType] = useState<'in-person' | 'virtual'>('in-person');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Generate available dates (next 14 days, excluding Sundays)
  const getAvailableDates = () => {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip Sundays
      if (date.getDay() === 0) continue;

      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return dates;
  };

  // Available time slots
  const timeSlots = [
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
  ];

  const availableDates = getAvailableDates();

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
      tourType,
      selectedDate,
      selectedTime,
      name,
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
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-sothebys-blue)] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-light text-white">
              Schedule a Tour
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
          {/* Tour Type */}
          <div>
            <label className="block text-sm text-gray-600 mb-3 uppercase tracking-wider">
              Tour Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTourType('in-person')}
                className={`flex-1 py-3 px-4 border text-sm uppercase tracking-wider transition-all duration-300 ${
                  tourType === 'in-person'
                    ? 'border-[var(--color-sothebys-blue)] bg-[var(--color-sothebys-blue)] text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                In Person
              </button>
              <button
                type="button"
                onClick={() => setTourType('virtual')}
                className={`flex-1 py-3 px-4 border text-sm uppercase tracking-wider transition-all duration-300 ${
                  tourType === 'virtual'
                    ? 'border-[var(--color-sothebys-blue)] bg-[var(--color-sothebys-blue)] text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Virtual Tour
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-3 uppercase tracking-wider">
              Select Date
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {availableDates.slice(0, 10).map((date) => (
                <button
                  key={date.value}
                  type="button"
                  onClick={() => setSelectedDate(date.value)}
                  className={`py-3 px-2 border text-xs text-center transition-all duration-300 ${
                    selectedDate === date.value
                      ? 'border-[var(--color-sothebys-blue)] bg-[var(--color-sothebys-blue)] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-3 uppercase tracking-wider">
              Select Time
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => setSelectedTime(time.value)}
                  className={`py-3 px-2 border text-sm transition-all duration-300 ${
                    selectedTime === time.value
                      ? 'border-[var(--color-sothebys-blue)] bg-[var(--color-sothebys-blue)] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm text-gray-600 mb-4 uppercase tracking-wider">
              Your Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Additional notes or questions (optional)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-sothebys-blue)] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || !name || !email}
              className="w-full inline-flex items-center justify-center gap-3 py-4 bg-[var(--color-sothebys-blue)] text-white hover:bg-[#001a38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              Request Tour
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              An agent will confirm your tour request within 24 hours
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
