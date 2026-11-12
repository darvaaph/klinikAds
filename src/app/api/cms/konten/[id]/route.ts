import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { hapusKonten, ubahKonten } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";

const Body = z
  .object({
    judul: z.string().trim().min(3).max(120),
    aktif: z.boolean(),
    durasiDetik: z.number().int().min(5).max(120),
  })
  .partial();

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(ubahKonten((await params).id, body.data));
  } catch (err) {
    return tanganiGalat(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  try {
    return berhasil(hapusKonten((await params).id));
  } catch (err) {
    return tanganiGalat(err);
  }
}
