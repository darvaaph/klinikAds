export const LABEL_KATEGORI = {
  iklan_sponsor: "Iklan sponsor",
  edukasi: "Edukasi",
  promo_klinik: "Promo klinik",
  info: "Info",
} as const;

export type Kategori = keyof typeof LABEL_KATEGORI;

export const LABEL_TIPE = {
  video: "Video",
  gambar: "Gambar",
  teks_berjalan: "Running text",
} as const;

export const LABEL_KATEGORI_SPONSOR = {
  bank: "Bank",
  farmasi_otc: "Farmasi (obat bebas)",
  fmcg: "Produk konsumen",
  penunjang_medis: "Penunjang medis",
} as const;

export type KlinikRingkas = { id: string; slug: string; nama: string };
export type Sponsor = { id: string; nama: string; kategori: string };

/** Today in WIB plus `hari` days, as YYYY-MM-DD for <input type="date">. */
export function tanggalWib(hari = 0): string {
  const d = new Date(Date.now() + hari * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}
