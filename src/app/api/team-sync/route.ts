import { NextResponse } from 'next/server';
import { writeClient, client } from '@/sanity/client';
import { getRealogySupabase, isRealogyConfigured } from '@/lib/realogySupabase';
import { getTeamSyncConfig } from '@/lib/settings';
import {
  parseRemarksHtml,
  normalizePhotoUrl,
  formatOfficeAddress,
  parseMlsNumbers,
} from '@/lib/realogyHelpers';

const TIMEOUT_MS = 55_000; // Stop processing before 60s serverless limit

interface RealogyAgent {
  id: string;
  rfg_staff_id: string | null;
  entity_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  lead_email: string | null;
  business_phone: string | null;
  mobile_phone: string | null;
  office_phone: string | null;
  office_name: string | null;
  office_id: string | null;
  office_address: unknown;
  photo_url: string | null;
  remarks: unknown;
  mls_numbers: unknown;
  specialty: string | null;
}

interface SanityTeamMember {
  _id: string;
  realogyId?: string;
  syncSource?: string;
  name?: string;
  title?: string;
  bio?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
  address?: string;
  mlsAgentId?: string;
  inactive?: boolean;
  _syncPhotoUrl?: string;
  overrides?: Record<string, boolean>;
}

function getAgentRealogyId(agent: RealogyAgent): string {
  return agent.rfg_staff_id || agent.entity_id || agent.id;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 96);
}

async function uploadPhotoToSanity(photoUrl: string): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> {
  try {
    // Build base URL for the photo proxy
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';

    const proxyResponse = await fetch(
      `${baseUrl}/api/agents/photo?url=${encodeURIComponent(photoUrl)}`
    );
    if (!proxyResponse.ok) return null;

    const buffer = Buffer.from(await proxyResponse.arrayBuffer());
    const contentType = proxyResponse.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    const asset = await writeClient.assets.upload('image', buffer, {
      filename: `agent-photo.${ext}`,
      contentType,
    });

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return null;
  }
}

