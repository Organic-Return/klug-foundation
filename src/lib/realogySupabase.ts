import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _realogy: SupabaseClient | null = null;
let _initialized = false;

export function isRealogyConfigured(): boolean {
  return !!(process.env.REALOGY_SUPABASE_URL && process.env.REALOGY_SUPABASE_ANON_KEY);
}

export function getRealogySupabase(): SupabaseClient | null {
  if (!_initialized) {
    _initialized = true;
    const url = process.env.REALOGY_SUPABASE_URL;
    const key = process.env.REALOGY_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return null;
    }

    _realogy = createClient(url, key, {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, next: { revalidate: 60 } } as any),
      },
    });
  }
  return _realogy;
}

// Convenience export — lazily initialized
export const realogySupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getRealogySupabase();
    if (!client) {
      throw new Error('Realogy Supabase is not configured. Set REALOGY_SUPABASE_URL and REALOGY_SUPABASE_ANON_KEY.');
    }
    return (client as any)[prop];
  },
});
