import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAgent } from '@/lib/dashboard-auth';
import { getSupabaseServer } from '@/lib/supabase-server';

interface SourceBreakdownRow {
  bucket: string;
  count: number;
}

interface CampaignRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  count: number;
}

/**
 * Lead-source rollup for the dashboard Sources widget.
 *
 * Returns:
 *  - bySource[]      — leads grouped into Paid Search / Paid Social / Organic
 *                       Search / Referral / Direct / Email / Other
 *  - byCampaign[]    — top 10 paid campaigns by lead count
 *  - total           — total leads in the period
 *  - period_days     — window size (default 30)
 *
 * Scoping mirrors the existing leads endpoint: admin sees all leads,
 * agents see only leads assigned to them.
 */
export async function GET(request: NextRequest) {
  const profile = await getAuthenticatedAgent(request);
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const days = Math.min(Math.max(parseInt(sp.get('days') || '30', 10), 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let query = sb
    .from('leads')
    .select('utm_source, utm_medium, utm_campaign, gclid, fbclid, msclkid, referrer')
    .gte('created_at', since);

  if (profile.role !== 'admin') {
    query = query.eq('assigned_agent_email', profile.email);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];

  // Bucketize each lead. Order of checks matters — a lead with both gclid
  // and utm_source=google is paid search, not organic.
  const buckets: Record<string, number> = {
    'Paid Search': 0,
    'Paid Social': 0,
    'Organic Search': 0,
    'Referral': 0,
    'Direct': 0,
    'Email': 0,
    'Other': 0,
  };

  const SEARCH_ENGINE_HOSTS = /(google|bing|yahoo|duckduckgo|ecosia|brave)\./i;
  const SOCIAL_HOSTS = /(facebook|instagram|t\.co|twitter|x\.com|linkedin|pinterest|tiktok|reddit)\./i;

  for (const r of rows) {
    const medium = (r.utm_medium || '').toLowerCase();
    const source = (r.utm_source || '').toLowerCase();

    if (r.gclid || r.msclkid || medium === 'cpc' || medium === 'paid' || medium === 'ppc') {
      buckets['Paid Search']++;
    } else if (r.fbclid || medium === 'paid_social' || medium === 'social-paid' || (medium === 'social' && (source === 'facebook' || source === 'instagram' || source === 'meta'))) {
      buckets['Paid Social']++;
    } else if (medium === 'organic' || (!r.utm_source && r.referrer && SEARCH_ENGINE_HOSTS.test(r.referrer))) {
      buckets['Organic Search']++;
    } else if (medium === 'email' || source === 'newsletter') {
      buckets['Email']++;
    } else if (medium === 'social' || (!r.utm_source && r.referrer && SOCIAL_HOSTS.test(r.referrer))) {
      buckets['Paid Social']++;
    } else if (r.referrer && r.referrer.length > 0) {
      buckets['Referral']++;
    } else if (!r.utm_source && !r.referrer) {
      buckets['Direct']++;
    } else {
      buckets['Other']++;
    }
  }

  const bySource: SourceBreakdownRow[] = Object.entries(buckets)
    .map(([bucket, count]) => ({ bucket, count }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  // Top campaigns — group by source/medium/campaign tuple, keep top 10.
  const campaignMap = new Map<string, CampaignRow>();
  for (const r of rows) {
    if (!r.utm_source && !r.utm_campaign) continue;
    const key = [r.utm_source || '-', r.utm_medium || '-', r.utm_campaign || '-'].join('||');
    const existing = campaignMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      campaignMap.set(key, {
        utm_source: r.utm_source,
        utm_medium: r.utm_medium,
        utm_campaign: r.utm_campaign,
        count: 1,
      });
    }
  }
  const byCampaign = Array.from(campaignMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    period_days: days,
    total: rows.length,
    bySource,
    byCampaign,
  });
}
