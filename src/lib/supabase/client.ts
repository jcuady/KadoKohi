import { createClient } from '@supabase/supabase-js';
import { clearSupabaseAuthStorageSync, prepareAuthStorageSync } from './authStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Production KadoKohi Supabase project — keep MCP + .env aligned with this ref. */
export const KADO_SUPABASE_PROJECT_REF = 'idwtlujcdfnnndxmlaco';

if (import.meta.env.DEV && supabaseUrl && !supabaseUrl.includes(KADO_SUPABASE_PROJECT_REF)) {
  console.warn(
    `[kado] VITE_SUPABASE_URL (${supabaseUrl}) does not match project ${KADO_SUPABASE_PROJECT_REF}.`,
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);

// Purge tokens from other Supabase projects before GoTrue init attempts refresh.
prepareAuthStorageSync(supabaseUrl);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (supabase && typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
      clearSupabaseAuthStorageSync(supabaseUrl);
    }
  });
}
