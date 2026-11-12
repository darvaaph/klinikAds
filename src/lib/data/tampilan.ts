// Builds the GET /api/klinik/[slug]/tampilan snapshot (04-API.md §2), mirroring
// v_tampilan_poli, v_playlist, and segarkan_status_poli from 03-DATABASE.md.
// Only whitelisted fields are copied, so penjamin and the PIN hash can never leak.
import type { Tampilan } from "@/types/api";
import { hariIni } from "@/lib/format";
import { FILE_QR_PANTAU } from "./konstanta";
import { store, type Tiket } from "./store";

/**
 * Public URL for a konten file: sample files live in /public, uploads go through /api/media.
 * The QR slide has no file; it is drawn per klinik (needs `slug`).
 */
export function urlMedia(filePath: string, slug?: string): string {
  if (filePath === FILE_QR_PANTAU) return `/api/klinik/${slug ?? "palsigunung-2"}/qr-pantau`;
  return filePath.startsWith("/") ? filePath : `/api/media/${filePath}`;
}

const JENDELA_PANGGILAN_MS = 60_000;
const MAKS_PANGGILAN = 5;

function terbaruDipanggil(a: Tiket, b: Tiket) {
  return (b.dipanggilPada?.getTime() ?? 0) - (a.dipanggilPada?.getTime() ?? 0);
}

/** Prioritas first, then creation time (same order as the DB index idx_tiket_antri). */
export function urutanAntri(a: Tiket, b: Tiket) {
  return (
    Number(b.prioritas) - Number(a.prioritas) || a.dibuatPada.getTime() - b.dibuatPada.getTime()
  );
}

/** Sponsor name + logo for the TV strip. Never contact details. */
function infoSponsor(sponsorId: string | null) {
  const sp = sponsorId ? store().sponsor.find((x) => x.id === sponsorId) : undefined;
  return { sponsorNama: sp?.nama ?? null, sponsorLogoUrl: sp?.logoUrl ?? null };
}

export function ambilTampilan(slug: string, sekarang = new Date()): Tampilan | null {
  const s = store();
  const klinik = s.klinik.find((k) => k.slug === slug);
  if (!klinik) return null;

  const tanggal = hariIni(sekarang);
  const tiketHariIni = s.tiket.filter((t) => t.klinikId === klinik.id && t.tanggal === tanggal);

  const poli = s.poli
    .filter((p) => p.klinikId === klinik.id && p.aktif)
    .sort((a, b) => a.urutan - b.urutan)
    .map((p) => {
      const milikPoli = tiketHariIni.filter((t) => t.poliId === p.id);
      const dipanggil = milikPoli.filter((t) => t.status === "dipanggil").sort(terbaruDipanggil)[0];
      const menunggu = milikPoli.filter((t) => t.status === "menunggu").sort(urutanAntri);
      return {
        poliId: p.id,
        nama: p.nama,
        kodeHuruf: p.kodeHuruf,
        ruang: p.ruang,
        kodeDipanggil: dipanggil?.kode ?? null,
        dipanggilPrioritas: dipanggil?.prioritas ?? false,
        kodeBerikutnya: menunggu[0]?.kode ?? null,
        jumlahMenunggu: menunggu.length,
      };
    });

  const kontenTayang = s.penempatan
    .filter(
      (pe) =>
        pe.klinikId === klinik.id &&
        pe.persetujuanKlinik === "disetujui" &&
        pe.mulai <= tanggal &&
        tanggal <= pe.selesai,
    )
    .flatMap((pe) => {
      const k = s.konten.find((k) => k.id === pe.kontenId && k.aktif);
      return k ? [{ k, bobot: pe.bobot }] : [];
    });

  const playlist: Tampilan["playlist"] = [];
  const runningText: string[] = [];
  for (const { k, bobot } of kontenTayang) {
    if (k.tipe === "teks_berjalan") {
      if (k.teks) runningText.push(k.teks);
    } else if (k.filePath) {
      playlist.push({
        kontenId: k.id,
        tipe: k.tipe,
        kategori: k.kategori,
        url: urlMedia(k.filePath, klinik.slug),
        durasiDetik: k.durasiDetik,
        bobot,
        ...infoSponsor(k.kategori === "iklan_sponsor" ? k.sponsorId : null),
      });
    }
  }

  // Last 60 s, at most 5, oldest first so the TV can replay them in order.
  const panggilanTerakhir = s.panggilan
    .filter(
      (p) =>
        p.klinikId === klinik.id &&
        sekarang.getTime() - p.dibuatPada.getTime() <= JENDELA_PANGGILAN_MS,
    )
    .sort((a, b) => b.dibuatPada.getTime() - a.dibuatPada.getTime())
    .slice(0, MAKS_PANGGILAN)
    .reverse()
    .map((p) => ({
      id: p.id,
      poliId: p.poliId,
      kode: p.kode,
      jenis: p.jenis,
      dibuatPada: p.dibuatPada.toISOString(),
    }));

  return {
    klinik: {
      id: klinik.id,
      slug: klinik.slug,
      nama: klinik.nama,
      warnaUtama: klinik.warnaUtama,
      logoUrl: klinik.logoUrl,
      modeTampilan: klinik.modeTampilan,
      playlistVersi: klinik.playlistVersi,
    },
    poli,
    playlist,
    runningText,
    panggilanTerakhir,
    waktuServer: sekarang.toISOString(),
  };
}
