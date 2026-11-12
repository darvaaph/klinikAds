import { tanganiGalat } from "@/lib/api";
import { ambilPosisi } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";

export const dynamic = "force-dynamic";

// Public (no login). Returns only the ticket's position, never penjamin (API §2).
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kode = new URL(req.url).searchParams.get("kode") ?? "";
  try {
    return berhasil(ambilPosisi(slug, kode));
  } catch (err) {
    return tanganiGalat(err);
  }
}
