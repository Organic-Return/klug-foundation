import type { Metadata } from 'next';
import { getOpenHouseListings } from '@/lib/listings';
import { getSiteName, getBaseUrl, getSettings } from '@/lib/settings';
import { client } from '@/sanity/client';
import OpenHouseGrid from '@/components/OpenHouseGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  const description = `Browse upcoming open houses from ${siteName}.`;

  return {
    title: 'Open Houses',
    description,
    alternates: { canonical: `${baseUrl}/open-houses` },
    openGraph: {
      title: `Open Houses | ${siteName}`,
      description,
      url: `${baseUrl}/open-houses`,
    },
  };
}

export default async function OpenHousesPage() {
  const [listings, settings] = await Promise.all([
    getOpenHouseListings(),
    getSettings(),
  ]);

  // Build the set of "our" agent MLS IDs and office names for filtering
  const teamOfficeNames = settings?.teamSync?.offices
    ? settings.teamSync.offices.map((o: any) => o.officeName).filter(Boolean)
    : [];

  const teamMembers = settings?.teamSync?.enabled
    ? await client.fetch<{ mlsAgentId?: string; mlsAgentIdSold?: string }[]>(
        `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{ mlsAgentId, mlsAgentIdSold }`,
        {},
        { next: { revalidate: 300 } }
      )
    : [];

  const teamAgentIds = [
    ...new Set(
      teamMembers
        .flatMap((m) => [m.mlsAgentId, m.mlsAgentIdSold])
        .filter(Boolean) as string[]
    ),
  ];

  const hasOurTeamFilter = teamAgentIds.length > 0 || teamOfficeNames.length > 0;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--rc-navy)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
            style={{
              fontFamily: 'var(--font-figtree), Figtree, sans-serif',
              lineHeight: '1.1em',
            }}
          >
            Open Houses
          </h1>
          <p className="text-white/60 text-base md:text-lg font-normal max-w-2xl mx-auto">
            Visit our upcoming open houses and find your next home
          </p>
          {listings.length > 0 && (
            <p className="text-white/40 text-sm mt-3 font-light">
              {listings.length} upcoming {listings.length === 1 ? 'open house' : 'open houses'}
            </p>
          )}
        </div>
      </section>

      {/* Listings */}
      <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
        <div className="max-w-7xl mx-auto px-6">
          {listings.length > 0 ? (
            <OpenHouseGrid
              listings={listings}
              showOurTeamFilter={hasOurTeamFilter}
              teamAgentIds={teamAgentIds}
              teamOfficeNames={teamOfficeNames}
            />
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto mb-6 text-[var(--rc-brown)]/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2
                className="text-xl md:text-2xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-3"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                No Upcoming Open Houses
              </h2>
              <p className="text-[var(--rc-brown)] text-sm max-w-md mx-auto">
                There are no open houses scheduled at this time. Please check back soon
                or contact us for a private showing.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
