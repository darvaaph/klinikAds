import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { infoFile, mimeDari } from "@/lib/data/unggahan";

export const runtime = "nodejs";

/**
 * Serves uploaded media (public, like the Supabase `konten` bucket). Supports HTTP
 * Range requests, which TV browsers use to stream and seek MP4 video.
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const filePath = (await params).path.join("/");
  const info = await infoFile(filePath);
  const mime = mimeDari(filePath);
  if (!info || !mime) return new Response("Tidak ditemukan", { status: 404 });

  const dasar = {
    "content-type": mime,
    "accept-ranges": "bytes",
    // Upload paths are random UUIDs and never overwritten, so they can be cached for long.
    "cache-control": "public, max-age=31536000, immutable",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (!range) {
    const aliran = Readable.toWeb(createReadStream(info.lokasi)) as ReadableStream;
    return new Response(aliran, { headers: { ...dasar, "content-length": String(info.ukuran) } });
  }

  let awal = range[1] ? Number(range[1]) : NaN;
  let akhir = range[2] ? Number(range[2]) : info.ukuran - 1;
  if (Number.isNaN(awal)) {
    // "bytes=-500": the last 500 bytes.
    awal = Math.max(0, info.ukuran - akhir);
    akhir = info.ukuran - 1;
  }
  akhir = Math.min(akhir, info.ukuran - 1);
  if (awal > akhir || awal >= info.ukuran) {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${info.ukuran}` },
    });
  }

  const aliran = Readable.toWeb(
    createReadStream(info.lokasi, { start: awal, end: akhir }),
  ) as ReadableStream;
  return new Response(aliran, {
    status: 206,
    headers: {
      ...dasar,
      "content-length": String(akhir - awal + 1),
      "content-range": `bytes ${awal}-${akhir}/${info.ukuran}`,
    },
  });
}
