import "server-only";
import { z } from "zod";

// Server-side settings. Validated on first use; a missing value stops the request
// with a clear message instead of failing somewhere deeper.
const Env = z.object({
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET minimal 32 karakter"),
  ADMIN_PIN_HASH: z.string().regex(/^\$2[aby]\$\d{2}\$/, "ADMIN_PIN_HASH harus hash bcrypt"),
  MODE_DEMO: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

let cache: z.infer<typeof Env> | null = null;

export function env() {
  if (!cache) {
    const hasil = Env.safeParse(process.env);
    if (!hasil.success) {
      const pesan = hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Environment tidak lengkap (lihat .env.local.example): ${pesan}`);
    }
    cache = hasil.data;
  }
  return cache;
}

const EnvSupabase = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus URL project Supabase"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY kosong"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY kosong"),
});

let cacheSupabase: z.infer<typeof EnvSupabase> | null = null;

/** Supabase keys (ARCH §6.3). Separate from env() so the mock-data phase runs without them. */
export function envSupabase() {
  if (!cacheSupabase) {
    const hasil = EnvSupabase.safeParse(process.env);
    if (!hasil.success) {
      const pesan = hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Environment Supabase tidak lengkap (lihat .env.local.example): ${pesan}`);
    }
    cacheSupabase = hasil.data;
  }
  return cacheSupabase;
}
