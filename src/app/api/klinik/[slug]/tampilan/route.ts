import { z } from "zod";
import { ambilTampilan } from "@/lib/data/tampilan";
import { berhasil, gagal } from "@/lib/respons";

export const dynamic = "force-dynamic";

const Slug = z.string().regex(/^[a-z0-9-]{3,40}$/);

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!Slug.safeParse(slug).success) return gagal("KLINIK_TIDAK_DITEMUKAN");

  try {
    const tampilan = ambilTampilan(slug);
    return tampilan ? berhasil(tampilan) : gagal("KLINIK_TIDAK_DITEMUKAN");
  } catch (err) {
    console.error("GET tampilan gagal", err);
    return gagal("KESALAHAN_SERVER");
  }
}
