import { NextRequest, NextResponse } from 'next/server';
import { getListings, getMlsNumbersWithSIRMedia, type SortOption } from '@/lib/listings';
import {
  getMLSConfiguration,
  getExcludedPropertyTypes,
  getExcludedPropertySubTypes,
  getAllowedCities,
} from '@/lib/mlsConfiguration';
import { getSettings } from '@/lib/settings';
import { client } from '@/sanity/client';

const allowedStatusList = [
  'Active',
  'Active Under Contract',
  'Active U/C W/ Bump',
  'Pending',
  'Pending Inspect/Feasib',
  'To Be Built',
];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const page = parseInt(sp.get('page') || '1', 10);
  const status = sp.get('status') || undefined;
  const propertyType = sp.get('type') || undefined;
  const propertySubType = sp.get('subtype') || undefined;
  const selectedCities = sp.get('city')
    ? sp.get('city')!.split(',').map(c => c.trim()).filter(Boolean)
    : [];
  const neighborhood = sp.get('neighborhood') || undefined;
  const minPrice = sp.get('minPrice') ? parseInt(sp.get('minPrice')!, 10) : undefined;
  const maxPrice = sp.get('maxPrice') ? parseInt(sp.get('maxPrice')!, 10) : undefined;
  const beds = sp.get('beds') ? parseInt(sp.get('beds')!, 10) : undefined;
  const baths = sp.get('baths') ? parseInt(sp.get('baths')!, 10) : undefined;
  const sort = (sp.get('sort') || 'newest') as SortOption;
  const keyword = sp.get('q') || undefined;
  const ourTeam = sp.get('ourTeam') === 'true';

  // Fetch config in parallel (always fetch team members for video flag logic)
  const [mlsConfig, settings, teamMembers] = await Promise.all([
    getMLSConfiguration(),
    getSettings(),
    client.fetch<{ name: string; mlsAgentId?: string; mlsAgentIdSold?: string }[]>(
      `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{ name, mlsAgentId, mlsAgentIdSold }`,
      {},
      { next: { revalidate: 3600 } }
    ),
  ]);

  const excludedPropertyTypes = [...getExcludedPropertyTypes(mlsConfig), 'Commercial Sale'];
  const excludedPropertySubTypes = getExcludedPropertySubTypes(mlsConfig);
  const allowedCities = getAllowedCities(mlsConfig);

  const allTeamAgentIds = [...new Set(teamMembers.flatMap(m => [m.mlsAgentId, m.mlsAgentIdSold]).filter(Boolean) as string[])];
  const teamAgentIds = ourTeam ? allTeamAgentIds : undefined;
  const teamAgentNames = ourTeam
    ? [...new Set(teamMembers.map(m => m.name).filter(Boolean))]
    : undefined;
  const teamOfficeNames = ourTeam && settings?.teamSync?.offices
    ? settings.teamSync.offices.map(o => o.officeName).filter(Boolean)
    : undefined;

  const result = await getListings(page, 24, {
    status,
    propertyType,
    propertySubType,
    cities: selectedCities.length > 0 ? selectedCities : undefined,
    neighborhood,
    minPrice,
    maxPrice,
    minBeds: beds,
    minBaths: baths,
    keyword,
    agentMlsIds: teamAgentIds,
    agentNames: teamAgentNames,
    officeNames: teamOfficeNames,
    excludedPropertyTypes,
    excludedPropertySubTypes,
    allowedCities,
    allowedStatuses: allowedStatusList,
    sort,
  });

  // Check which team listings have SIR videos and Matterport tours
  const teamListingMlsNumbers = result.listings
    .filter(l => l.mls_number && l.list_agent_mls_id && allTeamAgentIds.includes(l.list_agent_mls_id))
    .map(l => l.mls_number);
  const sirMedia = teamListingMlsNumbers.length > 0
    ? await getMlsNumbersWithSIRMedia(teamListingMlsNumbers)
    : { videos: new Set<string>(), matterports: new Set<string>() };

  return NextResponse.json({
    ...result,
    mlsWithVideos: Array.from(sirMedia.videos),
    mlsWithMatterport: Array.from(sirMedia.matterports),
    teamAgentMlsIds: allTeamAgentIds,
  }, {
    headers: {
      // Cache on Vercel CDN for 30s, serve stale while revalidating for 60s
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
