// Response shapes from 04-API.md. Public types must never contain penjamin, PIN, or personal data.

export type ModeTampilan = "otomatis" | "kartu" | "daftar";
export type TipeKonten = "video" | "gambar";
export type KategoriKonten = "iklan_sponsor" | "edukasi" | "promo_klinik" | "info";
export type JenisPanggilan = "baru" | "ulang";

export type Tampilan = {
  klinik: {
    id: string;
    slug: string;
    nama: string;
    warnaUtama: string;
    logoUrl: string | null;
    modeTampilan: ModeTampilan;
    playlistVersi: number;
  };
  poli: {
    poliId: string;
    nama: string;
    kodeHuruf: string;
    ruang: string;
    kodeDipanggil: string | null;
    dipanggilPrioritas: boolean;
    kodeBerikutnya: string | null;
    jumlahMenunggu: number;
  }[];
  playlist: {
    kontenId: string;
    tipe: TipeKonten;
    kategori: KategoriKonten;
    url: string;
    durasiDetik: number;
    bobot: number;
    /** Shown as "Dipersembahkan oleh …" under the video. Sponsor name only, never contact. */
    sponsorNama: string | null;
  }[];
  runningText: string[];
  panggilanTerakhir: {
    id: string;
    poliId: string;
    kode: string;
    jenis: JenisPanggilan;
    dibuatPada: string;
  }[];
  waktuServer: string;
};
