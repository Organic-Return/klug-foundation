'use client';

// Client-side reCAPTCHA helper.
//
// Lazily injects the reCAPTCHA v3 script (only on pages where a protected form
// is actually submitted — keeps it off the critical path for everyone else) and
// returns a fresh token for the given action. Returns null when the site key is
// absent or anything fails; the server verifier decides what to do with a null
// token, so a script hiccup never hard-blocks a legitimate submission.
//
// Uses the legacy api.js render flow, whose tokens verify against the
// siteverify endpoint with the key's secret key (see src/lib/recaptcha.ts).

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('no window'));
      return;
    }
    const w = window as unknown as { grecaptcha?: unknown };
    if (w.grecaptcha) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-recaptcha-v3]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('recaptcha load error')));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-recaptcha-v3', '');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('recaptcha load error'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Returns a reCAPTCHA token for `action`, or null if reCAPTCHA is not
 * configured / unavailable. Callers should send the token to the server as
 * `recaptchaToken` in the form payload.
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null;
  try {
    await loadScript();
    const grecaptcha = (window as unknown as {
      grecaptcha?: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, opts: { action: string }) => Promise<string>;
      };
    }).grecaptcha;
    if (!grecaptcha) return null;
    return await new Promise<string | null>((resolve) => {
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(SITE_KEY, { action });
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