async function fetchAgentsForOffices(officeIds: string[]): Promise<RealogyAgent[]> {
  const realogySupabase = getRealogySupabase();
  if (!realogySupabase) return [];

  const allAgents: RealogyAgent[] = [];

  for (const officeId of officeIds) {
    const { data, error } = await realogySupabase
      .from('realogy_agents')
      .select(`
        id, rfg_staff_id, entity_id, first_name, last_name,
        email, lead_email, business_phone, mobile_phone, office_phone,
        office_name, office_id, office_address, photo_url, remarks,
        mls_numbers, specialty
      `)
      .eq('office_id', officeId)
      .not('first_name', 'is', null)
      .not('last_name', 'is', null);

    if (error) {
      console.error(`Error fetching agents for office ${officeId}:`, error);
      continue;
    }

    if (data) {
      allAgents.push(...(data as RealogyAgent[]));
    }
  }

  // Deduplicate by realogyId
  const seen = new Set<string>();
  return allAgents.filter((agent) => {
    const id = getAgentRealogyId(agent);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function fetchExistingSyncedMembers(): Promise<SanityTeamMember[]> {
  return client.fetch<SanityTeamMember[]>(
    `*[_type == "teamMember" && syncSource == "realogy_sync"]{
      _id, realogyId, syncSource, name, title, bio, email, phone, mobile,
      office, address, mlsAgentId, inactive, _syncPhotoUrl, overrides
    }`,
    {},
    { next: { revalidate: 0 } }
  );
}

function buildPatchData(
  agent: RealogyAgent,
  existing: SanityTeamMember | null,
): Record<string, unknown> {
  const overrides = existing?.overrides || {};
  const patch: Record<string, unknown> = {};

  const name = `${agent.first_name} ${agent.last_name}`;
  if (!overrides.name && name.trim()) patch.name = name;

  const bio = parseRemarksHtml(agent.remarks as any);
  if (!overrides.bio && bio) patch.bio = bio;

  const email = agent.email || agent.lead_email || '';
  if (!overrides.email && email) patch.email = email;

  const phone = agent.business_phone || '';
  if (!overrides.phone && phone) patch.phone = phone;

  const mobile = agent.mobile_phone || '';
  if (!overrides.mobile && mobile) patch.mobile = mobile;

  const officePhone = agent.office_phone || '';
  if (!overrides.office && officePhone) patch.office = officePhone;

  const address = formatOfficeAddress(agent.office_address);
  if (!overrides.address && address) patch.address = address;

  const specialty = agent.specialty || '';
  if (!overrides.title && specialty) patch.title = specialty;

  const mlsNumbers = parseMlsNumbers(agent.mls_numbers);
  if (!overrides.mlsAgentId && mlsNumbers.length > 0) patch.mlsAgentId = mlsNumbers[0];

  return patch;
}

async function executeSync() {
  const startTime = Date.now();
  const config = await getTeamSyncConfig();

  if (!config.enabled || config.offices.length === 0) {
    return { message: 'Team sync is disabled or no offices configured', added: 0, updated: 0, deactivated: 0, skipped: 0 };
  }

  if (!isRealogyConfigured()) {
    return { error: 'Realogy database not configured', added: 0, updated: 0, deactivated: 0, skipped: 0 };
  }

  const officeIds = config.offices.map((o) => o.officeId);
  const [realogyAgents, existingMembers] = await Promise.all([
    fetchAgentsForOffices(officeIds),
    fetchExistingSyncedMembers(),
  ]);

  // Build lookup of existing members by realogyId
  const existingByRealogyId = new Map<string, SanityTeamMember>();
  for (const member of existingMembers) {
    if (member.realogyId) {
      existingByRealogyId.set(member.realogyId, member);
    }
  }

  const results = { added: 0, updated: 0, deactivated: 0, skipped: 0, errors: [] as string[], timedOut: false };
  const processedRealogyIds = new Set<string>();

  for (const agent of realogyAgents) {
    // Check timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      results.timedOut = true;
      break;
    }

    const realogyId = getAgentRealogyId(agent);
    processedRealogyIds.add(realogyId);

    const existing = existingByRealogyId.get(realogyId);

    try {
      if (!existing) {
        // CREATE new team member
        const name = `${agent.first_name} ${agent.last_name}`;
        const slug = generateSlug(name);

        const doc: { _type: string; [key: string]: unknown } = {
          _type: 'teamMember',
          realogyId,
          syncSource: 'realogy_sync',
          name,
          slug: { _type: 'slug', current: slug },
          order: config.defaultOrder,
          inactive: false,
          lastSyncedAt: new Date().toISOString(),
        };

        // Add all available fields
        const bio = parseRemarksHtml(agent.remarks as any);
        if (bio) doc.bio = bio;

        const email = agent.email || agent.lead_email || '';
        if (email) doc.email = email;

        if (agent.business_phone) doc.phone = agent.business_phone;
        if (agent.mobile_phone) doc.mobile = agent.mobile_phone;
        if (agent.office_phone) doc.office = agent.office_phone;

        const address = formatOfficeAddress(agent.office_address);
        if (address) doc.address = address;

        if (agent.specialty) doc.title = agent.specialty;

        const mlsNumbers = parseMlsNumbers(agent.mls_numbers);
        if (mlsNumbers.length > 0) doc.mlsAgentId = mlsNumbers[0];

        // Upload photo
        const photoUrl = normalizePhotoUrl(agent.photo_url);
        if (photoUrl) {
          const imageData = await uploadPhotoToSanity(photoUrl);
          if (imageData) {
            doc.image = imageData;
            doc._syncPhotoUrl = photoUrl;
          }
        }

        await writeClient.create(doc);
        results.added++;
      } else {
        // UPDATE existing member — only non-overridden fields
        const patchData = buildPatchData(agent, existing);
        patchData.lastSyncedAt = new Date().toISOString();

        // If agent was inactive, reactivate
        if (existing.inactive) {
          patchData.inactive = false;
        }

        // Handle photo updates
        const photoUrl = normalizePhotoUrl(agent.photo_url);
        const overrides = existing.overrides || {};
        if (!overrides.image && photoUrl && photoUrl !== existing._syncPhotoUrl) {
          const imageData = await uploadPhotoToSanity(photoUrl);
          if (imageData) {
            patchData.image = imageData;
            patchData._syncPhotoUrl = photoUrl;
          }
        }

        if (Object.keys(patchData).length > 1) { // More than just lastSyncedAt
          await writeClient.patch(existing._id).set(patchData).commit();
          results.updated++;
        } else {
          // Only lastSyncedAt changed, still mark as synced
          await writeClient.patch(existing._id).set({ lastSyncedAt: patchData.lastSyncedAt }).commit();
          results.skipped++;
        }
      }
    } catch (error) {
      const msg = `Error processing ${agent.first_name} ${agent.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      results.errors.push(msg);
    }
  }

  // Deactivate members whose realogyId is no longer in any configured office
  if (!results.timedOut) {
    for (const member of existingMembers) {
      if (member.realogyId && !processedRealogyIds.has(member.realogyId) && !member.inactive) {
        try {
          await writeClient.patch(member._id).set({ inactive: true }).commit();
          results.deactivated++;
        } catch (error) {
          console.error(`Error deactivating ${member.name}:`, error);
        }
      }
    }
  }

  return results;
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get('preview');

  // Preview mode — no auth required, returns what would happen
  if (preview === 'true') {
    try {
      const config = await getTeamSyncConfig();

      if (!config.enabled || config.offices.length === 0) {
        return NextResponse.json({ message: 'Team sync is disabled or no offices configured', agents: [] });
      }

      if (!isRealogyConfigured()) {
        return NextResponse.json({ error: 'Realogy database not configured' }, { status: 503 });
      }

      const officeIds = config.offices.map((o) => o.officeId);
      const [realogyAgents, existingMembers] = await Promise.all([
        fetchAgentsForOffices(officeIds),
        fetchExistingSyncedMembers(),
      ]);

      const existingByRealogyId = new Map<string, SanityTeamMember>();
      for (const member of existingMembers) {
        if (member.realogyId) {
          existingByRealogyId.set(member.realogyId, member);
        }
      }

      const processedIds = new Set(realogyAgents.map(getAgentRealogyId));

      const toAdd = realogyAgents
        .filter((a) => !existingByRealogyId.has(getAgentRealogyId(a)))
        .map((a) => ({ name: `${a.first_name} ${a.last_name}`, realogyId: getAgentRealogyId(a), office: a.office_name }));

      const toUpdate = realogyAgents
        .filter((a) => existingByRealogyId.has(getAgentRealogyId(a)))
        .map((a) => ({ name: `${a.first_name} ${a.last_name}`, realogyId: getAgentRealogyId(a), office: a.office_name }));

      const toDeactivate = existingMembers
        .filter((m) => m.realogyId && !processedIds.has(m.realogyId) && !m.inactive)
        .map((m) => ({ name: m.name, realogyId: m.realogyId }));

      return NextResponse.json({
        config: { offices: config.offices, defaultOrder: config.defaultOrder },
        totalAgentsInOffices: realogyAgents.length,
        existingSyncedMembers: existingMembers.length,
        preview: {
          toAdd: toAdd.length,
          toUpdate: toUpdate.length,
          toDeactivate: toDeactivate.length,
          agents: { add: toAdd, update: toUpdate, deactivate: toDeactivate },
        },
      });
    } catch (error) {
      console.error('Preview error:', error);
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }
  }

  // Cron execution — requires authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await executeSync();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Team sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await executeSync();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Team sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
