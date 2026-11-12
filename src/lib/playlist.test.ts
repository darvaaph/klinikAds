import { describe, expect, it } from "vitest";
import { buatStatusRotasi, pilihBerikutnya, type ItemBerbobot } from "./playlist";

function putar(playlist: ItemBerbobot[], kali: number): string[] {
  const status = buatStatusRotasi();
  const hasil: string[] = [];
  let sebelumnya: string | null = null;
  for (let i = 0; i < kali; i++) {
    const item: ItemBerbobot = pilihBerikutnya(playlist, status, sebelumnya)!;
    hasil.push(item.kontenId);
    sebelumnya = item.kontenId;
  }
  return hasil;
}

function hitung(urutan: string[]) {
  const n: Record<string, number> = {};
  for (const id of urutan) n[id] = (n[id] ?? 0) + 1;
  return n;
}

describe("pilihBerikutnya", () => {
  it("returns null for an empty playlist", () => {
    expect(pilihBerikutnya([], buatStatusRotasi(), null)).toBeNull();
  });

  it("plays each item exactly `bobot` times per cycle", () => {
    const playlist = [
      { kontenId: "sponsor", bobot: 2 },
      { kontenId: "edu1", bobot: 1 },
      { kontenId: "edu2", bobot: 1 },
      { kontenId: "promo", bobot: 1 },
      { kontenId: "qr", bobot: 1 },
    ];
    // 100 full cycles of total weight 6
    expect(hitung(putar(playlist, 600))).toEqual({
      sponsor: 200,
      edu1: 100,
      edu2: 100,
      promo: 100,
      qr: 100,
    });
  });

  it("keeps proportions for uneven weights", () => {
    const playlist = [
      { kontenId: "a", bobot: 3 },
      { kontenId: "b", bobot: 2 },
      { kontenId: "c", bobot: 1 },
      { kontenId: "d", bobot: 1 },
    ];
    expect(hitung(putar(playlist, 700))).toEqual({ a: 300, b: 200, c: 100, d: 100 });
  });

  it("never plays the same item twice in a row when there is more than one", () => {
    const playlist = [
      { kontenId: "besar", bobot: 10 },
      { kontenId: "kecil", bobot: 1 },
    ];
    const urutan = putar(playlist, 200);
    for (let i = 1; i < urutan.length; i++) expect(urutan[i]).not.toBe(urutan[i - 1]);
  });

  it("repeats the only item when the playlist has one", () => {
    expect(putar([{ kontenId: "satu", bobot: 1 }], 3)).toEqual(["satu", "satu", "satu"]);
  });
});
