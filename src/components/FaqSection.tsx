import { toPlainText } from '@/lib/schema';

type Span = { _type?: string; text?: string };
type Block = { _key?: string; _type?: string; style?: string; listItem?: string; children?: Span[] };

export interface FaqEntry {
  question: string;
  /** Plain text or Portable Text blocks. */
  answer: string | Block[] | null | undefined;
}

interface FaqSectionProps {
  title?: string | null;
  faqs: FaqEntry[] | null | undefined;
  /** Wrapper background; the default matches the sell and buy page sections. */
  className?: string;
}

/** Groups consecutive list-item blocks so they render as one list. */
function renderAnswer(answer: FaqEntry['answer']) {
  if (!answer) return null;
  if (typeof answer === 'string') {
    return answer
      .split(/\n{2,}/)
      .filter((p) => p.trim())
      .map((p, i) => (
        <p key={i} className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed">
          {p.trim()}
        </p>
      ));
  }
  const out: React.ReactNode[] = [];
  let list: Block[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    out.push(
      <ul key={`list-${out.length}`} className="list-disc pl-6 space-y-1 text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed">
        {list.map((block, i) => (
          <li key={block._key || i}>{(block.children || []).map((c) => c.text || '').join('')}</li>
        ))}
      </ul>
    );
    list = [];
  };
  for (const block of answer) {
    if (!block || block._type !== 'block') continue;
    if (block.listItem) {
      list.push(block);
      continue;
    }
    flushList();
    const text = (block.children || []).map((c) => c.text || '').join('');
    if (!text.trim()) continue;
    out.push(
      <p key={block._key || out.length} className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed">
        {text}
      </p>
    );
  }
  flushList();
  return out;
}

/**
 * Visible FAQ accordion. Answers are in the server HTML (inside <details>),
 * so the FAQPage structured data built from the same entries describes
 * exactly what is on the page. Pair with `faqEntries()` for the schema.
 */
export default function FaqSection({ title, faqs, className }: FaqSectionProps) {
  const entries = (faqs || []).filter((f) => f?.question?.trim() && toPlainText(f.answer));
  if (entries.length === 0) return null;
  return (
    <section className={className || 'py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]'}>
      <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
          {title || 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-6">
          {entries.map((faq, index) => (
            <details key={index} className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800">
              <summary className="flex items-center justify-between cursor-pointer p-6 md:p-8 text-lg font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide list-none">
                {faq.question}
                <svg
                  className="w-5 h-5 text-[var(--color-gold)] transition-transform duration-300 group-open:rotate-45 flex-shrink-0 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </summary>
              <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">{renderAnswer(faq.answer)}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The same entries as plain text, for `faqNode`. */
export function faqEntries(faqs: FaqEntry[] | null | undefined): Array<{ question: string; answer: string }> {
  return (faqs || [])
    .map((f) => ({ question: (f?.question || '').trim(), answer: toPlainText(f?.answer) }))
    .filter((f) => f.question && f.answer);
}
