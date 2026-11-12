import { beforeEach, describe, expect, it } from "vitest";
import { resetStore, store } from "./store";
import { ambilTampilan } from "./tampilan";

const SEKARANG = new Date("2026-11-11T03:00:00Z"); // 10.00 WIB

beforeEach(() => {
  resetStore(SEKARANG);
});

function poliDari(slug: string) {
  const t = ambilTampilan(slug, SEKARANG);
  if (!t) throw new Error(`klinik ${slug} tidak ada`);
  return t.poli;
}

describe("ambilTampilan", () => {
  it("returns null for an unknown klinik", () => {
    expect(ambilTampilan("tidak-ada", SEKARANG)).toBeNull();
  });

  it("has 3 poli for palsigunung-2 and 5 for klinik-b, in urutan order", () => {
    expect(poliDari("palsigunung-2").map((p) => p.kodeHuruf)).toEqual(["A", "B", "C"]);
    expect(poliDari("klinik-b")).toHaveLength(5);
  });

  it("summarizes each poli like segarkan_status_poli", () => {
    const umum = poliDari("palsigunung-2")[0];
    // A-013 called; A-014..A-017 waiting; A-016 is prioritas (lansia) so it is next.
    expect(umum).toMatchObject({
      kodeDipanggil: "A-013",
      dipanggilPrioritas: false,
      kodeBerikutnya: "A-016",
      jumlahMenunggu: 4,
    });
  });

  it("shows null for a poli with no tickets yet", () => {
    const lab = poliDari("klinik-b").find((p) => p.kodeHuruf === "E");
    expect(lab).toMatchObject({ kodeDipanggil: null, kodeBerikutnya: null, jumlahMenunggu: 0 });
  });

  it("ignores tickets from another day", () => {
    const besok = new Date(SEKARANG.getTime() + 24 * 60 * 60_000);
    const umum = ambilTampilan("palsigunung-2", besok)!.poli[0];
    expect(umum).toMatchObject({ kodeDipanggil: null, jumlahMenunggu: 0 });
  });

  it("splits running text from the image/video playlist", () => {
    const t = ambilTampilan("palsigunung-2", SEKARANG)!;
    expect(t.runningText).toHaveLength(3);
    expect(t.playlist.length).toBeGreaterThan(0);
    expect(t.playlist.every((k) => k.tipe === "video" || k.tipe === "gambar")).toBe(true);
  });

  it("drops inactive konten and placements outside their date range", () => {
    const s = store();
    const klinik = s.klinik.find((k) => k.slug === "palsigunung-2")!;
    const milik = s.penempatan.filter((pe) => pe.klinikId === klinik.id);
    const sebelum = ambilTampilan("palsigunung-2", SEKARANG)!.playlist.length;

    const kontenGambar = s.konten.find((k) => k.tipe === "gambar")!;
    kontenGambar.aktif = false;
    const pe = milik.find(
      (p) =>
        p.kontenId !== kontenGambar.id &&
        s.konten.find((k) => k.id === p.kontenId)!.tipe === "gambar",
    )!;
    pe.selesai = "2026-11-10";

    expect(ambilTampilan("palsigunung-2", SEKARANG)!.playlist).toHaveLength(sebelum - 2);
  });

  it("returns at most 5 calls from the last 60 s, oldest first", () => {
    const s = store();
    const klinik = s.klinik.find((k) => k.slug === "palsigunung-2")!;
    const tiket = s.tiket.find((t) => t.klinikId === klinik.id)!;
    for (let i = 0; i < 7; i++) {
      s.panggilan.push({
        id: `p${i}`,
        klinikId: klinik.id,
        poliId: tiket.poliId,
        tiketId: tiket.id,
        kode: tiket.kode,
        jenis: "baru",
        dibuatPada: new Date(SEKARANG.getTime() - (70 - i * 10) * 1000), // 70 s ago … 10 s ago
      });
    }
    const ids = ambilTampilan("palsigunung-2", SEKARANG)!.panggilanTerakhir.map((p) => p.id);
    expect(ids).toEqual(["p2", "p3", "p4", "p5", "p6"]);
  });

  it("never exposes penjamin, PIN, or ticket ids", () => {
    for (const slug of ["palsigunung-2", "klinik-b", "klinik-c"]) {
      const json = JSON.stringify(ambilTampilan(slug, SEKARANG));
      // Values are checked too: "bpjs"/"asuransi_lain" must not appear anywhere.
      expect(json).not.toMatch(/penjamin|bpjs|asuransi_lain|\$2[aby]\$/i);
      // No key that looks like a PIN or ticket id ("Pindai QR" in running text is fine).
      expect(json).not.toMatch(/"(pin\w*|\w*Pin\w*|tiketId)":/);
    }
  });
});
