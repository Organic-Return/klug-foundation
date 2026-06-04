/**
 * Client-side conversion tracking — pushes a `lead_submitted` event to
 * window.dataLayer so GTM can fire downstream tags (GA4 `generate_lead`,
 * Google Ads conversion, Facebook Pixel Lead, etc.) with full attribution
 * context.
 *
 * Call after a successful form POST, e.g.:
 *   trackLeadSubmitted({ leadType: 'property_inquiry', propertyMlsId, propertyPrice });
 */

import { getUTMData } from '@/components/UTMCapture';

export type LeadType =
  | 'contact'
  | 'property_inquiry'
  | 'schedule_tour'
  | 'general'
  | 'account_signup';

export interface LeadTrackingPayload {
  leadType: LeadType;
  inquiryType?: string;
  propertyMlsId?: string;
  propertyAddress?: string;
  propertyPrice?: number;
  // Identifiers — sent for enhanced conversions / matching.
  email?: string;
  phone?: string;
}

interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

/**
 * Push a `lead_submitted` event to GTM's dataLayer. No-op on the server
 * and when GTM isn't loaded (the dataLayer array still gets populated so
 * any later-loading tag manager will replay it).
 */
export function trackLeadSubmitted(payload: LeadTrackingPayload): void {
  if (typeof window === 'undefined') return;

  const attribution = getUTMData();
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'lead_submitted',
    lead_type: payload.leadType,
    inquiry_type: payload.inquiryType,
    property_mls_id: payload.propertyMlsId,
    property_address: payload.propertyAddress,
    // GA4 ecommerce semantics: value + currency on the conversion event
    // lets Google Ads optimize toward higher-value leads.
    value: payload.propertyPrice,
    currency: payload.propertyPrice ? 'USD' : undefined,
    // Attribution context — duplicated into the event so GTM tags can read
    // them as event-level variables without needing dataLayer scoping.
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
    msclkid: attribution.msclkid,
    page_url: attribution.source_url,
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
    // Identifiers for enhanced conversions in Google Ads + advanced matching
    // in Facebook Pixel. GTM tags should hash these client-side before send.
    user_data: payload.email || payload.phone
      ? { email: payload.email, phone_number: payload.phone }
      : undefined,
  });
}
