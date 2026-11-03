/**
 * Stable schema.org @id values. Every entity on the site is addressed by one
 * of these so nodes on different pages (and in the sitewide graph emitted by
 * the root layout) refer to the same thing.
 *
 *   https://{domain}/#organization   the business (RealEstateAgent)
 *   https://{domain}/#agent          the primary agent (Person)
 *   https://{domain}/#website        the WebSite
 *   https://{domain}/{path}#webpage  the current page
 *   https://{domain}/{path}#breadcrumb
 */

/** Strips trailing slashes so "https://x.com/" and "https://x.com" agree. */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/** Joins a site base URL and a path (or returns the path if already absolute). */
export function absoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = normalizeBaseUrl(baseUrl);
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const ids = {
  organization: (baseUrl: string) => `${normalizeBaseUrl(baseUrl)}/#organization`,
  agent: (baseUrl: string) => `${normalizeBaseUrl(baseUrl)}/#agent`,
  website: (baseUrl: string) => `${normalizeBaseUrl(baseUrl)}/#website`,
  webpage: (pageUrl: string) => `${pageUrl}#webpage`,
  breadcrumb: (pageUrl: string) => `${pageUrl}#breadcrumb`,
  faq: (pageUrl: string) => `${pageUrl}#faq`,
  itemList: (pageUrl: string) => `${pageUrl}#itemlist`,
  mainEntity: (pageUrl: string) => `${pageUrl}#main`,
};

export type Ref = { '@id': string };

export const ref = (id: string): Ref => ({ '@id': id });
