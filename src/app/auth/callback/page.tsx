'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

type CallbackStatus = 'pending' | 'success' | 'error';

// Landing page Supabase redirects to after the user clicks the
// confirmation link in their signup email. Supabase has already
// exchanged the token by the time we get here (modern PKCE flow
// happens via the URL hash + Supabase's auth listener), so we just
// give the user feedback and route them on.
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('pending');
  const [message, setMessage] = useState<string>('Confirming your account…');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus('error');
      setMessage('Authentication is not configured for this site.');
      return;
    }

    const errParam = params.get('error_description') || params.get('error');
    if (errParam) {
      setStatus('error');
      setMessage(decodeURIComponent(errParam));
      return;
    }

    let resolved = false;
    const fireSignupNotification = async (accessToken: string) => {
      // Fire-and-forget: tell the server a user has finished verifying,
      // so it can record a lead + email the site owner. Idempotent.
      try {
        await fetch('/api/auth/signup-notification', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (err) {
        console.error('signup notification call failed:', err);
      }
    };
    const finish = (nextStatus: CallbackStatus, nextMessage: string) => {
      if (resolved) return;
      resolved = true;
      setStatus(nextStatus);
      setMessage(nextMessage);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        finish('error', error.message || 'Could not confirm your account.');
        return;
      }
      if (data.session) {
        fireSignupNotification(data.session.access_token);
        finish('success', 'Your email is confirmed. Redirecting…');
        setTimeout(() => router.replace('/'), 1500);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fireSignupNotification(session.access_token);
        finish('success', 'Your email is confirmed. Redirecting…');
        setTimeout(() => router.replace('/'), 1500);
      }
    });

    const timeout = window.setTimeout(() => {
      finish(
        'error',
        'We could not confirm your account from this link. The link may have expired or already been used.'
      );
    }, 6000);

    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [params, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        {status === 'pending' && (
          <div
            className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin"
            aria-hidden="true"
          />
        )}
        {status === 'success' && (
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M5.07 19h13.86A2 2 0 0020.66 17l-6.93-12a2 2 0 00-3.46 0L3.34 17A2 2 0 005.07 19z" />
            </svg>
          </div>
        )}

        <h1 className="font-serif text-2xl text-[var(--color-sothebys-blue)] mb-3">
          {status === 'success' ? 'Account confirmed' : status === 'error' ? 'Confirmation failed' : 'Confirming…'}
        </h1>
        <p className="text-[#4a4a4a] mb-8">{message}</p>

        {status === 'error' && (
          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="px-5 py-2.5 text-sm border border-[var(--color-sothebys-blue)] text-[var(--color-sothebys-blue)] hover:bg-[var(--color-sothebys-blue)] hover:text-white transition-colors"
            >
              Go home
            </Link>
            <Link
              href="/?signup=1"
              className="px-5 py-2.5 text-sm bg-[var(--color-sothebys-blue)] text-white hover:bg-[var(--color-sothebys-blue)]/90 transition-colors"
            >
              Try signing up again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div
            className="h-10 w-10 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin"
            aria-hidden="true"
          />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
