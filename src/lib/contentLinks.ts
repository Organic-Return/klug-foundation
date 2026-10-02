// Editors paste absolute links to this site into rich text: an http:// form,
// a doubled slash after the host, a Drupal-era path that now redirects. Each
// one costs a crawler a hop (or a 404). Same-site links are rewritten to the
// live relative path; anything off-site is returned untouched.

const SITE_HOSTS = (() => {
  const hosts = new Set(['klugproperties.com', 'www.klugproperties.com']);
  try {
    const env = process.env.NEXT_PUBLIC_SITE_URL;
    if (env) {
      const bare = new URL(env).hostname.toLowerCase().replace(/^www\./, '');
      hosts.add(bare);
      hosts.add(`www.${bare}`);
    }
  } catch {
    // no site URL configured; the defaults above still apply
  }
  return hosts;
})();

const YOUTUBE_ID = /^\/videos\/([A-Za-z0-9_-]{11})$/;
const LEGACY_PATHS: Array<[RegExp, string]> = [
  [/^\/(?:aspen-)?blog(?=\/|$)/, '/about/blog'],
  [/^\/living-aspen(?:-magazine)?(?=\/|$)/, '/media/living-aspen-magazine'],
  [/^\/market-reports(?=\/|$)/, '/aspen-snowmass-market-reports'],
  [/^\/virtual-tours$/, '/media/videos'],
  [/^\/favorite-properties$/, '/saved-properties'],
  [/^\/listings\/off-market-listings$/i, '/off-market'],
  [/^\/listings(?=\/|$)/i, '/real-estate-for-sale'],
  [/^\/contact$/, '/contact-us'],
];

export function normalizeContentHref(href: string): string {
  if (!href) return href;
  let url: URL;
  try {
    url = new URL(href.trim());
  } catch {
    return href;
  }
  if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return href;

  let path = url.pathname.replace(/\/{2,}/g, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '');

  const mls = url.searchParams.get('mlsId');
  if (path === '/property-detail' && mls && /^[A-Za-z0-9]+$/.test(mls)) {
    return `/real-estate-for-sale/${mls}`;
  }
  const video = path.match(YOUTUBE_ID);
  if (video) return `/media/videos/${video[1]}`;
  if (/^\/videos(?=\/|$)/.test(path)) return '/media/videos';
  for (const [pattern, replacement] of LEGACY_PATHS) {
    if (pattern.test(path)) {
      path = path.replace(pattern, replacement);
      break;
    }
  }
  return `${path || '/'}${url.search}${url.hash}`;
}

// Hosts that refuse to be framed or served as a media source: a Dropbox share
// link is an HTML page, Zillow and FlexMLS block robots and framing. Media on
// these hosts is offered as a link rather than embedded.
const LINK_ONLY_MEDIA_HOSTS = ['dropbox.com', 'zillow.com', 'flexmls.com', 'drive.google.com'];

export function isEmbeddableMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !LINK_ONLY_MEDIA_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
