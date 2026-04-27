import { Metadata } from 'next';
import { client } from '@/sanity/client';
import { getSoldListingsByAgentIds, getMlsNumbersWithSIRMedia } from '@/lib/listings';
import { getSiteName, getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from '@/components/AgentListingsGrid';

export const revalidate = 300;

interface TeamMemberWithIds {
  _id: string;
  name: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, baseUrl] = await Promise.all([getSiteName(), getBaseUrl()]);
  const title = `Sold by Klug Properties | ${siteName}`;
  const description = `Browse properties sold by Chris Klug and the Klug Properties team across Aspen, Snowmass Village, and the Roaring Fork Valley.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/sold-by-klug-properties` },
    openGraph: { title, description, url: `${baseUrl}/sold-by-klug-properties` },
  };
}

export default async function SoldByKlugPropertiesPage() {
  // Fetch all active team members and collect every MLS ID variant
  const teamMembers = await client.fetch<TeamMemberWithIds[]>(
    `*[_type == "teamMember" && inactive != true]{ _id, name, mlsAgentId, mlsAgentIdSold }`,
    {},
    { next: { revalidate: 300 } }
  );

  const agentIds = Array.from(
    new Set(
      teamMembers.flatMap((m) => [m.mlsAgentId, m.mlsAgentIdSold].filter(Boolean) as string[])
    )
  );

  const soldListings = await getSoldListingsByAgentIds(agentIds);

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

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="bg-[var(--color-sothebys-blue)] py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[#c9ac77] text-xs tracking-[0.3em] uppercase mb-6">
            A Legacy of Results
          </p>
          <h1 className="font-serif text-white tracking-wide mb-6">
            Sold by Klug Properties
          </h1>
          <div className="w-16 h-px bg-[#c9ac77] mx-auto mb-6" />
          <p className="text-base md:text-lg text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
            Properties closed by Chris Klug and the Klug Properties team across Aspen,
            Snowmass Village, and the Roaring Fork Valley — representing buyers and
            sellers in Colorado&apos;s most prestigious mountain communities.
          </p>
        </div>
      </section>

      {/* Stats */}
      {totalSold > 0 && (
        <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {totalSold}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Properties Sold
                </p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {formatVolume(totalVolume)}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Total Sales Volume
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
                No sold listings available yet.
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
