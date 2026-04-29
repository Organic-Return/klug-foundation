import { Metadata } from 'next';
import Image from 'next/image';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import {
  getListingsByAgentId,
  getMlsNumbersWithSIRMedia,
  getNewestSingleFamilyByCity,
} from '@/lib/listings';
import { getSiteName, getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from '@/components/AgentListingsGrid';

const builder = createImageUrlBuilder(client);
function urlFor(source: any) { return builder.image(source); }

// Refresh frequently so newest single-family listings stay current
export const revalidate = 300;

interface AgentDoc {
  _id: string;
  name: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

interface PageDoc {
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: any;
  agent?: AgentDoc | null;
  exclusiveSectionTitle?: string;
  exclusiveEmptyText?: string;
  newestCity?: string;
  newestLimit?: number;
  newestSectionTitle?: string;
  newestSectionDescription?: string;
  newestEmptyText?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: any;
  };
}

const PAGE_QUERY = `*[_type == "exclusiveAndNewPage" && _id == "exclusiveAndNewPage"][0]{
  heroTitle,
  heroDescription,
  heroImage { asset->{ _id, url } },
  agent->{ _id, name, mlsAgentId, mlsAgentIdSold },
  exclusiveSectionTitle,
  exclusiveEmptyText,
  newestCity,
  newestLimit,
  newestSectionTitle,
  newestSectionDescription,
  newestEmptyText,
  seo {
    metaTitle,
    metaDescription,
    ogImage { asset->{ url } }
  }
}`;

const FALLBACK_AGENT_QUERY = `*[_type == "teamMember" && (slug.current == "chris-klug" || lower(name) == "chris klug")][0]{ _id, name, mlsAgentId, mlsAgentIdSold }`;

async function getPageData(): Promise<PageDoc | null> {
  return client.fetch<PageDoc | null>(PAGE_QUERY, {}, { next: { revalidate: 300 } });
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, baseUrl, page] = await Promise.all([
    getSiteName(),
    getBaseUrl(),
    getPageData(),
  ]);
  const heroTitle = page?.heroTitle || 'Exclusive and New';
  const title = page?.seo?.metaTitle || `${heroTitle} | ${siteName}`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || `Current active listings and the newest single family homes for sale.`;
  const ogImage = page?.seo?.ogImage?.asset?.url
    ? urlFor(page.seo.ogImage).width(1200).height(630).fit('crop').url()
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/exclusive-and-new` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/exclusive-and-new`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function ExclusiveAndNewPage() {
  const page = await getPageData();

  // Resolve the featured agent — prefer page.agent reference, fall back
  // to the legacy "find Chris Klug" lookup, then a hardcoded MLS id.
  let agent: AgentDoc | null = page?.agent ?? null;
  if (!agent) {
    agent = await client.fetch<AgentDoc | null>(
      FALLBACK_AGENT_QUERY,
      {},
      { next: { revalidate: 300 } }
    );
  }
  const agentMlsId = agent?.mlsAgentId || '3837';
  const agentName = agent?.name || 'Chris Klug';

  const newestCity = page?.newestCity || 'Aspen';
  const newestLimit = page?.newestLimit ?? 10;

  // Section 1: agent's active listings
  const agentListings = await getListingsByAgentId(agentMlsId, agent?.mlsAgentIdSold, agentName);

  // Section 2: newest single-family active listings in newestCity
  const newestListings = await getNewestSingleFamilyByCity(newestCity, newestLimit);

  // SIR media enrichment for both sets
  const allMlsNumbers = [
    ...agentListings.activeListings.map((l) => l.mls_number),
    ...newestListings.map((l) => l.mls_number),
  ].filter(Boolean) as string[];
  const sirMedia = await getMlsNumbersWithSIRMedia(allMlsNumbers);
  const mlsWithVideos = Array.from(sirMedia.videos);
  const mlsWithMatterport = Array.from(sirMedia.matterports);

  const heroTitle = page?.heroTitle || 'Exclusive and New';
  const heroDescription = page?.heroDescription
    || "Chris Klug's current exclusive listings, alongside the freshest single family homes to hit the Aspen market. Updated continuously from the MLS.";
  const exclusiveSectionTitle = page?.exclusiveSectionTitle || 'Current Listings';
  const exclusiveEmptyText = page?.exclusiveEmptyText || 'No active listings at this time.';
  const newestSectionTitle = page?.newestSectionTitle || `Newest ${newestCity} Single Family Homes`;
  const newestSectionDescription = page?.newestSectionDescription
    || `The ${newestLimit} most recently listed single family residences in ${newestCity}, refreshed continuously from the MLS.`;
  const newestEmptyText = page?.newestEmptyText || `No new ${newestCity} listings available.`;

  // Use the original asset URL and let Next/image generate the
  // responsive srcSet via /_next/image — fixes blur on hi-DPI
  // displays where the previous fixed-width 2400x1200 was undersized.
  const heroImageRaw: string | null = page?.heroImage?.asset?.url || null;

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero — transparent header sits on top, so add extra top padding */}
      <section
        className={`relative pt-36 pb-20 md:pt-44 md:pb-28 ${heroImageRaw ? '' : 'bg-[var(--color-sothebys-blue)]'}`}
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
            {/* Dark overlay so the headline stays legible regardless of the image */}
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

      {/* Section 1: Featured Agent's Exclusive Listings */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              {exclusiveSectionTitle}
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto" />
          </div>

          {agentListings.activeListings.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              {exclusiveEmptyText}
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={agentListings.activeListings}
              soldListings={[]}
              mlsWithVideos={mlsWithVideos}
              mlsWithMatterport={mlsWithMatterport}
            />
          )}
        </div>
      </section>

      {/* Section 2: Newest Single Family in selected city */}
      <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              {newestSectionTitle}
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto mb-6" />
            <p className="text-sm md:text-base text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
              {newestSectionDescription}
            </p>
          </div>

          {newestListings.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              {newestEmptyText}
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={newestListings}
              soldListings={[]}
              mlsWithVideos={mlsWithVideos}
              mlsWithMatterport={mlsWithMatterport}
            />
          )}
        </div>
      </section>
    </main>
  );
}
