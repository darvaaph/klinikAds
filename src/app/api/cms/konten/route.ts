import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { buatKonten, daftarKonten } from "@/lib/data/cms";
import { infoFile } from "@/lib/data/unggahan";
import { berhasil, gagal } from "@/lib/respons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z
  .object({
    judul: z.string().trim().min(3).max(120),
    tipe: z.enum(["video", "gambar", "teks_berjalan"]),
    kategori: z.enum(["iklan_sponsor", "edukasi", "promo_klinik", "info"]),
    filePath: z.string().max(200).nullable(),
    teks: z.string().trim().min(3).max(140).nullable(),
    durasiDetik: z.number().int().min(5).max(120),
    sponsorId: z.string().nullable(),
    produkObatSuplemen: z.boolean(),
    izinEdarBpom: z.string().trim().max(60).nullable(),
  })
  // Mirrors the CHECK constraints on konten (DB §4).
  .refine((k) => (k.tipe === "teks_berjalan") === (k.teks !== null), {
    message: "Running text wajib berisi teks, file tidak.",
    path: ["teks"],
  })
  .refine((k) => k.tipe === "teks_berjalan" || k.filePath !== null, {
    message: "Video/gambar wajib punya file.",
    path: ["filePath"],
  });

export async function GET(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const q = new URL(req.url).searchParams;
  const aktif = q.get("aktif");
  return berhasil(
    daftarKonten({
      kategori: q.get("kategori") || undefined,
      aktif: aktif === null || aktif === "" ? undefined : aktif === "true",
    }),
  );
}

export async function POST(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  // Checked before validation errors, so the form shows the BPOM rule by name (US-007).
  if (body.data.produkObatSuplemen && !body.data.izinEdarBpom) return gagal("IZIN_BPOM_WAJIB");
  if (body.data.filePath && !(await infoFile(body.data.filePath))) {
    return gagal("VALIDASI_GAGAL", { pesan: "File belum selesai diunggah." });
  }
  try {
    return berhasil(buatKonten(body.data), 201);
  } catch (err) {
    return tanganiGalat(err);
  }
}
