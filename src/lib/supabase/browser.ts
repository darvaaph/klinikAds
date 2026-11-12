import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Next.js only inlines NEXT_PUBLIC_* values when they are read literally like this.
const Publik = z.object({
  url: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus URL"),
  anonKey: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY kosong"),
});

let klien: SupabaseClient | null = null;

/**
 * Supabase client with the anon (publishable) key, for the browser (Realtime in T-012).
 * RLS limits it to the public views; it never sees tiket_antrian or PIN hashes.
 */
export function supabaseBrowser(): SupabaseClient {
  if (!klien) {
    const e = Publik.parse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    klien = createClient(e.url, e.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return klien;
}
