import { describe, expect, it } from "vitest";
import { ejaAngka, kalimatPanggilan } from "./suara";

describe("kalimatPanggilan", () => {
  it("matches the sentence in ARCH §2.3", () => {
    expect(kalimatPanggilan("A-014", "Poli Umum", "Ruang 1")).toBe(
      "Nomor antrian A, nol satu empat, silakan ke Poli Umum, Ruang satu",
    );
  });

  it("reads digits one by one and leaves room names without digits alone", () => {
    expect(ejaAngka("1000")).toBe("satu nol nol nol");
    expect(kalimatPanggilan("C-009", "Farmasi", "Loket Obat")).toBe(
      "Nomor antrian C, nol nol sembilan, silakan ke Farmasi, Loket Obat",
    );
  });
});
