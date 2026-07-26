'use client';

// Client-side reCAPTCHA Enterprise helper.
//
// Lazily injects the enterprise.js script (only on pages where a protected form
// is actually submitted — keeps it off the critical path for everyone else) and
// returns a fresh token for the given action. Returns null when the site key is
// absent or anything fails; the server verifier decides what to do with a null
// token, so a script hiccup never hard-blocks a legitimate submission.

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('no window'));
      return;
    }
    const w = window as unknown as { grecaptcha?: { enterprise?: unknown } };
    if (w.grecaptcha?.enterprise) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-recaptcha-enterprise]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('recaptcha load error')));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-recaptcha-enterprise', '');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('recaptcha load error'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Returns a reCAPTCHA Enterprise token for `action`, or null if reCAPTCHA is not
 * configured / unavailable. Callers should send the token to the server as
 * `recaptchaToken` in the form payload.
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null;
  try {
    await loadScript();
    const grecaptcha = (window as unknown as {
      grecaptcha?: {
        enterprise?: {
          ready: (cb: () => void) => void;
          execute: (siteKey: string, opts: { action: string }) => Promise<string>;
        };
      };
    }).grecaptcha;
    const enterprise = grecaptcha?.enterprise;
    if (!enterprise) return null;
    return await new Promise<string | null>((resolve) => {
      enterprise.ready(async () => {
        try {
          const token = await enterprise.execute(SITE_KEY, { action });
          resolve(token || null);
        } catch {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}
