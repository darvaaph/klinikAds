// Queue operations mirroring the RPC functions in 03-DATABASE.md §5, on the
// in-memory store. JS runs one request handler at a time, so each function is
// atomic like the DB's per-poli row lock. Every function checks that the poli or
// ticket belongs to the klinik from the session.
import { hariIni, kodeNomor, normalisasiKode } from "@/lib/format";
import { GalatData } from "./galat";
import { store, type AlasanPrioritas, type Panggilan, type Penjamin, type Tiket } from "./store";
import { urutanAntri } from "./tampilan";

function klinikDari(slug: string) {
  const klinik = store().klinik.find((k) => k.slug === slug);
  if (!klinik) throw new GalatData("KLINIK_TIDAK_DITEMUKAN");
  return klinik;
}

function poliMilik(klinikId: string, poliId: string) {
  const poli = store().poli.find((p) => p.id === poliId && p.klinikId === klinikId && p.aktif);
  if (!poli) throw new GalatData("POLI_TIDAK_DITEMUKAN");
  return poli;
}

function tiketMilik(klinikId: string, tiketId: string) {
  const tiket = store().tiket.find((t) => t.id === tiketId && t.klinikId === klinikId);
  if (!tiket) throw new GalatData("TIKET_TIDAK_DITEMUKAN");
  return tiket;
}

function tiketHariIni(poliId: string) {
  const tanggal = hariIni();
  return store().tiket.filter((t) => t.poliId === poliId && t.tanggal === tanggal);
}

function catatPanggilan(tiket: Tiket, jenis: Panggilan["jenis"]): Panggilan {
  const p: Panggilan = {
    id: crypto.randomUUID(),
    klinikId: tiket.klinikId,
    poliId: tiket.poliId,
    tiketId: tiket.id,
    kode: tiket.kode,
    jenis,
    dibuatPada: new Date(),
  };
  store().panggilan.push(p);
  return p;
}

/** ambil_nomor: next number of the day for this poli (A-001, A-002, …). */
export function ambilNomor(
  klinikId: string,
  poliId: string,
  penjamin: Penjamin | null,
  alasan: AlasanPrioritas | null,
) {
  const poli = poliMilik(klinikId, poliId);
  const nomor = tiketHariIni(poliId).reduce((max, t) => Math.max(max, t.nomorUrut), 0) + 1;
  const tiket: Tiket = {
    id: crypto.randomUUID(),
    klinikId,
    poliId,
    tanggal: hariIni(),
    nomorUrut: nomor,
    kode: kodeNomor(poli.kodeHuruf, nomor),
    status: "menunggu",
    prioritas: alasan !== null,
    alasanPrioritas: alasan,
    penjamin,
    jumlahPanggil: 0,
    dibuatPada: new Date(),
    dipanggilPada: null,
  };
  store().tiket.push(tiket);
  return { tiketId: tiket.id, kode: tiket.kode, prioritas: tiket.prioritas };
}

/** panggil_berikutnya: prioritas first, then the longest waiting. */
export function panggilBerikutnya(klinikId: string, poliId: string) {
  poliMilik(klinikId, poliId);
  const hariIniPoli = tiketHariIni(poliId);
  const berikut = hariIniPoli.filter((t) => t.status === "menunggu").sort(urutanAntri)[0];
  // Checked before changing anything: the DB function rolls back on this exception.
  if (!berikut) throw new GalatData("ANTRIAN_KOSONG");

  for (const t of hariIniPoli) if (t.status === "dipanggil") t.status = "dilayani";
  berikut.status = "dipanggil";
  berikut.dipanggilPada = new Date();
  berikut.jumlahPanggil += 1;
  const p = catatPanggilan(berikut, "baru");
  return { panggilanId: p.id, kode: p.kode };
}

/** panggil_ulang: repeat the number currently called at this poli. */
export function panggilUlang(klinikId: string, poliId: string) {
  poliMilik(klinikId, poliId);
  const tiket = tiketHariIni(poliId)
    .filter((t) => t.status === "dipanggil")
    .sort((a, b) => (b.dipanggilPada?.getTime() ?? 0) - (a.dipanggilPada?.getTime() ?? 0))[0];
  if (!tiket) throw new GalatData("BELUM_ADA_PANGGILAN");
  tiket.jumlahPanggil += 1;
  const p = catatPanggilan(tiket, "ulang");
  return { panggilanId: p.id, kode: p.kode };
}

