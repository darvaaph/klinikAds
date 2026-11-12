// In-memory stand-in for the Supabase tables in 03-DATABASE.md §4 (see docs/KEPUTUSAN.md,
// "Frontend dulu"). Field names mirror the DB columns in camelCase so the swap to Supabase
// only touches src/lib/data/. Data resets whenever the server restarts.
import { buatDataContoh } from "./contoh";

export type StatusTiket = "menunggu" | "dipanggil" | "dilayani" | "selesai" | "tidak_hadir";
export type AlasanPrioritas = "lansia" | "ibu_hamil" | "disabilitas" | "darurat";
export type Penjamin = "bpjs" | "umum" | "asuransi_lain";

export type Klinik = {
  id: string;
  slug: string;
  nama: string;
  warnaUtama: string;
  logoUrl: string | null;
  modeTampilan: "otomatis" | "kartu" | "daftar";
  pinRemoteHash: string;
  playlistVersi: number;
};

export type Poli = {
  id: string;
  klinikId: string;
  nama: string;
  kodeHuruf: string;
  ruang: string;
  urutan: number;
  aktif: boolean;
};

export type Tiket = {
  id: string;
  klinikId: string;
  poliId: string;
  tanggal: string; // YYYY-MM-DD, Asia/Jakarta
  nomorUrut: number;
  kode: string;
  status: StatusTiket;
  prioritas: boolean;
  alasanPrioritas: AlasanPrioritas | null;
  penjamin: Penjamin | null; // secret: never leaves the server
  jumlahPanggil: number;
  dibuatPada: Date;
  dipanggilPada: Date | null;
};

export type Panggilan = {
  id: string;
  klinikId: string;
  poliId: string;
  tiketId: string;
  kode: string;
  jenis: "baru" | "ulang";
  dibuatPada: Date;
};

export type Konten = {
  id: string;
  judul: string;
  tipe: "video" | "gambar" | "teks_berjalan";
  kategori: "iklan_sponsor" | "edukasi" | "promo_klinik" | "info";
  // "/contoh/…" = sample file in /public; otherwise a path in the upload store
  // (served by /api/media until Supabase Storage replaces it).
  filePath: string | null;
  teks: string | null;
  durasiDetik: number;
  aktif: boolean;
  sponsorId: string | null;
  produkObatSuplemen: boolean;
  izinEdarBpom: string | null;
  dibuatPada: Date;
};

export type Sponsor = {
  id: string;
  nama: string;
  kategori: string; // 'bank','farmasi_otc','fmcg','penunjang_medis'
  kontak: string | null;
  /** Shown in the TV strip "Dipersembahkan oleh". Optional. */
  logoUrl: string | null;
};

export type LogTayang = {
  klinikId: string;
  kontenId: string;
  mulaiPada: Date;
  durasiDetik: number;
};

export type Penempatan = {
  id: string;
  kontenId: string;
  klinikId: string;
  mulai: string; // YYYY-MM-DD
  selesai: string;
  bobot: number;
  persetujuanKlinik: "menunggu" | "disetujui" | "ditolak";
};

export type Store = {
  klinik: Klinik[];
  poli: Poli[];
  tiket: Tiket[];
  panggilan: Panggilan[];
  konten: Konten[];
  penempatan: Penempatan[];
  sponsor: Sponsor[];
  logTayang: LogTayang[];
};

// Kept on globalThis so dev hot-reload and every route handler share one instance.
const g = globalThis as unknown as { __layarKlinikStore?: Store };

export function store(): Store {
  g.__layarKlinikStore ??= buatDataContoh(new Date());
  return g.__layarKlinikStore;
}

/** Equivalent of reset_demo: rebuild the sample data from scratch. */
export function resetStore(sekarang = new Date()): Store {
  g.__layarKlinikStore = buatDataContoh(sekarang);
  return g.__layarKlinikStore;
}
