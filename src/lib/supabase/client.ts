import { createClient } from '@supabase/supabase-js';

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

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
