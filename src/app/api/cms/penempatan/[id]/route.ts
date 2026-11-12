import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { hapusPenempatan, ubahPenempatan } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";

const Tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const Body = z
  .object({
    mulai: Tanggal,
    selesai: Tanggal,
    bobot: z.number().int().min(1).max(10),
    persetujuanKlinik: z.enum(["menunggu", "disetujui", "ditolak"]),
  })
  .partial();

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(ubahPenempatan((await params).id, body.data));
  } catch (err) {
    return tanganiGalat(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  try {
    return berhasil(hapusPenempatan((await params).id));
  } catch (err) {
    return tanganiGalat(err);
  }
}
