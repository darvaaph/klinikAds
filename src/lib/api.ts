// Shared plumbing for route handlers: body validation, session checks, error mapping.
import { cookies, headers } from "next/headers";
import type { z } from "zod";
import { GalatData } from "@/lib/data/galat";
import { gagal } from "@/lib/respons";
import {
  bacaSesiAdmin,
  bacaSesiRemote,
  COOKIE_ADMIN,
  COOKIE_REMOTE,
  type SesiRemote,
} from "@/lib/session";

export type Hasil<T> = { ok: true; data: T } | { ok: false; respons: Response };

/** Parses the JSON body with `skema`; 400 VALIDASI_GAGAL with per-field detail on failure. */
export async function bacaBody<T extends z.ZodTypeAny>(
  req: Request,
  skema: T,
): Promise<Hasil<z.infer<T>>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, respons: gagal("VALIDASI_GAGAL", { pesan: "Body harus JSON." }) };
  }
  const hasil = skema.safeParse(json);
  if (!hasil.success) {
    return {
      ok: false,
      respons: gagal("VALIDASI_GAGAL", { detail: hasil.error.flatten().fieldErrors }),
    };
  }
  return { ok: true, data: hasil.data };
}

/** Remote session for this slug: 401 BELUM_LOGIN or 403 BUKAN_KLINIK_ANDA otherwise. */
export async function wajibRemote(slug: string): Promise<Hasil<SesiRemote>> {
  const sesi = await bacaSesiRemote((await cookies()).get(COOKIE_REMOTE)?.value);
  if (!sesi) return { ok: false, respons: gagal("BELUM_LOGIN") };
  if (sesi.slug !== slug) return { ok: false, respons: gagal("BUKAN_KLINIK_ANDA") };
  return { ok: true, data: sesi };
}

export async function wajibAdmin(): Promise<Hasil<true>> {
  const sesi = await bacaSesiAdmin((await cookies()).get(COOKIE_ADMIN)?.value);
  return sesi ? { ok: true, data: true } : { ok: false, respons: gagal("BELUM_LOGIN") };
}

/** Maps domain errors to their API code; anything else is logged and becomes a 500. */
export function tanganiGalat(err: unknown) {
  if (err instanceof GalatData) return gagal(err.kode);
  console.error(err);
  return gagal("KESALAHAN_SERVER");
}

/** Client IP for rate limiting (first hop of x-forwarded-for, as set by Vercel). */
export async function ipKlien(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "lokal";
}
