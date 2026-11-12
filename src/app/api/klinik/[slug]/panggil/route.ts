import { z } from "zod";
import { bacaBody, tanganiGalat, wajibRemote } from "@/lib/api";
import { panggilBerikutnya } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";
import { Id } from "@/lib/skema";

const Body = z.object({ poliId: Id });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const sesi = await wajibRemote((await params).slug);
  if (!sesi.ok) return sesi.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(panggilBerikutnya(sesi.data.klinikId, body.data.poliId));
  } catch (err) {
    return tanganiGalat(err);
  }
}
