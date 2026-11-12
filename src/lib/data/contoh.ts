// Sample data mirroring 03-DATABASE.md §8. No real sponsor brands.
import { hariIni, kodeNomor } from "@/lib/format";
import type { AlasanPrioritas, Konten, Penempatan, Penjamin, Poli, Store, Tiket } from "./store";

// bcrypt hash of the demo PIN 246810 (DB §8). Change before pitching.
const PIN_DEMO_HASH = "$2b$10$YM3kJrbb3panNk3cCMvAcu7svAl7iDj2dZnQrhDx6xH/Hm5vayl.a";

type PoliContoh = {
  nama: string;
  huruf: string;
  ruang: string;
  /** Tickets created today, the currently called number, and which waiting numbers are prioritas. */
  dibuat: number;
  dipanggil: number;
  prioritas?: Record<number, AlasanPrioritas>;
};

const KLINIK_CONTOH: {
  slug: string;
  nama: string;
  warna: string;
  poli: PoliContoh[];
  runningText: string[];
}[] = [
  {
    slug: "palsigunung-2",
    nama: "Klinik Pratama Palsigunung 2",
    warna: "#0B5563",
    poli: [
      {
        nama: "Poli Umum",
        huruf: "A",
        ruang: "Ruang 1",
        dibuat: 17,
        dipanggil: 13,
        prioritas: { 16: "lansia" },
      },
      { nama: "Poli Gigi", huruf: "B", ruang: "Ruang 2", dibuat: 6, dipanggil: 4 },
      { nama: "Farmasi", huruf: "C", ruang: "Loket Obat", dibuat: 11, dipanggil: 9 },
    ],
    runningText: [
      "Dokter gigi praktik hari ini pukul 16.00–20.00",
      "Pindai QR di layar untuk memantau nomor antrian Anda",
      "Mohon menunggu dengan tertib. Prioritas untuk lansia, ibu hamil, dan penyandang disabilitas",
    ],
  },
  {
    slug: "klinik-b",
    nama: "Klinik Pratama Harapan",
    warna: "#1F4E8C",
    poli: [
      { nama: "Poli Umum", huruf: "A", ruang: "Ruang 1", dibuat: 22, dipanggil: 18 },
      { nama: "Poli Gigi", huruf: "B", ruang: "Ruang 2", dibuat: 5, dipanggil: 3 },
      { nama: "Farmasi", huruf: "C", ruang: "Loket Obat", dibuat: 15, dipanggil: 12 },
      {
        nama: "KIA",
        huruf: "D",
        ruang: "Ruang 3",
        dibuat: 4,
        dipanggil: 2,
        prioritas: { 4: "ibu_hamil" },
      },
      { nama: "Laboratorium", huruf: "E", ruang: "Ruang Lab", dibuat: 0, dipanggil: 0 },
    ],
    runningText: [
      "Pemeriksaan laboratorium buka pukul 07.00–14.00",
      "Pindai QR di layar untuk memantau nomor antrian Anda",
      "Jaga kebersihan ruang tunggu. Terima kasih",
    ],
  },
  {
    slug: "klinik-c",
    nama: "Klinik Medika Bunda",
    warna: "#2E6B3F",
    poli: [
      { nama: "Poli Umum", huruf: "A", ruang: "Ruang 1", dibuat: 9, dipanggil: 7 },
      { nama: "KIA", huruf: "D", ruang: "Ruang 2", dibuat: 3, dipanggil: 1 },
    ],
    runningText: [
      "Imunisasi anak setiap Selasa dan Kamis",
      "Pindai QR di layar untuk memantau nomor antrian Anda",
      "Mohon menunggu dengan tertib",
    ],
  },
];

