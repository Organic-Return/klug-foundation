export interface RemarkItem {
  type?: string;
  remark?: string;
  htmlRemark?: string;
  languageCode?: string;
}

export function parseRemarks(remarks: RemarkItem[] | string | null): string {
  if (!remarks) return '';

  if (typeof remarks === 'string') {
    try {
      const parsed = JSON.parse(remarks);
      if (Array.isArray(parsed)) {
        const personalProfile = parsed.find((r: RemarkItem) => r.type === 'Personal Profile');
        const remarkItem = personalProfile || parsed[0];
        return remarkItem?.remark || remarkItem?.htmlRemark || '';
      }
      return parsed.remark || parsed.Remark || '';
    } catch {
      return remarks;
    }
  }

  if (Array.isArray(remarks)) {
    const personalProfile = remarks.find((r: RemarkItem) => r.type === 'Personal Profile');
    const remarkItem = personalProfile || remarks[0];
    return remarkItem?.remark || remarkItem?.htmlRemark || '';
  }

  return '';
}

export function parseRemarksHtml(remarks: RemarkItem[] | string | null): string {
  if (!remarks) return '';

  if (typeof remarks === 'string') {
    try {
      const parsed = JSON.parse(remarks);
      if (Array.isArray(parsed)) {
        const personalProfile = parsed.find((r: RemarkItem) => r.type === 'Personal Profile');
        const remarkItem = personalProfile || parsed[0];
        return remarkItem?.htmlRemark || remarkItem?.remark || '';
      }
      return parsed.htmlRemark || parsed.remark || parsed.Remark || '';
    } catch {
      return remarks;
    }
  }

  if (Array.isArray(remarks)) {
    const personalProfile = remarks.find((r: RemarkItem) => r.type === 'Personal Profile');
    const remarkItem = personalProfile || remarks[0];
    return remarkItem?.htmlRemark || remarkItem?.remark || '';
  }

  return '';
}

export function normalizePhotoUrl(url: string | null): string | null {
  if (!url) return null;

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (!url.startsWith('http')) {
    return `https://${url}`;
  }

  return url;
}

export function formatOfficeAddress(officeAddress: unknown): string {
  if (!officeAddress) return '';

  try {
    const addr = typeof officeAddress === 'string'
      ? JSON.parse(officeAddress)
      : officeAddress;
    const parts = [
      addr.streetAddress,
      addr.city,
      addr.stateProvince,
      addr.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  } catch {
    return String(officeAddress);
  }
}

export function parseMlsNumbers(mlsNumbers: unknown): string[] {
  if (!mlsNumbers) return [];

  try {
    const parsed = typeof mlsNumbers === 'string'
      ? JSON.parse(mlsNumbers)
      : mlsNumbers;
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch {
    return [String(mlsNumbers)];
  }

  return [];
}
