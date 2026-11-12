// Signed httpOnly cookie sessions for the prototype (04-API.md §1.1). Server-side only.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_REMOTE = "lk_remote";
export const COOKIE_ADMIN = "lk_admin";
export const DURASI_SESI_DETIK = 12 * 60 * 60;

export type SesiRemote = { klinikId: string; slug: string };
export type SesiAdmin = { peran: "admin_pusat" };

function kunci(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET wajib diisi, minimal 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

async function tandaTangan(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURASI_SESI_DETIK}s`)
    .sign(kunci());
}

/** Returns the payload, or null if the token is missing, tampered with, or expired. */
async function verifikasi(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export function buatSesiRemote(sesi: SesiRemote) {
  return tandaTangan({ klinikId: sesi.klinikId, slug: sesi.slug });
}

export async function bacaSesiRemote(token: string | undefined): Promise<SesiRemote | null> {
  const p = await verifikasi(token);
  if (typeof p?.klinikId !== "string" || typeof p.slug !== "string") return null;
  return { klinikId: p.klinikId, slug: p.slug };
}

export function buatSesiAdmin() {
  return tandaTangan({ peran: "admin_pusat" });
}

export async function bacaSesiAdmin(token: string | undefined): Promise<SesiAdmin | null> {
  const p = await verifikasi(token);
  return p?.peran === "admin_pusat" ? { peran: "admin_pusat" } : null;
}

export const OPSI_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURASI_SESI_DETIK,
};
