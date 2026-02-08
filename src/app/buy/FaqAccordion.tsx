'use client';

import { useState } from 'react';

interface FaqAccordionProps {
  faqs: { question: string; answer: string }[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-[#e8e6e3] dark:border-gray-800 bg-white dark:bg-[#1a1a1a]"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <span className="text-[#1a1a1a] dark:text-white font-medium pr-4">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-[#6a6a6a] dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-6 pb-5">
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light leading-relaxed">
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
