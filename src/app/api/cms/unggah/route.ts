import { wajibAdmin } from "@/lib/api";
import { ATURAN_FILE, izinSah, mimeDari, simpanFile } from "@/lib/data/unggahan";
import { berhasil, gagal } from "@/lib/respons";

export const runtime = "nodejs";

/** Target of the signed upload URL from POST /api/cms/konten/url-unggah. */
export async function PUT(req: Request) {
  const admin = await wajibAdmin();
  if (!admin.ok) return admin.respons;

  const url = new URL(req.url);
  const filePath = url.searchParams.get("path") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!izinSah(filePath, token)) return gagal("UNGGAH_DITOLAK");

  const mime = mimeDari(filePath);
  const maks = mime === "video/mp4" ? ATURAN_FILE.video.maksByte : ATURAN_FILE.gambar.maksByte;
  const panjang = Number(req.headers.get("content-length") ?? "0");
  if (panjang > maks) return gagal("VALIDASI_GAGAL", { pesan: "File terlalu besar." });

  const isi = new Uint8Array(await req.arrayBuffer());
  if (isi.byteLength === 0 || isi.byteLength > maks) {
    return gagal("VALIDASI_GAGAL", { pesan: "Ukuran file tidak sesuai aturan." });
  }
  await simpanFile(filePath, isi);
  return berhasil({ path: filePath });
}
