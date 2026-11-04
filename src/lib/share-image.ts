/**
 * Social share images (og:image / twitter:image) for the property-type hub
 * pages (/land, /condos, /commercial, /rentals and their city pages).
 *
 * A city page uses the matching community's image when the CMS has one —
 * its Open Graph image, else its featured image. Everything else falls back
 * to the site default resolved by getTenant() (SEO meta image → default hero
 * → homepage hero → logo). Nothing here is tenant-specific.
 */
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getTenant } from '@/lib/schema';

export interface ShareImage {
  url: string;
  width: number;
  height: number;
}

const SHARE_WIDTH = 1200;
const SHARE_HEIGHT = 630;

const builder = createImageUrlBuilder(client);

const COMMUNITY_IMAGE_QUERY = `*[_type == "community" && slug.current == $slug][0]{
  "og": seo.ogImage,
  "featured": featuredImage
}`;

function cropped(source: unknown): string | undefined {
  if (!(source as { asset?: unknown } | null)?.asset) return undefined;
  try {
    return builder
      .image(source as Parameters<typeof builder.image>[0])
      .width(SHARE_WIDTH)
      .height(SHARE_HEIGHT)
      .fit('crop')
      .url();
  } catch {
    return undefined;
  }
}

/** The site default share image, or undefined when the tenant has none at all. */
export async function getDefaultShareImage(): Promise<ShareImage | undefined> {
  const tenant = await getTenant();
  return tenant.imageUrl ? { url: tenant.imageUrl, width: SHARE_WIDTH, height: SHARE_HEIGHT } : undefined;
}

/**
 * Share image for an area (city) hub page: the community document whose slug
 * matches the city slug, else the site default.
 */
export async function getAreaShareImage(citySlug: string): Promise<ShareImage | undefined> {
  const slug = citySlug.toLowerCase();
  let community: { og?: unknown; featured?: unknown } | null = null;
  try {
    community = await client.fetch(COMMUNITY_IMAGE_QUERY, { slug }, { next: { revalidate: 300 } });
  } catch (error) {
    console.error('Error fetching community share image:', error);
  }
  const url = cropped(community?.og) || cropped(community?.featured);
  if (url) return { url, width: SHARE_WIDTH, height: SHARE_HEIGHT };
  return getDefaultShareImage();
}
