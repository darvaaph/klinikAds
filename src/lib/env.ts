// Server only. The `server-only` guard package is added in T-002 (needs approval: not in ARCH §1.1).
import { z } from "zod";

// Server-side settings available in the frontend phase. Supabase keys join this
// schema in T-002.
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
