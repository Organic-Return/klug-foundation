'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { Lead } from '@/lib/leads';
import LeadSourcesWidget from '@/components/dashboard/LeadSourcesWidget';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'closed'];
const LEAD_TYPE_LABELS: Record<string, string> = {
  property_inquiry: 'Property Inquiry',
  schedule_tour: 'Tour Request',
  general: 'General',
  contact: 'Contact Form',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [agentName, setAgentName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/dashboard/login');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/dashboard/login');
      } else {
        setToken(session.access_token);
      }
    });
  }, [router]);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    const params = new URLSearchParams({ page: String(page) });
    if (filterStatus) params.set('status', filterStatus);
    if (filterType) params.set('leadType', filterType);

    try {
      const res = await fetch(`/api/dashboard/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push('/dashboard/login');
        return;
      }

      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setRole(data.role || '');
      setAgentName(data.agentName || '');
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, filterStatus, filterType, router]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!token) return;

    await fetch('/api/dashboard/leads', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ leadId, status: newStatus }),
    });

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/dashboard/login');
  };

  const totalPages = Math.ceil(total / 25);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {agentName && `Welcome, ${agentName}`}
            {role === 'admin' && ' (Admin)'}
            {total > 0 && ` \u2014 ${total} total lead${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-3">
          {role === 'admin' && (
            <>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                Analytics
              </button>
              <button
                onClick={() => router.push('/dashboard/users')}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                Manage Users
              </button>
            </>
          )}
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Lead Sources rollup */}
      <LeadSourcesWidget token={token} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(LEAD_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No leads found</p>
          <p className="text-gray-400 text-sm mt-1">Leads will appear here when forms are submitted on the site.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                {role === 'admin' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <>
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {lead.email}
                      </a>
                      {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {LEAD_TYPE_LABELS[lead.lead_type] || lead.lead_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {lead.property_address || '\u2014'}
                    </td>
                    {role === 'admin' && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {lead.assigned_agent_name || '\u2014'}
                      </td>
                    )}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr key={`${lead.id}-detail`}>
                      <td colSpan={role === 'admin' ? 7 : 6} className="px-4 py-4 bg-gray-50 border-l-4 border-blue-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {lead.message && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Message:</span>
                              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{lead.message}</p>
                            </div>
                          )}
                          {lead.property_mls_id && (
                            <div>
                              <span className="font-medium text-gray-700">MLS#:</span>{' '}
                              <span className="text-gray-600">{lead.property_mls_id}</span>
                            </div>
                          )}
                          {lead.property_price && (
                            <div>
                              <span className="font-medium text-gray-700">Price:</span>{' '}
                              <span className="text-gray-600">${lead.property_price.toLocaleString()}</span>
                            </div>
                          )}
                          {lead.inquiry_type && (
                            <div>
                              <span className="font-medium text-gray-700">Interest:</span>{' '}
                              <span className="text-gray-600">{lead.inquiry_type}</span>
                            </div>
                          )}
                          {lead.source && (
                            <div>
                              <span className="font-medium text-gray-700">Source:</span>{' '}
                              <span className="text-gray-600">{lead.source}</span>
                            </div>
                          )}
                          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                            <div>
                              <span className="font-medium text-gray-700">UTM:</span>{' '}
                              <span className="text-gray-600">
                                {[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ')}
                              </span>
                            </div>
                          )}
                          {(lead.gclid || lead.fbclid || lead.msclkid) && (
                            <div>
                              <span className="font-medium text-gray-700">Ad Click:</span>{' '}
                              <span className="text-gray-600 text-xs">
                                {lead.gclid && <span title="Google Ads click ID">Google: {lead.gclid.slice(0, 16)}…</span>}
                                {lead.fbclid && <span title="Facebook/Meta click ID" className="ml-2">Meta: {lead.fbclid.slice(0, 16)}…</span>}
                                {lead.msclkid && <span title="Microsoft/Bing click ID" className="ml-2">Bing: {lead.msclkid.slice(0, 16)}…</span>}
                              </span>
                            </div>
                          )}
                          {lead.source_url && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Page URL:</span>{' '}
                              <span className="text-gray-600 text-xs break-all">{lead.source_url}</span>
                            </div>
                          )}
                          {lead.landing_page && lead.landing_page !== lead.source_url && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">First Landing:</span>{' '}
                              <span className="text-gray-600 text-xs break-all">{lead.landing_page}</span>
                            </div>
                          )}
                          {lead.referrer && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Referrer:</span>{' '}
                              <span className="text-gray-600 text-xs break-all">{lead.referrer}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
