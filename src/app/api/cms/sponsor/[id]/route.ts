import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { ubahSponsor } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";
import { LogoUnggahan } from "@/lib/skema";

const Body = z
  .object({
    nama: z.string().trim().min(2).max(80),
    kategori: z.enum(["bank", "farmasi_otc", "fmcg", "penunjang_medis"]),
    kontak: z.string().trim().max(120).nullable(),
    logoUrl: LogoUnggahan.nullable(),
  })
  .partial();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(ubahSponsor((await params).id, body.data));
  } catch (err) {
    return tanganiGalat(err);
  }
}
