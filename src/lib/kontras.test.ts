import { describe, expect, it } from "vitest";
import { kontras, kontrasCukup } from "./kontras";

describe("kontras", () => {
  it("passes the default klinik color against white", () => {
    expect(kontras("#0B5563", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(kontrasCukup("#0B5563")).toBe(true);
  });

  it("rejects a light teal against white", () => {
    expect(kontras("#7FD1C7", "#FFFFFF")).toBeLessThan(4.5);
    expect(kontrasCukup("#7FD1C7")).toBe(false);
  });

  it("returns the known extremes and is symmetric", () => {
    expect(kontras("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(kontras("#FFF", "#FFF")).toBeCloseTo(1, 5);
    expect(kontras("#FFFFFF", "#0B5563")).toBeCloseTo(kontras("#0B5563", "#FFFFFF"), 10);
  });

  it("throws on invalid input", () => {
    expect(() => kontras("merah", "#FFFFFF")).toThrow();
  });
});
