'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSavedPropertyIds } from '@/lib/savedProperties';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/?signup=1');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getSavedPropertyIds().then((ids) => setSavedCount(ids.length));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div
          className="h-10 w-10 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin"
          aria-hidden="true"
        />
      </div>
    );
  }

  const meta = (user.user_metadata || {}) as { name?: string; full_name?: string; avatar_url?: string };
  const displayName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Member';
  const provider = (user.app_metadata as { provider?: string })?.provider || 'email';
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      <section className="pt-36 md:pt-44 pb-12 md:pb-16 bg-[var(--color-sothebys-blue)]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white text-4xl md:text-5xl mb-3">Your Account</h1>
          <p className="text-white/70 font-light">Manage your details and saved properties.</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="md:col-span-2 bg-white border border-[var(--rc-brown)]/10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              {meta.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.avatar_url}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--color-sothebys-blue)] text-white flex items-center justify-center text-xl font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-2xl text-[var(--rc-navy)]">{displayName}</h2>
                <p className="text-[var(--rc-brown)]/70 text-sm break-all">{user.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60">Member Since</dt>
                <dd className="text-[var(--rc-navy)] mt-1">{memberSince || '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60">Sign-in Method</dt>
                <dd className="text-[var(--rc-navy)] mt-1 capitalize">{provider}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60">Email</dt>
                <dd className="text-[var(--rc-navy)] mt-1 break-all">{user.email}</dd>
              </div>
            </dl>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Link
              href="/saved-properties"
              className="block bg-white border border-[var(--rc-brown)]/10 p-6 hover:border-[var(--color-gold)] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">Saved Properties</p>
              <p className="font-serif text-3xl text-[var(--rc-navy)]">
                {savedCount === null ? '—' : savedCount}
              </p>
              <p className="text-xs text-[var(--rc-brown)]/60 mt-2">View &amp; manage favorites →</p>
            </Link>

            <Link
              href="/off-market"
              className="block bg-white border border-[var(--rc-brown)]/10 p-6 hover:border-[var(--color-gold)] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--rc-brown)]/60 mb-2">Off-Market</p>
              <p className="font-serif text-base text-[var(--rc-navy)]">Browse private listings</p>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                router.replace('/');
              }}
              className="w-full px-5 py-3 text-xs uppercase tracking-[0.15em] border border-[var(--rc-navy)] text-[var(--rc-navy)] hover:bg-[var(--rc-navy)] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
