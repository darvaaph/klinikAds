import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { envSupabase } from "@/lib/env";

let klien: SupabaseClient | null = null;

/**
 * Supabase client with the service role (secret) key. Bypasses RLS, so it may only
 * run on the server: `server-only` makes the build fail if a client component imports it.
 */
export function supabaseServer(): SupabaseClient {
  if (!klien) {
    const e = envSupabase();
    klien = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return klien;
}
