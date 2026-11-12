import { z } from "zod";
import { bacaBody, wajibAdmin } from "@/lib/api";
import { buatIzinUnggah, cekFile } from "@/lib/data/unggahan";
import { berhasil, gagal } from "@/lib/respons";

export const runtime = "nodejs";

const Body = z.object({
  namaFile: z.string().min(1).max(200),
  tipe: z.enum(["video", "gambar"]),
  ukuranByte: z.number().int().positive(),
});

export async function POST(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;

  const masalah = cekFile(body.data.tipe, body.data.namaFile, body.data.ukuranByte);
  if (masalah) return gagal("VALIDASI_GAGAL", { pesan: masalah });
  return berhasil(buatIzinUnggah(body.data.namaFile));
}
