import { z } from "zod";
import { bacaBody, wajibAdmin } from "@/lib/api";
import { buatSponsor, daftarSponsor } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";

export const dynamic = "force-dynamic";

const Body = z.object({
  nama: z.string().trim().min(2).max(80),
  kategori: z.enum(["bank", "farmasi_otc", "fmcg", "penunjang_medis"]),
  kontak: z.string().trim().max(120).nullish(),
});

export async function GET() {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  return berhasil(daftarSponsor());
}

export async function POST(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  return berhasil(buatSponsor(body.data), 201);
}
