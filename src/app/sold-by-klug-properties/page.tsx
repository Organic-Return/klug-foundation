import { Metadata } from 'next';
import Image from 'next/image';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { getSoldListingsByAgentIds, getMlsNumbersWithSIRMedia } from '@/lib/listings';
import { getSiteName, getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from '@/components/AgentListingsGrid';

const builder = createImageUrlBuilder(client);
function urlFor(source: any) { return builder.image(source); }

export const revalidate = 300;

interface TeamMemberWithIds {
  _id: string;
  name: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

interface PageDoc {
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: any;
  showStats?: boolean;
  statsPropertiesLabel?: string;
  statsVolumeLabel?: string;
  emptyText?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: any;
  };
}

const PAGE_QUERY = `*[_type == "soldByKlugPage" && _id == "soldByKlugPage"][0]{
  heroTitle,
  heroDescription,
  heroImage { asset->{ _id, url } },
  showStats,
  statsPropertiesLabel,
  statsVolumeLabel,
  emptyText,
  seo {
    metaTitle,
    metaDescription,
    ogImage { asset->{ url } }
  }
}`;

async function getPageData(): Promise<PageDoc | null> {
  return client.fetch<PageDoc | null>(PAGE_QUERY, {}, { next: { revalidate: 300 } });
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, baseUrl, page] = await Promise.all([
    getSiteName(),
    getBaseUrl(),
    getPageData(),
  ]);
  const heroTitle = page?.heroTitle || 'Sold by Klug Properties';
  const title = page?.seo?.metaTitle || `${heroTitle} | ${siteName}`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || `Browse properties sold by Chris Klug and the Klug Properties team across Aspen, Snowmass Village, and the Roaring Fork Valley.`;
  const ogImage = page?.seo?.ogImage?.asset?.url
    ? urlFor(page.seo.ogImage).width(1200).height(630).fit('crop').url()
    : page?.heroImage?.asset?.url
      ? urlFor(page.heroImage).width(1200).height(630).fit('crop').url()
      : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/sold-by-klug-properties` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/sold-by-klug-properties`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function SoldByKlugPropertiesPage() {
  const [page, teamMembers] = await Promise.all([
    getPageData(),
    client.fetch<TeamMemberWithIds[]>(
      `*[_type == "teamMember" && inactive != true]{ _id, name, mlsAgentId, mlsAgentIdSold }`,
      {},
      { next: { revalidate: 300 } }
    ),
  ]);

  const agentIds = Array.from(
    new Set(
      teamMembers.flatMap((m) => [m.mlsAgentId, m.mlsAgentIdSold].filter(Boolean) as string[])
    )
  );

  const fetchedSold = await getSoldListingsByAgentIds(agentIds);
  // Sort sold listings by list price, highest first.
  const soldListings = [...fetchedSold].sort(
    (a, b) => (b.list_price ?? 0) - (a.list_price ?? 0)
  );

  // Calculate stats
  const totalSold = soldListings.length;
  const totalVolume = soldListings.reduce(
    (sum, l) => sum + (l.sold_price || l.list_price || 0),
    0
  );
  const formatVolume = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  // Fetch SIR media (videos/matterports) for any MLS numbers in the list
  const mlsNumbers = soldListings.map((l) => l.mls_number).filter(Boolean) as string[];
  const sirMedia = await getMlsNumbersWithSIRMedia(mlsNumbers);

  const heroTitle = page?.heroTitle || 'Sold by Klug Properties';
  const heroDescription = page?.heroDescription
    || "Properties closed by Chris Klug and the Klug Properties team across Aspen, Snowmass Village, and the Roaring Fork Valley — representing buyers and sellers in Colorado's most prestigious mountain communities.";
  // Use the original asset URL so next/image can build a proper srcSet.
  const heroImageRaw: string | null = page?.heroImage?.asset?.url || null;
  const showStats = page?.showStats !== false;
  const statsPropertiesLabel = page?.statsPropertiesLabel || 'Properties Sold';
  const statsVolumeLabel = page?.statsVolumeLabel || 'Total Sales Volume';
  const emptyText = page?.emptyText || 'No sold listings available yet.';

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero — transparent header sits on top, so add extra top padding */}
      <section
        className={`relative pt-28 pb-2 md:pt-36 md:pb-2 ${heroImageRaw ? '' : 'bg-[var(--color-sothebys-blue)]'}`}
      >
        {heroImageRaw && (
          <>
            <Image
              src={heroImageRaw}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-[var(--color-sothebys-blue)]/65"
              aria-hidden="true"
            />
          </>
        )}
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h1 className="font-serif text-white tracking-wide mb-6">
            {heroTitle}
          </h1>
          <div className="w-16 h-px bg-[#c9ac77] mx-auto mb-6" />
          <p className="text-base md:text-lg text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Stats */}
      {showStats && totalSold > 0 && (
        <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {totalSold}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  {statsPropertiesLabel}
                </p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {formatVolume(totalVolume)}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  {statsVolumeLabel}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {soldListings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
                {emptyText}
              </p>
            </div>
          ) : (
            <AgentListingsGrid
              activeListings={[]}
              soldListings={soldListings}
              mlsWithVideos={Array.from(sirMedia.videos)}
              mlsWithMatterport={Array.from(sirMedia.matterports)}
            />
          )}
        </div>
      </section>
    </main>
  );
}
