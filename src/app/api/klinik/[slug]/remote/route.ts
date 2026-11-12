import { tanganiGalat, wajibRemote } from "@/lib/api";
import { ambilRemote } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const sesi = await wajibRemote((await params).slug);
  if (!sesi.ok) return sesi.respons;
  try {
    return berhasil(ambilRemote(sesi.data.klinikId));
  } catch (err) {
    return tanganiGalat(err);
  }
}
