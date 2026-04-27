import { Metadata } from 'next';
import { client } from '@/sanity/client';
import {
  getListingsByAgentId,
  getMlsNumbersWithSIRMedia,
  getNewestSingleFamilyByCity,
} from '@/lib/listings';
import { getSiteName, getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from '@/components/AgentListingsGrid';

// Refresh frequently so newest Aspen listings stay current
export const revalidate = 300;

interface ChrisDoc {
  _id: string;
  name: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, baseUrl] = await Promise.all([getSiteName(), getBaseUrl()]);
  const title = `Exclusive and New | ${siteName}`;
  const description = `Chris Klug's current active listings and the 10 newest single family homes for sale in Aspen, Colorado.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/exclusive-and-new` },
    openGraph: { title, description, url: `${baseUrl}/exclusive-and-new` },
  };
}

export default async function ExclusiveAndNewPage() {
  // Look up Chris Klug's MLS ID from Sanity (preferred over hardcoded)
  const chris = await client.fetch<ChrisDoc | null>(
    `*[_type == "teamMember" && (slug.current == "chris-klug" || lower(name) == "chris klug")][0]{ _id, name, mlsAgentId, mlsAgentIdSold }`,
    {},
    { next: { revalidate: 300 } }
  );

  const chrisMlsId = chris?.mlsAgentId || '3837';
  const chrisName = chris?.name || 'Chris Klug';

  // Section 1: Chris's active listings
  const chrisListings = await getListingsByAgentId(chrisMlsId, chris?.mlsAgentIdSold, chrisName);

  // Section 2: 10 newest single-family active listings in Aspen
  const newestAspen = await getNewestSingleFamilyByCity('Aspen', 10);

  // SIR media enrichment for both sets
  const allMlsNumbers = [
    ...chrisListings.activeListings.map((l) => l.mls_number),
    ...newestAspen.map((l) => l.mls_number),
  ].filter(Boolean) as string[];
  const sirMedia = await getMlsNumbersWithSIRMedia(allMlsNumbers);
  const mlsWithVideos = Array.from(sirMedia.videos);
  const mlsWithMatterport = Array.from(sirMedia.matterports);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="bg-[var(--color-sothebys-blue)] py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[#c9ac77] text-xs tracking-[0.3em] uppercase mb-6">
            Aspen Real Estate
          </p>
          <h1 className="font-serif text-white tracking-wide mb-6">
            Exclusive and New
          </h1>
          <div className="w-16 h-px bg-[#c9ac77] mx-auto mb-6" />
          <p className="text-base md:text-lg text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            Chris Klug&apos;s current exclusive listings, alongside the freshest single
            family homes to hit the Aspen market. Updated continuously from the MLS.
          </p>
        </div>
      </section>

      {/* Section 1: Chris's Exclusive Listings */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-3">
              Chris Klug Exclusive
            </p>
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Current Listings
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto" />
          </div>

          {chrisListings.activeListings.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              No active listings at this time.
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={chrisListings.activeListings}
              soldListings={[]}
              mlsWithVideos={mlsWithVideos}
              mlsWithMatterport={mlsWithMatterport}
            />
          )}
        </div>
      </section>

      {/* Section 2: Newest Single Family in Aspen */}
      <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[var(--color-gold)] text-xs tracking-[0.3em] uppercase mb-3">
              Just Listed
            </p>
            <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Newest Aspen Single Family Homes
            </h2>
            <div className="w-16 h-px bg-[var(--color-gold)] mx-auto mb-6" />
            <p className="text-sm md:text-base text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
              The ten most recently listed single family residences in Aspen, refreshed
              continuously from the Aspen Glenwood MLS.
            </p>
          </div>

          {newestAspen.length === 0 ? (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light py-8">
              No new Aspen listings available.
            </p>
          ) : (
            <AgentListingsGrid
              activeListings={newestAspen}
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
