// CMS operations (API §4) on the in-memory store. Changes to konten or penempatan
// bump `playlistVersi` of every affected klinik, like the triggers in DB §5.
import bcrypt from "bcryptjs";
import { hariIni } from "@/lib/format";
import { kontrasCukup } from "@/lib/kontras";
import { GalatData } from "./galat";
import { store, type Konten, type Penempatan } from "./store";
import { urlMedia } from "./tampilan";

function naikkanVersi(klinikIds: Iterable<string>) {
  const set = new Set(klinikIds);
  for (const k of store().klinik) if (set.has(k.id)) k.playlistVersi += 1;
}

function klinikDenganKonten(kontenId: string) {
  return store()
    .penempatan.filter((pe) => pe.kontenId === kontenId)
    .map((pe) => pe.klinikId);
}

// ---------- klinik ----------

export function daftarKlinik() {
  const s = store();
  return s.klinik.map((k) => ({
    id: k.id,
    slug: k.slug,
    nama: k.nama,
    warnaUtama: k.warnaUtama,
    logoUrl: k.logoUrl,
    modeTampilan: k.modeTampilan,
    playlistVersi: k.playlistVersi,
    jumlahPoli: s.poli.filter((p) => p.klinikId === k.id && p.aktif).length,
  }));
}

export async function ubahKlinik(
  id: string,
  data: {
    nama?: string;
    warnaUtama?: string;
    logoUrl?: string | null;
    modeTampilan?: "otomatis" | "kartu" | "daftar";
    pinRemoteBaru?: string;
  },
) {
  const klinik = store().klinik.find((k) => k.id === id);
  if (!klinik) throw new GalatData("KLINIK_TIDAK_DITEMUKAN");
  if (data.warnaUtama !== undefined && !kontrasCukup(data.warnaUtama)) {
    throw new GalatData("WARNA_KONTRAS_RENDAH");
  }
  if (data.nama !== undefined) klinik.nama = data.nama;
  if (data.warnaUtama !== undefined) klinik.warnaUtama = data.warnaUtama.toUpperCase();
  if (data.logoUrl !== undefined) klinik.logoUrl = data.logoUrl;
  if (data.modeTampilan !== undefined) klinik.modeTampilan = data.modeTampilan;
  if (data.pinRemoteBaru !== undefined) {
    klinik.pinRemoteHash = await bcrypt.hash(data.pinRemoteBaru, 10);
  }
  return daftarKlinik().find((k) => k.id === id)!;
}

// ---------- sponsor ----------

export function daftarSponsor() {
  return store().sponsor;
}

export function buatSponsor(data: { nama: string; kategori: string; kontak?: string | null }) {
  const sponsor = { id: crypto.randomUUID(), ...data, kontak: data.kontak ?? null };
  store().sponsor.push(sponsor);
  return sponsor;
}

// ---------- konten ----------

export type KontenBaru = {
  judul: string;
  tipe: Konten["tipe"];
  kategori: Konten["kategori"];
  filePath: string | null;
  teks: string | null;
  durasiDetik: number;
  sponsorId: string | null;
  produkObatSuplemen: boolean;
  izinEdarBpom: string | null;
};

export function buatKonten(data: KontenBaru) {
  if (data.produkObatSuplemen && !data.izinEdarBpom?.trim()) {
    throw new GalatData("IZIN_BPOM_WAJIB");
  }
  if (data.sponsorId && !store().sponsor.some((s) => s.id === data.sponsorId)) {
    throw new GalatData("VALIDASI_GAGAL");
  }
  const konten: Konten = {
    id: crypto.randomUUID(),
    ...data,
    izinEdarBpom: data.produkObatSuplemen ? data.izinEdarBpom!.trim() : null,
    aktif: true,
    dibuatPada: new Date(),
  };
  store().konten.push(konten);
  return { kontenId: konten.id };
}

export function daftarKonten(filter: { kategori?: string; aktif?: boolean } = {}) {
  const s = store();
  return s.konten
    .filter((k) => !filter.kategori || k.kategori === filter.kategori)
    .filter((k) => filter.aktif === undefined || k.aktif === filter.aktif)
    .sort((a, b) => b.dibuatPada.getTime() - a.dibuatPada.getTime())
    .map((k) => ({
      id: k.id,
      judul: k.judul,
      tipe: k.tipe,
      kategori: k.kategori,
      url: k.filePath ? urlMedia(k.filePath) : null,
      teks: k.teks,
      durasiDetik: k.durasiDetik,
      aktif: k.aktif,
      sponsor: s.sponsor.find((sp) => sp.id === k.sponsorId)?.nama ?? null,
      produkObatSuplemen: k.produkObatSuplemen,
      izinEdarBpom: k.izinEdarBpom,
      jumlahKlinik: new Set(klinikDenganKonten(k.id)).size,
    }));
}

export function ubahKonten(
  id: string,
  data: { judul?: string; aktif?: boolean; durasiDetik?: number },
) {
  const konten = store().konten.find((k) => k.id === id);
  if (!konten) throw new GalatData("KONTEN_TIDAK_DITEMUKAN");
  Object.assign(konten, data);
  naikkanVersi(klinikDenganKonten(id));
  return { kontenId: id };
}

export function hapusKonten(id: string) {
  const s = store();
  if (!s.konten.some((k) => k.id === id)) throw new GalatData("KONTEN_TIDAK_DITEMUKAN");
  const terdampak = klinikDenganKonten(id);
  s.konten = s.konten.filter((k) => k.id !== id);
  s.penempatan = s.penempatan.filter((pe) => pe.kontenId !== id); // on delete cascade
  s.logTayang = s.logTayang.filter((l) => l.kontenId !== id);
  naikkanVersi(terdampak);
  return { kontenId: id };
}

