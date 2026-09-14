/**
 * Which website this deployment is.
 *
 * Several sites share one Supabase project for MLS data, and with it the
 * `leads` and `agent_profiles` tables. Every lead is stamped with this key
 * and every dashboard query filters on it, so one site's leads and logins
 * never show up on another's. Set LEAD_SITE_KEY per Vercel project (e.g.
 * "skk", "klug", "rc"); the production hostname is the fallback so a missing
 * variable still yields a stable, site-specific value rather than nothing.
 */
export function getSiteKey(): string {
  const explicit = (process.env.LEAD_SITE_KEY || '').trim();
  if (explicit) return explicit;
  const host = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (host) return host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return 'unknown';
}
