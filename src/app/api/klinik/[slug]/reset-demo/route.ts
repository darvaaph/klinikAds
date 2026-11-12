import { z } from "zod";
import { bacaBody, tanganiGalat, wajibRemote } from "@/lib/api";
import { resetDemo } from "@/lib/data/antrian";
import { env } from "@/lib/env";
import { berhasil, gagal } from "@/lib/respons";

const Body = z.object({ konfirmasi: z.literal("RESET") });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const sesi = await wajibRemote((await params).slug);
  if (!sesi.ok) return sesi.respons;
  if (!env().MODE_DEMO) return gagal("RESET_NONAKTIF");
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(resetDemo(sesi.data.klinikId));
  } catch (err) {
    return tanganiGalat(err);
  }
}