// ---------- penempatan ----------

export function buatPenempatan(data: {
  kontenId: string;
  klinikIds: string[];
  mulai: string;
  selesai: string;
  bobot: number;
}) {
  const s = store();
  if (!s.konten.some((k) => k.id === data.kontenId)) throw new GalatData("KONTEN_TIDAK_DITEMUKAN");
  for (const id of data.klinikIds) {
    if (!s.klinik.some((k) => k.id === id)) throw new GalatData("KLINIK_TIDAK_DITEMUKAN");
  }
  const ids: string[] = [];
  for (const klinikId of data.klinikIds) {
    // unique (konten_id, klinik_id, mulai): placing again on the same start date updates it.
    const ada = s.penempatan.find(
      (pe) => pe.kontenId === data.kontenId && pe.klinikId === klinikId && pe.mulai === data.mulai,
    );
    if (ada) {
      ada.selesai = data.selesai;
      ada.bobot = data.bobot;
      ids.push(ada.id);
      continue;
    }
    const pe: Penempatan = {
      id: crypto.randomUUID(),
      kontenId: data.kontenId,
      klinikId,
      mulai: data.mulai,
      selesai: data.selesai,
      bobot: data.bobot,
      persetujuanKlinik: "disetujui", // prototype: auto-approved (DB §4)
    };
    s.penempatan.push(pe);
    ids.push(pe.id);
  }
  naikkanVersi(data.klinikIds);
  return { penempatanIds: ids };
}

export function daftarPenempatan(klinikId?: string) {
  const s = store();
  const hari = hariIni();
  return s.penempatan
    .filter((pe) => !klinikId || pe.klinikId === klinikId)
    .map((pe) => {
      const k = s.konten.find((x) => x.id === pe.kontenId)!;
      return {
        id: pe.id,
        kontenId: k.id,
        judul: k.judul,
        teks: k.teks,
        tipe: k.tipe,
        kategori: k.kategori,
        klinikId: pe.klinikId,
        klinik: s.klinik.find((x) => x.id === pe.klinikId)?.nama ?? "",
        mulai: pe.mulai,
        selesai: pe.selesai,
        bobot: pe.bobot,
        persetujuanKlinik: pe.persetujuanKlinik,
        tayangHariIni:
          k.aktif && pe.persetujuanKlinik === "disetujui" && pe.mulai <= hari && hari <= pe.selesai,
      };
    })
    .sort((a, b) => a.klinik.localeCompare(b.klinik) || a.judul.localeCompare(b.judul));
}

export function ubahPenempatan(
  id: string,
  data: Partial<Pick<Penempatan, "mulai" | "selesai" | "bobot" | "persetujuanKlinik">>,
) {
  const pe = store().penempatan.find((p) => p.id === id);
  if (!pe) throw new GalatData("PENEMPATAN_TIDAK_DITEMUKAN");
  Object.assign(pe, data);
  if (pe.selesai < pe.mulai) throw new GalatData("VALIDASI_GAGAL");
  naikkanVersi([pe.klinikId]);
  return { penempatanId: id };
}

export function hapusPenempatan(id: string) {
  const s = store();
  const pe = s.penempatan.find((p) => p.id === id);
  if (!pe) throw new GalatData("PENEMPATAN_TIDAK_DITEMUKAN");
  s.penempatan = s.penempatan.filter((p) => p.id !== id);
  // A running text lives only through its single placement; drop the orphan konten too.
  const k = s.konten.find((x) => x.id === pe.kontenId);
  if (k?.tipe === "teks_berjalan" && !s.penempatan.some((p) => p.kontenId === k.id)) {
    s.konten = s.konten.filter((x) => x.id !== k.id);
  }
  naikkanVersi([pe.klinikId]);
  return { penempatanId: id };
}

// ---------- laporan ----------

/** Rekap `log_tayang` per konten and per day; dates are WIB, both ends inclusive. */
export function laporanTayang(filter: { klinikId?: string; dari: string; sampai: string }) {
  const s = store();
  const baris = s.logTayang.filter((l) => {
    const tgl = hariIni(l.mulaiPada);
    return (
      (!filter.klinikId || l.klinikId === filter.klinikId) &&
      filter.dari <= tgl &&
      tgl <= filter.sampai
    );
  });

  const perKontenMap = new Map<string, { tayang: number; detik: number }>();
  const perHariMap = new Map<string, number>();
  for (const l of baris) {
    const pk = perKontenMap.get(l.kontenId) ?? { tayang: 0, detik: 0 };
    pk.tayang += 1;
    pk.detik += l.durasiDetik;
    perKontenMap.set(l.kontenId, pk);
    const tgl = hariIni(l.mulaiPada);
    perHariMap.set(tgl, (perHariMap.get(tgl) ?? 0) + 1);
  }

  const perKonten = [...perKontenMap.entries()]
    .map(([kontenId, v]) => {
      const k = s.konten.find((x) => x.id === kontenId);
      return {
        kontenId,
        judul: k?.judul ?? "(konten dihapus)",
        sponsor: s.sponsor.find((sp) => sp.id === k?.sponsorId)?.nama ?? null,
        ...v,
      };
    })
    .sort((a, b) => b.tayang - a.tayang);

  // Every day in the range, zero-filled, so the chart has no gaps.
  const perHari: { tanggal: string; tayang: number }[] = [];
  for (let d = filter.dari; d <= filter.sampai; d = besok(d)) {
    perHari.push({ tanggal: d, tayang: perHariMap.get(d) ?? 0 });
    if (perHari.length > 366) break;
  }

  return {
    ringkasan: {
      totalTayang: baris.length,
      totalDetik: baris.reduce((n, l) => n + l.durasiDetik, 0),
    },
    perKonten,
    perHari,
  };
}

function besok(tanggal: string) {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
