import { describe, expect, it } from "vitest";
import { pilihMode } from "./modeTampilan";

describe("pilihMode", () => {
  it("picks kartu for up to 4 poli and daftar above that", () => {
    expect(pilihMode(1, "otomatis")).toBe("kartu");
    expect(pilihMode(3, "otomatis")).toBe("kartu");
    expect(pilihMode(4, "otomatis")).toBe("kartu");
    expect(pilihMode(5, "otomatis")).toBe("daftar");
    expect(pilihMode(6, "otomatis")).toBe("daftar");
  });

  it("respects a forced mode when it fits", () => {
    expect(pilihMode(3, "daftar")).toBe("daftar");
    expect(pilihMode(3, "kartu")).toBe("kartu");
  });

  it("never forces kartu when it cannot fit", () => {
    expect(pilihMode(5, "kartu")).toBe("daftar");
  });
});
