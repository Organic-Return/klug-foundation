/**
 * Convert messy HTML (often pasted from Word/Outlook into Sanity) into clean
 * plain text while preserving paragraph breaks. Block-level tag closings
 * become double newlines so downstream renderers can split on /\n\s*\n+/ to
 * get one <p> per paragraph.
 */
export function htmlToPlainText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    // Block-level closings → paragraph break
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section)>/gi, '\n\n')
    // <br> → single newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip every remaining tag
    .replace(/<[^>]*>/g, '')
    // Decode the entities that show up in pasted bios
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/ /g, ' ')
    // Tidy whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split clean plain text on blank lines so each paragraph renders as its own
 * <p> tag. Pair with htmlToPlainText when the input may contain HTML.
 */
export function splitParagraphs(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
