import { z } from "zod";
import { wajibAdmin } from "@/lib/api";
import { laporanTayang } from "@/lib/data/cms";
import { berhasil, gagal } from "@/lib/respons";

export const dynamic = "force-dynamic";

const Query = z
  .object({
    klinikId: z.string().optional(),
    dari: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sampai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((q) => q.sampai >= q.dari, { message: "Rentang tanggal terbalik", path: ["sampai"] });

export async function GET(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const hasil = Query.safeParse({ ...q, klinikId: q.klinikId || undefined });
  if (!hasil.success) {
    return gagal("VALIDASI_GAGAL", { detail: hasil.error.flatten().fieldErrors });
  }
  return berhasil(laporanTayang(hasil.data));
}
