// Server-side reCAPTCHA Enterprise verification.
//
// Calls Google's Assessment API and decides whether a form submission's token
// passes: the token must be valid and its risk score at or above the threshold.
//
// Fail-OPEN when unconfigured or on transient API/network errors, so we never
// silently drop real leads. Spam is only blocked once the server env vars are
// present AND Google returns a valid low-score (or invalid) verdict.
//
// Env vars (set in Vercel):
//   NEXT_PUBLIC_RECAPTCHA_SITE_KEY  – public site key (also used client-side)
//   RECAPTCHA_PROJECT_ID            – Google Cloud project id for the key
//   RECAPTCHA_API_KEY               – API key with reCAPTCHA Enterprise access
//   RECAPTCHA_MIN_SCORE             – optional, default 0.5 (0.0 bot … 1.0 human)

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID;
const API_KEY = process.env.RECAPTCHA_API_KEY;
const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');

export function isRecaptchaConfigured(): boolean {
  return Boolean(SITE_KEY && PROJECT_ID && API_KEY);
}

export interface RecaptchaResult {
  success: boolean;
  score?: number;
  reason?: string;
}

/**
 * Verify a reCAPTCHA Enterprise token. `expectedAction` is used to detect token
 * reuse across actions — a mismatch is logged but not rejected, so a stray
 * action string can never block a genuine visitor.
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
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: { token, siteKey: SITE_KEY, expectedAction },
        }),
      }
    );

    if (!res.ok) {
      // Google outage / quota — fail open rather than lose the lead.
      console.error('[recaptcha] assessment HTTP', res.status);
      return { success: true, reason: `api_error_${res.status}` };
    }

    const data = await res.json();
    const valid = data?.tokenProperties?.valid === true;
    const action = data?.tokenProperties?.action;
    const score = data?.riskAnalysis?.score;

    if (!valid) {
      const invalidReason = data?.tokenProperties?.invalidReason || 'unknown';
      return { success: false, score, reason: `invalid_token:${invalidReason}` };
    }
    if (expectedAction && action && action !== expectedAction) {
      // Log only — don't block on an action-string mismatch.
      console.warn(`[recaptcha] action mismatch: got "${action}" expected "${expectedAction}"`);
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
