import { z } from "zod";
import { bacaBody, tanganiGalat, wajibRemote } from "@/lib/api";
import { ubahStatusTiket } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";

const Body = z.object({ status: z.enum(["tidak_hadir", "selesai"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; tiketId: string }> },
) {
  const { slug, tiketId } = await params;
  const sesi = await wajibRemote(slug);
  if (!sesi.ok) return sesi.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(ubahStatusTiket(sesi.data.klinikId, tiketId, body.data.status));
  } catch (err) {
    return tanganiGalat(err);
  }
}
