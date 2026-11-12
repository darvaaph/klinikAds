import { z } from "zod";
import { bacaBody, tanganiGalat, wajibAdmin } from "@/lib/api";
import { ubahKlinik } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";
import { Pin } from "@/lib/skema";

const Body = z
  .object({
    nama: z.string().trim().min(3).max(80),
    warnaUtama: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format warna #RRGGBB"),
    logoUrl: z
      .string()
      .max(300)
      .regex(/^\/api\/media\//, "Logo harus hasil unggah")
      .nullable(),
    modeTampilan: z.enum(["otomatis", "kartu", "daftar"]),
    pinRemoteBaru: Pin,
  })
  .partial();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(await ubahKlinik((await params).id, body.data));
  } catch (err) {
    return tanganiGalat(err);
  }
}
