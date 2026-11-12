// Local stand-in for Supabase Storage's bucket `konten` (API §4 url-unggah).
// Files live in .data/unggahan; the browser uploads with a short-lived signed URL,
// exactly like the signed upload URL flow it will use with Supabase.
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export const FOLDER_UNGGAHAN = path.join(process.cwd(), ".data", "unggahan");
const MASA_BERLAKU_MS = 15 * 60_000;

export const ATURAN_FILE = {
  video: { ekstensi: { mp4: "video/mp4" }, maksByte: 50 * 1024 * 1024 },
  gambar: {
    ekstensi: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" },
    maksByte: 5 * 1024 * 1024,
  },
} as const;

export type TipeFile = keyof typeof ATURAN_FILE;

const POLA_PATH = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(mp4|jpg|jpeg|png|webp)$/;

export function ekstensi(namaFile: string) {
  return namaFile.split(".").pop()?.toLowerCase() ?? "";
}

export function mimeDari(filePath: string): string | null {
  const ext = ekstensi(filePath);
  for (const aturan of Object.values(ATURAN_FILE)) {
    const mime = (aturan.ekstensi as Record<string, string>)[ext];
    if (mime) return mime;
  }
  return null;
}

/** Checks type and size; returns an Indonesian error message or null. */
export function cekFile(tipe: TipeFile, namaFile: string, ukuranByte: number): string | null {
  const aturan = ATURAN_FILE[tipe];
  if (!(ekstensi(namaFile) in aturan.ekstensi)) {
    return tipe === "video"
      ? "Video harus berformat MP4 (H.264)."
      : "Gambar harus berformat JPG, PNG, atau WebP.";
  }
  if (ukuranByte > aturan.maksByte) {
    return `Ukuran file maksimal ${aturan.maksByte / 1024 / 1024} MB.`;
  }
  if (ukuranByte <= 0) return "File kosong.";
  return null;
}

function tanda(isi: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(isi).digest("base64url");
}

/** Signed, expiring permission to upload exactly one file to `filePath`. */
export function buatIzinUnggah(namaFile: string, sekarang = new Date()) {
  const bulan = `${sekarang.getUTCFullYear()}/${String(sekarang.getUTCMonth() + 1).padStart(2, "0")}`;
  const filePath = `${bulan}/${crypto.randomUUID()}.${ekstensi(namaFile)}`;
  const kedaluwarsa = sekarang.getTime() + MASA_BERLAKU_MS;
  const token = `${kedaluwarsa}.${tanda(`${filePath}|${kedaluwarsa}`)}`;
  const signedUrl = `/api/cms/unggah?path=${encodeURIComponent(filePath)}&token=${token}`;
  return { path: filePath, signedUrl, token };
}

export function izinSah(filePath: string, token: string, sekarang = Date.now()): boolean {
  if (!POLA_PATH.test(filePath)) return false;
  const [kedaluwarsa, sig] = token.split(".");
  if (!kedaluwarsa || !sig || Number(kedaluwarsa) < sekarang) return false;
  const benar = Buffer.from(tanda(`${filePath}|${kedaluwarsa}`));
  const diberi = Buffer.from(sig);
  return benar.length === diberi.length && timingSafeEqual(benar, diberi);
}

export async function simpanFile(filePath: string, isi: Uint8Array) {
  const tujuan = lokasiAman(filePath);
  if (!tujuan) throw new Error("path tidak sah");
  await mkdir(path.dirname(tujuan), { recursive: true });
  await writeFile(tujuan, isi);
}

/** Absolute path inside the upload folder, or null for anything that could escape it. */
export function lokasiAman(filePath: string): string | null {
  if (!POLA_PATH.test(filePath)) return null;
  const hasil = path.resolve(FOLDER_UNGGAHAN, filePath);
  return hasil.startsWith(FOLDER_UNGGAHAN + path.sep) ? hasil : null;
}

export async function infoFile(filePath: string) {
  const lokasi = lokasiAman(filePath);
  if (!lokasi) return null;
  try {
    const s = await stat(lokasi);
    return s.isFile() ? { lokasi, ukuran: s.size } : null;
  } catch {
    return null;
  }
}
