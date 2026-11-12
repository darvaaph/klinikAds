import { z } from "zod";
import { store } from "@/lib/data/store";
import { gagal } from "@/lib/respons";
import { buatSlideQr } from "@/lib/slideQr";

export const dynamic = "force-dynamic";

const Slug = z.string().regex(/^[a-z0-9-]{3,40}$/);

/**
 * QR slide for the TV playlist. The QR points at /q/<slug> on the same host the TV
 * opened, so it works on the laptop's LAN IP and later on Vercel without changes.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!Slug.safeParse(slug).success) return gagal("KLINIK_TIDAK_DITEMUKAN");
  const klinik = store().klinik.find((k) => k.slug === slug);
  if (!klinik) return gagal("KLINIK_TIDAK_DITEMUKAN");

  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  const svg = await buatSlideQr({
    namaKlinik: klinik.nama,
    warna: klinik.warnaUtama,
    url: `${proto}://${host}/q/${slug}`,
  });
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store" },
  });
}
