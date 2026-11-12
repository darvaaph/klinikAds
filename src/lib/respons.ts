import { NextResponse } from "next/server";

// Error codes and HTTP status from 04-API.md §1.2.
export const KODE_ERROR = {
  VALIDASI_GAGAL: { status: 400, pesan: "Data yang dikirim tidak valid." },
  IZIN_BPOM_WAJIB: { status: 400, pesan: "Produk obat/suplemen wajib punya nomor izin edar BPOM." },
  WARNA_KONTRAS_RENDAH: {
    status: 400,
    pesan: "Warna terlalu terang. Kontras dengan putih minimal 4,5:1.",
  },
  BELUM_LOGIN: { status: 401, pesan: "Silakan login dulu." },
  PIN_SALAH: { status: 401, pesan: "PIN salah." },
  BUKAN_KLINIK_ANDA: { status: 403, pesan: "Anda tidak punya akses ke klinik ini." },
  KLINIK_TIDAK_DITEMUKAN: { status: 404, pesan: "Klinik tidak ditemukan." },
  POLI_TIDAK_DITEMUKAN: { status: 404, pesan: "Poli tidak ditemukan." },
  TIKET_TIDAK_DITEMUKAN: { status: 404, pesan: "Nomor antrian tidak ditemukan hari ini." },
  // Not listed in API §1.2; used by the CMS endpoints for unknown ids.
  KONTEN_TIDAK_DITEMUKAN: { status: 404, pesan: "Konten tidak ditemukan." },
  PENEMPATAN_TIDAK_DITEMUKAN: { status: 404, pesan: "Penempatan tidak ditemukan." },
  // Not listed in API §1.2; signed upload URL is wrong or expired.
  UNGGAH_DITOLAK: { status: 403, pesan: "Izin unggah tidak valid atau sudah kedaluwarsa." },
  ANTRIAN_KOSONG: { status: 409, pesan: "Tidak ada antrian menunggu di poli ini." },
  // Not listed in API §1.2; mirrors the DB exception from set_prioritas (DB §5).
  TIKET_TIDAK_MENUNGGU: { status: 409, pesan: "Tiket ini sudah tidak menunggu." },
  // Not listed in API §1.2; reset-demo is only allowed with MODE_DEMO=true (API §3).
  RESET_NONAKTIF: { status: 403, pesan: "Reset demo tidak aktif di server ini." },
  BELUM_ADA_PANGGILAN: { status: 409, pesan: "Belum ada nomor yang dipanggil." },
  TERKUNCI: { status: 429, pesan: "Terlalu banyak percobaan. Coba lagi dalam 5 menit." },
  KESALAHAN_SERVER: { status: 500, pesan: "Terjadi kesalahan. Coba lagi." },
} as const;

export type KodeError = keyof typeof KODE_ERROR;

export type Respons<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kode: KodeError; pesan: string; detail?: unknown } };

const NO_STORE = { "Cache-Control": "no-store" };

export function berhasil<T>(data: T, status = 200) {
  return NextResponse.json<Respons<T>>({ ok: true, data }, { status, headers: NO_STORE });
}

export function gagal(kode: KodeError, opsi: { pesan?: string; detail?: unknown } = {}) {
  const { status, pesan } = KODE_ERROR[kode];
  const error = {
    kode,
    pesan: opsi.pesan ?? pesan,
    ...(opsi.detail !== undefined && { detail: opsi.detail }),
  };
  return NextResponse.json<Respons<never>>({ ok: false, error }, { status, headers: NO_STORE });
}
