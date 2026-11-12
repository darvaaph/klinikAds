const ZONA_WAKTU = "Asia/Jakarta";

/** Ticket code as stored in the DB: kode huruf + "-" + nomor urut padded to 3 digits ("A-014"). */
export function kodeNomor(kodeHuruf: string, nomorUrut: number): string {
  return `${kodeHuruf.toUpperCase()}-${String(nomorUrut).padStart(3, "0")}`;
}

/**
 * Normalize what a patient types on the QR page ("a14", "A 014", "a-014") into "A-014".
 * Returns null when the input is not a letter followed by a number.
 */
export function normalisasiKode(input: string): string | null {
  const m = /^\s*([a-z])\s*-?\s*(\d{1,4})\s*$/i.exec(input);
  if (!m) return null;
  const nomor = Number(m[2]);
  if (nomor < 1) return null;
  return kodeNomor(m[1], nomor);
}

/** "Rabu, 11 November 2026" */
export function formatTanggal(waktu: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA_WAKTU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(waktu));
}

/** "14.30" (24-hour, Indonesian separator) */
export function formatJam(waktu: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA_WAKTU,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(waktu));
}

/** Today's date in Asia/Jakarta as YYYY-MM-DD (same as the DB's `tanggal` default). */
export function hariIni(sekarang: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_WAKTU }).format(sekarang);
}