// Placeholder media served from /public/contoh until Supabase Storage is set up.
type MediaContoh = Pick<Konten, "judul" | "tipe" | "kategori" | "filePath" | "durasiDetik">;
const MEDIA_CONTOH: MediaContoh[] = [
  {
    judul: "Cuci tangan 6 langkah",
    tipe: "gambar",
    kategori: "edukasi",
    filePath: "/contoh/edukasi-cuci-tangan.svg",
    durasiDetik: 12,
  },
  {
    judul: "Minum air putih",
    tipe: "gambar",
    kategori: "edukasi",
    filePath: "/contoh/edukasi-air-putih.svg",
    durasiDetik: 12,
  },
  {
    judul: "Promo cek gula darah",
    tipe: "gambar",
    kategori: "promo_klinik",
    filePath: "/contoh/promo-cek-gula.svg",
    durasiDetik: 10,
  },
  {
    judul: "Sponsor fiktif (Contoh)",
    tipe: "gambar",
    kategori: "iklan_sponsor",
    filePath: "/contoh/sponsor-contoh.svg",
    durasiDetik: 10,
  },
  {
    judul: "QR pantau antrian",
    tipe: "gambar",
    kategori: "info",
    filePath: "/contoh/qr-pantau.svg",
    durasiDetik: 10,
  },
  // Synthetic placeholder videos (solid color + text, made with ffmpeg). Real
  // educational videos replace these in T-006.
  {
    judul: "Video edukasi: tidur cukup",
    tipe: "video",
    kategori: "edukasi",
    filePath: "/contoh/video-edukasi-1.mp4",
    durasiDetik: 15,
  },
  {
    judul: "Video edukasi: jalan kaki",
    tipe: "video",
    kategori: "edukasi",
    filePath: "/contoh/video-edukasi-2.mp4",
    durasiDetik: 12,
  },
  {
    judul: "Video sponsor fiktif (Contoh)",
    tipe: "video",
    kategori: "iklan_sponsor",
    filePath: "/contoh/video-sponsor-contoh.mp4",
    durasiDetik: 10,
  },
];

const PENJAMIN: Penjamin[] = ["bpjs", "umum", "bpjs", "asuransi_lain"];

function tambahHari(tanggal: string, hari: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}

