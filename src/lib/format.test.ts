import { describe, expect, it } from "vitest";
import { formatJam, formatTanggal, kodeNomor, normalisasiKode } from "./format";

describe("kodeNomor", () => {
  it("pads to 3 digits", () => {
    expect(kodeNomor("A", 14)).toBe("A-014");
    expect(kodeNomor("b", 1)).toBe("B-001");
  });

  it("does not truncate numbers above 999", () => {
    expect(kodeNomor("A", 1000)).toBe("A-1000");
  });
});

describe("normalisasiKode", () => {
  it.each(["A-014", "a14", "A 014", " a-14 ", "A014"])("normalizes %s", (input) => {
    expect(normalisasiKode(input)).toBe("A-014");
  });

  it.each(["", "14", "AB-014", "A-", "A-0", "A-abc"])("rejects %s", (input) => {
    expect(normalisasiKode(input)).toBeNull();
  });
});

describe("tanggal & jam Indonesia (Asia/Jakarta)", () => {
  // 2026-11-11 07:30 UTC = 14:30 WIB
  const waktu = "2026-11-11T07:30:00Z";

  it("formats the date in Indonesian", () => {
    expect(formatTanggal(waktu)).toBe("Rabu, 11 November 2026");
  });

  it("formats the time in WIB with a dot separator", () => {
    expect(formatJam(waktu)).toBe("14.30");
  });

  it("rolls over to the next day in WIB", () => {
    expect(formatTanggal("2026-11-11T18:00:00Z")).toBe("Kamis, 12 November 2026");
  });
});
