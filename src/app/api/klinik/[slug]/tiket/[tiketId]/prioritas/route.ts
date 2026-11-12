import { z } from "zod";
import { bacaBody, tanganiGalat, wajibRemote } from "@/lib/api";
import { setPrioritas } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";
import { AlasanPrioritas } from "@/lib/skema";

const Body = z.object({ alasanPrioritas: AlasanPrioritas });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; tiketId: string }> },
) {
  const { slug, tiketId } = await params;
  const sesi = await wajibRemote(slug);
  if (!sesi.ok) return sesi.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    return berhasil(setPrioritas(sesi.data.klinikId, tiketId, body.data.alasanPrioritas));
  } catch (err) {
    return tanganiGalat(err);
  }
}
