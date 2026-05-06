import ListingPage from '@/app/real-estate-for-sale/[id]/page';
export { generateMetadata } from '@/app/real-estate-for-sale/[id]/page';

export const revalidate = 60;

export default function MarketLeaderListingPage({ params }: { params: Promise<{ slug: string }> }) {
  // Remap { slug } to { id } so the main listing page can resolve it.
  // Pass canonicalize=false so the address-based slug redirect on the
  // /listings page doesn't bounce visitors away from the partner URL.
  const remappedParams = params.then(p => ({ id: p.slug }));
  return ListingPage({ params: remappedParams, canonicalize: false });
}
