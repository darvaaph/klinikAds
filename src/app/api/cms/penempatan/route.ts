import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { buatPenempatan, daftarPenempatan } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";

export const dynamic = "force-dynamic";

const Tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const Body = z
  .object({
    kontenId: z.string().min(1),
    klinikIds: z.array(z.string().min(1)).min(1, "Pilih minimal satu klinik"),
    mulai: Tanggal,
    selesai: Tanggal,
    bobot: z.number().int().min(1).max(10),
  })
  .refine((p) => p.selesai >= p.mulai, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["selesai"],
  });

export async function GET(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const klinikId = new URL(req.url).searchParams.get("klinikId") || undefined;
  return berhasil(daftarPenempatan(klinikId));
}

export async function POST(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(buatPenempatan(body.data), 201);
  } catch (err) {
    return tanganiGalat(err);
  }
}
