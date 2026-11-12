// Browser-side fetch wrapper: always resolves to the API's { ok, data | error } shape.
import type { KodeError, Respons } from "@/lib/respons";

type GalatKlien = { ok: false; error: { kode: KodeError; pesan: string; detail?: unknown } };

const TIDAK_TERSAMBUNG: GalatKlien = {
  ok: false,
  error: { kode: "KESALAHAN_SERVER", pesan: "Tidak tersambung ke server. Periksa internet HP." },
};

export async function api<T>(url: string, init?: { method?: string; body?: unknown }) {
  try {
    const res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    return (await res.json()) as Respons<T>;
  } catch {
    return TIDAK_TERSAMBUNG as Respons<T>;
  }
}

export const LABEL_ALASAN = {
  lansia: "Lansia",
  ibu_hamil: "Ibu hamil",
  disabilitas: "Disabilitas",
  darurat: "Darurat",
} as const;

export type Alasan = keyof typeof LABEL_ALASAN;
