import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initialized = false;

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!_initialized) {
    _initialized = true;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        'Missing Supabase environment variables. MLS listing features will be unavailable.'
      );
      return null;
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, next: { revalidate: 60 } } as any),
      },
    });
  }
  return _supabase;
}

// Backward-compatible export — lazily initialized
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return (client as any)[prop];
  },
});
