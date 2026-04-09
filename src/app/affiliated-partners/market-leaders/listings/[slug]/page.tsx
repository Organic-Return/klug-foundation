import ListingPage from '@/app/listings/[id]/page';
export { generateMetadata } from '@/app/listings/[id]/page';

export const revalidate = 60;

export default function MarketLeaderListingPage({ params }: { params: Promise<{ slug: string }> }) {
  // Remap { slug } to { id } so the main listing page can resolve it
  const remappedParams = params.then(p => ({ id: p.slug }));
  return ListingPage({ params: remappedParams });
}
