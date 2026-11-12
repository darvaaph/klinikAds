import { cookies } from "next/headers";
import { z } from "zod";
import { bacaBody, ipKlien, tanganiGalat } from "@/lib/api";
import { cekPin } from "@/lib/data/pin";
import { env } from "@/lib/env";
import { berhasil, gagal } from "@/lib/respons";
import { buatSesiAdmin, COOKIE_ADMIN, OPSI_COOKIE } from "@/lib/session";
import { Pin } from "@/lib/skema";

const Body = z.object({ pin: Pin });

export async function POST(req: Request) {
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    const hasil = await cekPin(`admin:${await ipKlien()}`, body.data.pin, env().ADMIN_PIN_HASH);
    if (hasil instanceof Date) {
      return gagal("TERKUNCI", { detail: { sampai: hasil.toISOString() } });
    }
    if (hasil !== "ok") return gagal("PIN_SALAH");
    (await cookies()).set(COOKIE_ADMIN, await buatSesiAdmin(), OPSI_COOKIE);
    return berhasil({ peran: "admin_pusat" });
  } catch (err) {
    return tanganiGalat(err);
  }
}
