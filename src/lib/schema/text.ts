/**
 * Text helpers for structured data: Portable Text to plain text, trimming
 * descriptions to a sensible length, and date normalisation.
 */

type Block = { _type?: string; children?: Array<{ text?: string }>; listItem?: string };

/** Portable Text (or a plain string) as plain text, paragraphs separated by blank lines. */
export function toPlainText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (!Array.isArray(value)) return '';
  return (value as Block[])
    .filter((block) => block && block._type === 'block' && Array.isArray(block.children))
    .map((block) => {
      const text = block.children!.map((child) => child.text || '').join('');
      return block.listItem ? `• ${text}` : text;
    })
    .filter((line) => line.trim())
    .join('\n\n')
    .trim();
}

/** First `max` characters on a word boundary, for descriptions. */
export function truncate(text: string | null | undefined, max = 300): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).trim()}…`;
}

/** YYYY-MM-DD or full ISO string, or undefined when unparsable. */
export function isoDate(value: string | Date | null | undefined, dateOnly = false): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return dateOnly ? date.toISOString().slice(0, 10) : date.toISOString();
}

/** "2026-07-01" + "2026-09-30" → "2026-07/2026-09"; either end optional. */
export function temporalCoverage(start?: string | null, end?: string | null): string | undefined {
  const s = isoDate(start, true)?.slice(0, 7);
  const e = isoDate(end, true)?.slice(0, 7);
  if (s && e) return s === e ? s : `${s}/${e}`;
  return s || e || undefined;
}

/**
 * The street part of a feed address that repeats the city, state and ZIP,
 * e.g. "82 Vista Place, Glenwood Springs, CO 81601" → "82 Vista Place".
 */
export function streetOnly(
  address: string | null | undefined,
  city?: string | null,
  state?: string | null,
  postalCode?: string | null
): string | undefined {
  if (!address) return undefined;
  let street = address.trim();
  const esc = (v: string) => v.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (city) street = street.replace(new RegExp(`,\\s*${esc(city)}(,\\s*[A-Z]{2})?(\\s+\\d{5}(-\\d{4})?)?\\s*$`, 'i'), '');
  if (state) street = street.replace(new RegExp(`,\\s*${esc(state)}(\\s+\\d{5}(-\\d{4})?)?\\s*$`, 'i'), '');
  if (postalCode) street = street.replace(new RegExp(`[\\s,]*${esc(postalCode)}\\s*$`), '');
  // Generic ", City, ST 12345" suffix when the feed's own fields are missing
  street = street.replace(/,\s*[A-Za-z .'-]+,\s*[A-Z]{2}(\s+\d{5}(-\d{4})?)?\s*$/, '');
  return street.trim() || undefined;
}