/** ubah_status_tiket: only tidak_hadir or selesai. */
export function ubahStatusTiket(
  klinikId: string,
  tiketId: string,
  status: "tidak_hadir" | "selesai",
) {
  const tiket = tiketMilik(klinikId, tiketId);
  tiket.status = status;
  return { tiketId: tiket.id, status };
}

/** set_prioritas: only for tickets still waiting; a reason is required. */
export function setPrioritas(klinikId: string, tiketId: string, alasan: AlasanPrioritas) {
  const tiket = tiketMilik(klinikId, tiketId);
  if (tiket.status !== "menunggu") throw new GalatData("TIKET_TIDAK_MENUNGGU");
  tiket.prioritas = true;
  tiket.alasanPrioritas = alasan;
  return { tiketId: tiket.id, prioritas: true };
}

/** reset_demo: delete today's tickets (and their calls) for one klinik. */
export function resetDemo(klinikId: string) {
  const s = store();
  const tanggal = hariIni();
  const dihapus = new Set(
    s.tiket.filter((t) => t.klinikId === klinikId && t.tanggal === tanggal).map((t) => t.id),
  );
  s.tiket = s.tiket.filter((t) => !dihapus.has(t.id));
  s.panggilan = s.panggilan.filter((p) => !dihapus.has(p.tiketId));
  return { tiketDihapus: dihapus.size };
}

/** GET /remote: per-poli state for the staff phone. No penjamin (API §3). */
export function ambilRemote(klinikId: string) {
  const s = store();
  const poli = s.poli
    .filter((p) => p.klinikId === klinikId && p.aktif)
    .sort((a, b) => a.urutan - b.urutan)
    .map((p) => {
      const tiket = tiketHariIni(p.id);
      const dipanggil = tiket
        .filter((t) => t.status === "dipanggil")
        .sort((a, b) => (b.dipanggilPada?.getTime() ?? 0) - (a.dipanggilPada?.getTime() ?? 0))[0];
      return {
        poliId: p.id,
        nama: p.nama,
        kodeHuruf: p.kodeHuruf,
        ruang: p.ruang,
        kodeDipanggil: dipanggil?.kode ?? null,
        tiketDipanggilId: dipanggil?.id ?? null,
        menunggu: tiket
          .filter((t) => t.status === "menunggu")
          .sort(urutanAntri)
          .map((t) => ({
            tiketId: t.id,
            kode: t.kode,
            prioritas: t.prioritas,
            alasanPrioritas: t.alasanPrioritas,
          })),
      };
    });
  return { poli };
}

/** GET /posisi: where one ticket stands, for the patient's phone (API §2). */
export function ambilPosisi(slug: string, kodeMasukan: string) {
  const klinik = klinikDari(slug);
  const kode = normalisasiKode(kodeMasukan);
  if (!kode) throw new GalatData("TIKET_TIDAK_DITEMUKAN");
  const tanggal = hariIni();
  const tiket = store().tiket.find(
    (t) => t.klinikId === klinik.id && t.tanggal === tanggal && t.kode === kode,
  );
  if (!tiket) throw new GalatData("TIKET_TIDAK_DITEMUKAN");

  const poli = store().poli.find((p) => p.id === tiket.poliId)!;
  const sePoli = tiketHariIni(poli.id);
  const dipanggil = sePoli
    .filter((t) => t.status === "dipanggil")
    .sort((a, b) => (b.dipanggilPada?.getTime() ?? 0) - (a.dipanggilPada?.getTime() ?? 0))[0];
  const orangDiDepan =
    tiket.status === "menunggu"
      ? sePoli.filter((t) => t.status === "menunggu" && urutanAntri(t, tiket) < 0).length
      : 0;

  return {
    kode: tiket.kode,
    poli: poli.nama,
    ruang: poli.ruang,
    status: tiket.status,
    kodeDipanggil: dipanggil?.kode ?? null,
    orangDiDepan,
  };
}

export { klinikDari };
