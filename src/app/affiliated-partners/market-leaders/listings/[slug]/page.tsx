import type { Metadata } from 'next';
import ListingPage, { generateMetadata as listingGenerateMetadata } from '@/app/real-estate-for-sale/[id]/page';

export const revalidate = 60;

// The main listing page expects `{ id }`; this route uses `{ slug }`.
// Without remapping, generateMetadata pulled `id = undefined` out of params
// and getListingBySlug crashed on `slug.match` — taking the page down with
// a generic client-side error message. Remap before delegating.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const remapped = params.then((p) => ({ id: p.slug }));
  return listingGenerateMetadata({ params: remapped });
}

export default function MarketLeaderListingPage({ params }: { params: Promise<{ slug: string }> }) {
  // Pass canonicalize=false so the address-based slug redirect on the
  // /listings page doesn't bounce visitors away from the partner URL.
  const remappedParams = params.then(p => ({ id: p.slug }));
  return ListingPage({ params: remappedParams, canonicalize: false });
}
