import { MetadataRoute } from 'next';
import { getSettings } from '@/lib/settings';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://example.com';

  // Single rule covers every crawler. /_next/static/* (CSS, JS bundles,
  // optimized images, fonts) is intentionally NOT blocked — Google,
  // Bing, and every AI crawler need to fetch CSS+JS to render the page
  // for indexing. Google's own guidance: "Make sure that crawlers can
  // access these files. If they're blocked, we can't properly render
  // and index your pages."
  //
  // What we DO block:
  //   /api/             — JSON endpoints, not content
  //   /studio/          — Sanity admin UI
  //   /saved-properties/ — per-user content behind auth
  //   /dashboard/       — agent dashboard
  //   /account/         — user account pages
  //   /private/         — any private folder
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/studio/',
          '/saved-properties/',
          '/dashboard/',
          '/account/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
