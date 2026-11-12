// PIN attempt limiter (ARCH §7): 5 failures → locked for 5 minutes.
// Stand-in for the `percobaan_pin` table; kept in server memory for now.
import bcrypt from "bcryptjs";

export const MAKS_GAGAL = 5;
export const DURASI_KUNCI_MS = 5 * 60_000;

type Percobaan = { gagal: number; terkunciSampai: number | null };

const g = globalThis as unknown as { __layarKlinikPin?: Map<string, Percobaan> };
const catatan = () => (g.__layarKlinikPin ??= new Map());

/** Returns the lock end time if `kunci` is locked right now. */
export function terkunciSampai(kunci: string, sekarang = Date.now()): Date | null {
  const c = catatan().get(kunci);
  if (!c?.terkunciSampai) return null;
  if (c.terkunciSampai <= sekarang) {
    catatan().delete(kunci);
    return null;
  }
  return new Date(c.terkunciSampai);
}

/**
 * Checks `pin` against `hash` and records the attempt. Returns "ok", "salah", or the
 * lock end time once this failure triggers (or is already inside) a lock.
 */
export async function cekPin(
  kunci: string,
  pin: string,
  hash: string,
  sekarang = Date.now(),
): Promise<"ok" | "salah" | Date> {
  const kunciAktif = terkunciSampai(kunci, sekarang);
  if (kunciAktif) return kunciAktif;

  if (await bcrypt.compare(pin, hash)) {
    catatan().delete(kunci);
    return "ok";
  }

  const c = catatan().get(kunci) ?? { gagal: 0, terkunciSampai: null };
  c.gagal += 1;
  if (c.gagal >= MAKS_GAGAL) {
    c.gagal = 0;
    c.terkunciSampai = sekarang + DURASI_KUNCI_MS;
  }
  catatan().set(kunci, c);
  return c.terkunciSampai ? new Date(c.terkunciSampai) : "salah";
}
