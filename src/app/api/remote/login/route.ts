import { cookies } from "next/headers";
import { z } from "zod";
import { bacaBody, ipKlien, tanganiGalat } from "@/lib/api";
import { cekPin } from "@/lib/data/pin";
import { store } from "@/lib/data/store";
import { berhasil, gagal } from "@/lib/respons";
import { buatSesiRemote, COOKIE_REMOTE, OPSI_COOKIE } from "@/lib/session";
import { Pin, Slug } from "@/lib/skema";

const Body = z.object({ slug: Slug, pin: Pin });

export async function POST(req: Request) {
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  const { slug, pin } = body.data;

  try {
    const klinik = store().klinik.find((k) => k.slug === slug);
    // Same answer for an unknown slug as for a wrong PIN, so slugs cannot be probed.
    // (The fallback is a hash of random bytes: no PIN matches it.)
    const hash =
      klinik?.pinRemoteHash ?? "$2b$10$vD/5y.6AeAFUwQ68wG2peeBIpx1RzrUjcP5lEjWdstesbonctxn32";
    const hasil = await cekPin(`remote:${slug}:${await ipKlien()}`, pin, hash);

    if (hasil instanceof Date) {
      return gagal("TERKUNCI", { detail: { sampai: hasil.toISOString() } });
    }
    if (hasil !== "ok" || !klinik) return gagal("PIN_SALAH");

    (await cookies()).set(
      COOKIE_REMOTE,
      await buatSesiRemote({ klinikId: klinik.id, slug }),
      OPSI_COOKIE,
    );
    return berhasil({ klinik: { nama: klinik.nama, slug } });
  } catch (err) {
    return tanganiGalat(err);
  }
}
