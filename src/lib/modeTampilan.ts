import type { ModeTampilan } from "@/types/api";

export type ModePanel = "kartu" | "daftar";

/** Card mode fits at most 4 poli in the 780 px queue column (ARCH §4.5). */
export const MAKS_POLI_KARTU = 4;

/**
 * "otomatis" picks kartu for ≤ 4 poli and daftar for more. A forced "kartu" falls
 * back to daftar when there are too many poli to fit.
 */
export function pilihMode(jumlahPoli: number, mode: ModeTampilan): ModePanel {
  if (jumlahPoli > MAKS_POLI_KARTU) return "daftar";
  return mode === "daftar" ? "daftar" : "kartu";
}
