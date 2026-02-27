/**
 * Format a phone number with dots: 000.000.0000
 * Handles various input formats: (509) 123-4567, 509-123-4567, 5091234567, etc.
 * Returns original string if not a valid 10 or 11 digit number.
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  // 11 digits starting with 1 (US country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `${digits.slice(1, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  // Standard 10 digit US number
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  // Not a standard US number — return as-is
  return phone;
}

/**
 * Strip a phone number to digits only for tel: href links.
 */
export function phoneHref(phone: string | undefined | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}
