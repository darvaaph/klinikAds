import { z } from "zod";
import { bacaBody, tanganiGalat, wajibRemote } from "@/lib/api";
import { ambilNomor } from "@/lib/data/antrian";
import { berhasil } from "@/lib/respons";
import { AlasanPrioritas, Id, Penjamin } from "@/lib/skema";

const Body = z.object({
  poliId: Id,
  penjamin: Penjamin.nullish(),
  alasanPrioritas: AlasanPrioritas.nullish(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const sesi = await wajibRemote((await params).slug);
  if (!sesi.ok) return sesi.respons;
  const body = await bacaBody(req, Body);
  if (!body.ok) return body.respons;
  try {
    const { poliId, penjamin, alasanPrioritas } = body.data;
    return berhasil(
      ambilNomor(sesi.data.klinikId, poliId, penjamin ?? null, alasanPrioritas ?? null),
      201,
    );
  } catch (err) {
    return tanganiGalat(err);
  }
}
