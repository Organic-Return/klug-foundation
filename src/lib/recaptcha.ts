// Server-side reCAPTCHA verification.
//
// Verifies a form submission's token against Google's siteverify endpoint using
// the key's secret key, then decides whether it passes: the token must be valid
// and its risk score at or above the threshold.
//
// This uses the "legacy" secret-key flow, which works with score-based
// reCAPTCHA Enterprise website keys (the secret key shown in the reCAPTCHA
// console under "Use this only if integrating with third-party services").
// No Google Cloud API key or project id is required.
//
// Fail-OPEN when unconfigured or on transient API/network errors, so we never
// silently drop real leads. Spam is only blocked once RECAPTCHA_SECRET_KEY is
// present AND Google returns a valid low-score (or invalid) verdict.
//
// Env vars (set in Vercel):
//   NEXT_PUBLIC_RECAPTCHA_SITE_KEY  – public site key (also used client-side)
//   RECAPTCHA_SECRET_KEY            – the key's secret key (server-side only)
//   RECAPTCHA_MIN_SCORE             – optional, default 0.5 (0.0 bot … 1.0 human)

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export function isRecaptchaConfigured(): boolean {
  return Boolean(SECRET_KEY);
}

export interface RecaptchaResult {
  success: boolean;
  score?: number;
  reason?: string;
}

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA token. `expectedAction` is used to detect token reuse
 * across actions — a mismatch is logged but not rejected, so a stray action
 * string can never block a genuine visitor.
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
  expectedAction: string
): Promise<RecaptchaResult> {
  // Not wired up yet → let submissions through.
  if (!isRecaptchaConfigured()) {
    return { success: true, reason: 'not_configured' };
  }
  if (!token) {
    return { success: false, reason: 'missing_token' };
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: SECRET_KEY as string,
        response: token,
      }).toString(),
    });

    if (!res.ok) {
      // Google outage / quota — fail open rather than lose the lead.
      console.error('[recaptcha] siteverify HTTP', res.status);
      return { success: true, reason: `api_error_${res.status}` };
    }

    const data = (await res.json()) as SiteVerifyResponse;
    const score = data.score;

    if (!data.success) {
      const codes = (data['error-codes'] || []).join(',') || 'unknown';
      return { success: false, score, reason: `invalid_token:${codes}` };
    }
    if (expectedAction && data.action && data.action !== expectedAction) {
      // Log only — don't block on an action-string mismatch.
      console.warn(`[recaptcha] action mismatch: got "${data.action}" expected "${expectedAction}"`);
    }
    if (typeof score === 'number' && score < MIN_SCORE) {
      return { success: false, score, reason: 'low_score' };
    }
    return { success: true, score };
  } catch (err) {
    console.error('[recaptcha] verify failed:', err);
    return { success: true, reason: 'exception' };
  }
}
