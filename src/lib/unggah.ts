// Browser upload flow (API §4): ask for a signed URL, then send the file straight
// to it with progress reporting. With Supabase only the PUT target changes.
import { api } from "@/lib/klien";

export const BATAS = {
  video: { tipeMime: ["video/mp4"], maksMb: 50 },
  gambar: { tipeMime: ["image/jpeg", "image/png", "image/webp"], maksMb: 5 },
} as const;

export type TipeUnggah = keyof typeof BATAS;

/** Same rules as the server, checked first so the admin gets instant feedback. */
export function cekFileLokal(file: File, tipe: TipeUnggah): string | null {
  const aturan = BATAS[tipe];
  if (!(aturan.tipeMime as readonly string[]).includes(file.type)) {
    return tipe === "video" ? "Video harus MP4 (H.264)." : "Gambar harus JPG, PNG, atau WebP.";
  }
  if (file.size > aturan.maksMb * 1024 * 1024) {
    return `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)} MB, maksimal ${aturan.maksMb} MB.`;
  }
  return null;
}

export async function unggahFile(
  file: File,
  tipe: TipeUnggah,
  onProgres: (persen: number) => void,
): Promise<{ ok: true; path: string } | { ok: false; pesan: string }> {
  const izin = await api<{ path: string; signedUrl: string }>("/api/cms/konten/url-unggah", {
    method: "POST",
    body: { namaFile: file.name, tipe, ukuranByte: file.size },
  });
  if (!izin.ok) return { ok: false, pesan: izin.error.pesan };

  return new Promise((selesai) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", izin.data.signedUrl);
    xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgres(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? selesai({ ok: true, path: izin.data.path })
        : selesai({ ok: false, pesan: "Unggah gagal. Coba lagi." });
    xhr.onerror = () => selesai({ ok: false, pesan: "Koneksi terputus saat mengunggah." });
    xhr.send(file);
  });
}