/** Small seeded PRNG so the sample report looks the same after every restart. */
function acak(benih: number) {
  return () => {
    benih = (benih + 0x6d2b79f5) | 0;
    let t = Math.imul(benih ^ (benih >>> 15), 1 | benih);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ±2,000 `log_tayang` rows over the last 14 days (DB §8), weighted like the playlist. */
function buatLogTayang(s: Store, sekarang: Date) {
  const r = acak(20261111);
  for (const k of s.klinik) {
    const tayang = s.penempatan
      .filter((pe) => pe.klinikId === k.id)
      .map((pe) => ({ pe, konten: s.konten.find((x) => x.id === pe.kontenId)! }))
      .filter((x) => x.konten.tipe !== "teks_berjalan");
    const total = tayang.reduce((n, x) => n + x.pe.bobot, 0);
    for (let hari = 14; hari >= 1; hari--) {
      const n = 38 + Math.floor(r() * 16); // ≈ 48 plays per klinik per day
      for (let i = 0; i < n; i++) {
        let titik = r() * total;
        const pilih = tayang.find((x) => (titik -= x.pe.bobot) < 0) ?? tayang[0];
        // Between 08.00 and 20.00 WIB (01.00–13.00 UTC).
        const mulai = new Date(sekarang.getTime() - hari * 86_400_000);
        mulai.setUTCHours(1 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
        s.logTayang.push({
          klinikId: k.id,
          kontenId: pilih.konten.id,
          mulaiPada: mulai,
          durasiDetik: pilih.konten.durasiDetik,
        });
      }
    }
  }
}

export function buatDataContoh(sekarang: Date): Store {
  const id = () => crypto.randomUUID();
  const tanggal = hariIni(sekarang);
  const s: Store = {
    klinik: [],
    poli: [],
    tiket: [],
    panggilan: [],
    konten: [],
    penempatan: [],
    sponsor: [],
    logTayang: [],
  };

  // Fictional sponsors only, clearly marked (DB §8: no real brands without permission).
  const sponsorBank = {
    id: id(),
    nama: "Contoh Bank Sehat (fiktif)",
    kategori: "bank",
    kontak: null,
  };
  const sponsorApotek = {
    id: id(),
    nama: "Contoh Apotek Sentosa (fiktif)",
    kategori: "farmasi_otc",
    kontak: null,
  };
  s.sponsor.push(sponsorBank, sponsorApotek);

  const media: Konten[] = MEDIA_CONTOH.map((m) => ({
    ...m,
    id: id(),
    teks: null,
    aktif: true,
    sponsorId:
      m.kategori !== "iklan_sponsor"
        ? null
        : m.tipe === "video"
          ? sponsorApotek.id
          : sponsorBank.id,
    produkObatSuplemen: false,
    izinEdarBpom: null,
    dibuatPada: new Date(sekarang.getTime() - 20 * 86_400_000),
  }));
  s.konten.push(...media);

  for (const k of KLINIK_CONTOH) {
    const klinikId = id();
    s.klinik.push({
      id: klinikId,
      slug: k.slug,
      nama: k.nama,
      warnaUtama: k.warna,
      logoUrl: null,
      modeTampilan: "otomatis",
      pinRemoteHash: PIN_DEMO_HASH,
      playlistVersi: 1,
    });

    k.poli.forEach((p, urutan) => {
      const poli: Poli = {
        id: id(),
        klinikId,
        nama: p.nama,
        kodeHuruf: p.huruf,
        ruang: p.ruang,
        urutan,
        aktif: true,
      };
      s.poli.push(poli);

      // One ticket every 4 minutes, the newest created 2 minutes before `sekarang`.
      for (let n = 1; n <= p.dibuat; n++) {
        const dibuatPada = new Date(sekarang.getTime() - ((p.dibuat - n) * 4 + 2) * 60_000);
        const alasan = p.prioritas?.[n] ?? null;
        const status = n < p.dipanggil ? "selesai" : n === p.dipanggil ? "dipanggil" : "menunggu";
        const tiket: Tiket = {
          id: id(),
          klinikId,
          poliId: poli.id,
          tanggal,
          nomorUrut: n,
          kode: kodeNomor(p.huruf, n),
          status,
          prioritas: alasan !== null,
          alasanPrioritas: alasan,
          penjamin: PENJAMIN[n % PENJAMIN.length],
          jumlahPanggil: status === "menunggu" ? 0 : 1,
          dibuatPada,
          dipanggilPada: status === "menunggu" ? null : dibuatPada,
        };
        s.tiket.push(tiket);
      }
    });

    const penempatan = (kontenId: string, bobot: number): Penempatan => ({
      id: id(),
      kontenId,
      klinikId,
      mulai: tambahHari(tanggal, -7),
      selesai: tambahHari(tanggal, 30),
      bobot,
      persetujuanKlinik: "disetujui",
    });

    for (const m of media) {
      s.penempatan.push(penempatan(m.id, m.kategori === "iklan_sponsor" ? 2 : 1));
    }

    for (const teks of k.runningText) {
      const konten: Konten = {
        id: id(),
        judul: teks.slice(0, 40),
        tipe: "teks_berjalan",
        kategori: "info",
        filePath: null,
        teks,
        durasiDetik: 10,
        aktif: true,
        sponsorId: null,
        produkObatSuplemen: false,
        izinEdarBpom: null,
        dibuatPada: new Date(sekarang.getTime() - 20 * 86_400_000),
      };
      s.konten.push(konten);
      s.penempatan.push(penempatan(konten.id, 1));
    }
  }

  buatLogTayang(s, sekarang);

  // No seeded `panggilan` rows: the TV must not replay old calls as new ones on first load.
  return s;
}
