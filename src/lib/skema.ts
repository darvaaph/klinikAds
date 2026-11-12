import { z } from "zod";

// Shared input schemas (API §3). Enum values match the DB enums in DB §3.
export const AlasanPrioritas = z.enum(["lansia", "ibu_hamil", "disabilitas", "darurat"]);
export const Penjamin = z.enum(["bpjs", "umum", "asuransi_lain"]);
export const Slug = z.string().regex(/^[a-z0-9-]{3,40}$/);
export const Pin = z.string().regex(/^\d{6}$/, "PIN harus 6 angka");
export const Id = z.string().min(1).max(64);
