import { beforeEach, describe, expect, it } from "vitest";
import {
  buatKonten,
  buatPenempatan,
  hapusPenempatan,
  laporanTayang,
  ubahKlinik,
  type KontenBaru,
} from "./cms";
import { resetStore, store } from "./store";
import { ambilTampilan } from "./tampilan";

const SEKARANG = new Date("2026-11-11T03:00:00Z");

const VIDEO: KontenBaru = {
  judul: "Iklan baru",
  tipe: "video",
  kategori: "iklan_sponsor",
  filePath: "2026/11/abc.mp4",
  teks: null,
  durasiDetik: 30,
  sponsorId: null,
  produkObatSuplemen: false,
  izinEdarBpom: null,
};

beforeEach(() => {
  resetStore(SEKARANG);
});

const klinik = (slug: string) => store().klinik.find((k) => k.slug === slug)!;

describe("buatKonten (US-007)", () => {
  it("rejects a drug/supplement product without a BPOM number", () => {
    expect(() => buatKonten({ ...VIDEO, produkObatSuplemen: true, izinEdarBpom: " " })).toThrow(
      "IZIN_BPOM_WAJIB",
    );
  });

  it("accepts it with a BPOM number", () => {
    expect(
      buatKonten({ ...VIDEO, produkObatSuplemen: true, izinEdarBpom: "POM SD.123456789" }),
    ).toHaveProperty("kontenId");
  });
});

describe("penempatan (US-006)", () => {
  it("plays only at the chosen klinik and bumps its playlist version", () => {
    const a = klinik("palsigunung-2");
    const b = klinik("klinik-b");
    const versiA = a.playlistVersi;
    const versiB = b.playlistVersi;
    const { kontenId } = buatKonten(VIDEO);
    buatPenempatan({
      kontenId,
      klinikIds: [a.id],
      mulai: "2026-11-11",
      selesai: "2026-11-30",
      bobot: 2,
    });

    const di = (slug: string) =>
      ambilTampilan(slug, SEKARANG)!.playlist.some((p) => p.kontenId === kontenId);
    expect(di("palsigunung-2")).toBe(true);
    expect(di("klinik-b")).toBe(false);
    expect(a.playlistVersi).toBe(versiA + 1);
    expect(b.playlistVersi).toBe(versiB);
    expect(
      ambilTampilan("palsigunung-2", SEKARANG)!.playlist.find((p) => p.kontenId === kontenId)!.url,
    ).toBe("/api/media/2026/11/abc.mp4");
  });

  it("does not play before its start date", () => {
    const { kontenId } = buatKonten(VIDEO);
    buatPenempatan({
      kontenId,
      klinikIds: [klinik("klinik-c").id],
      mulai: "2026-11-12",
      selesai: "2026-11-30",
      bobot: 1,
    });
    expect(ambilTampilan("klinik-c", SEKARANG)!.playlist.some((p) => p.kontenId === kontenId)).toBe(
      false,
    );
  });

  it("deleting a running text placement removes it from the TV", () => {
    const k = klinik("klinik-c");
    const { kontenId } = buatKonten({
      ...VIDEO,
      tipe: "teks_berjalan",
      filePath: null,
      teks: "Halo",
    });
    const { penempatanIds } = buatPenempatan({
      kontenId,
      klinikIds: [k.id],
      mulai: "2026-11-01",
      selesai: "2026-12-01",
      bobot: 1,
    });
    expect(ambilTampilan("klinik-c", SEKARANG)!.runningText).toContain("Halo");
    hapusPenempatan(penempatanIds[0]);
    expect(ambilTampilan("klinik-c", SEKARANG)!.runningText).not.toContain("Halo");
    expect(store().konten.some((x) => x.id === kontenId)).toBe(false);
  });
});

describe("ubahKlinik", () => {
  it("rejects a low-contrast color", async () => {
    await expect(ubahKlinik(klinik("klinik-b").id, { warnaUtama: "#7FD1C7" })).rejects.toThrow(
      "WARNA_KONTRAS_RENDAH",
    );
  });

  it("changes the TV color", async () => {
    await ubahKlinik(klinik("klinik-b").id, { warnaUtama: "#6b2e5b" });
    expect(ambilTampilan("klinik-b", SEKARANG)!.klinik.warnaUtama).toBe("#6B2E5B");
  });
});

describe("laporanTayang", () => {
  it("has about 2,000 sample rows over 14 days and zero-fills the range", () => {
    const semua = laporanTayang({ dari: "2026-10-01", sampai: "2026-11-11" });
    expect(semua.ringkasan.totalTayang).toBeGreaterThan(1500);
    expect(semua.ringkasan.totalTayang).toBeLessThan(2500);
    expect(semua.perHari).toHaveLength(42);
    expect(semua.perHari.find((h) => h.tanggal === "2026-10-01")!.tayang).toBe(0);
    const totalPerKonten = semua.perKonten.reduce((n, k) => n + k.tayang, 0);
    expect(totalPerKonten).toBe(semua.ringkasan.totalTayang);
  });
});
