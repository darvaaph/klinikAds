import { wajibAdmin } from "@/lib/api";
import { daftarKlinik } from "@/lib/data/cms";
import { berhasil } from "@/lib/respons";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;
  return berhasil(daftarKlinik());
}
