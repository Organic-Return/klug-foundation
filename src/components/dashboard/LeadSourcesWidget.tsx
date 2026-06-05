'use client';

import { useState, useEffect } from 'react';

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

interface SourcesResponse {
  period_days: number;
  total: number;
  bySource: SourceBreakdownRow[];
  byCampaign: CampaignRow[];
}

interface LeadSourcesWidgetProps {
  token: string | null;
}

const BUCKET_COLORS: Record<string, string> = {
  'Paid Search': 'bg-blue-500',
  'Paid Social': 'bg-indigo-500',
  'Organic Search': 'bg-green-500',
  'Referral': 'bg-purple-500',
  'Direct': 'bg-gray-500',
  'Email': 'bg-amber-500',
  'Other': 'bg-gray-400',
};

const WINDOW_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export default function LeadSourcesWidget({ token }: LeadSourcesWidgetProps) {
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/dashboard/leads/sources?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load source data');
        return res.json();
      })
      .then((json: SourcesResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, days]);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="h-32 animate-pulse bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-sm text-red-600">
        Could not load source breakdown: {error}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Lead Sources</h2>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="text-sm border border-gray-200 rounded px-2 py-1"
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500">No leads in the last {data?.period_days || days} days.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.bySource.map((b) => b.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Lead Sources</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.total} {data.total === 1 ? 'lead' : 'leads'} in the last {data.period_days} days
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="text-sm border border-gray-200 rounded px-2 py-1"
        >
          {WINDOW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source breakdown */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Channel</h3>
          <div className="space-y-2">
            {data.bySource.map((row) => {
              const pct = data.total ? Math.round((row.count / data.total) * 100) : 0;
              const barWidth = maxCount ? (row.count / maxCount) * 100 : 0;
              return (
                <div key={row.bucket}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700">{row.bucket}</span>
                    <span className="text-gray-500">
                      {row.count} <span className="text-gray-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${BUCKET_COLORS[row.bucket] || 'bg-gray-400'} transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top campaigns */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Top Campaigns</h3>
          {data.byCampaign.length === 0 ? (
            <p className="text-xs text-gray-500">No UTM-tagged campaigns in this window.</p>
          ) : (
            <div className="space-y-1.5">
              {data.byCampaign.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-gray-700 truncate" title={c.utm_campaign || ''}>
                      {c.utm_campaign || <span className="text-gray-400 italic">(no campaign)</span>}
                    </div>
                    <div className="text-gray-400 truncate">
                      {[c.utm_source, c.utm_medium].filter(Boolean).join(' / ') || '—'}
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
