'use client';

import { useEffect } from 'react';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CLICK_ID_KEYS = ['gclid', 'fbclid', 'msclkid'] as const;
const ALL_PARAM_KEYS = [...UTM_KEYS, ...CLICK_ID_KEYS] as const;

const STORAGE_KEY = 'lead_attribution_v2';
const LEGACY_KEY = 'lead_utm_data';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredAttribution {
  data: Record<string, string>;
  ts: number;
}

function readStored(): StoredAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(data: Record<string, string>): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, ts: Date.now() } satisfies StoredAttribution)
    );
  } catch {
    // localStorage can throw in private-browsing / quota-exceeded cases
  }
}

/**
 * Captures UTM params + ad-click IDs (gclid, fbclid, msclkid) on first visit
 * and persists them in localStorage for 30 days so first-touch attribution
 * survives across sessions. New paid-click visits overwrite older first-touch
 * data (last-touch within the window wins for paid).
 */
export default function UTMCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming: Record<string, string> = {};
    for (const key of ALL_PARAM_KEYS) {
      const val = params.get(key);
      if (val) incoming[key] = val;
    }

    const hasIncomingAttribution = Object.keys(incoming).length > 0;
    const existing = readStored();

    // One-time migration: copy old sessionStorage data into the new
    // localStorage bucket so we don't lose mid-session attribution.
    if (!existing && !hasIncomingAttribution) {
      try {
        const legacy = sessionStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const legacyData = JSON.parse(legacy) as Record<string, string>;
          if (legacyData && Object.keys(legacyData).length > 0) {
            writeStored({
              ...legacyData,
              landing_page: legacyData.source_url || window.location.href,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    if (hasIncomingAttribution) {
      // Overwrite on every new attributed visit — last-touch wins inside the
      // 30-day window. Most ad platforms work this way too.
      writeStored({
        ...incoming,
        landing_page: window.location.href,
        referrer: document.referrer || '',
        first_seen_at: new Date().toISOString(),
      });
    } else if (!existing) {
      // No attribution params and nothing stored — record landing page + referrer
      // so we at least know how they got here.
      writeStored({
        landing_page: window.location.href,
        referrer: document.referrer || '',
        first_seen_at: new Date().toISOString(),
      });
    }
  }, []);

  return null;
}

/**
 * Get stored attribution data for form submissions. Returns the persisted
 * first/last-touch params plus the current page URL (overrides landing_page).
 * Safe to call from any form component — returns {} on the server.
 */
export function getUTMData(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = readStored();
  const data = stored?.data ? { ...stored.data } : {};
  // Current page wins as source_url so the agent sees the exact page the
  // lead submitted from, even if first-touch was a different landing page.
  data.source_url = window.location.href;
  return data;
}
