"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { LABEL_ALASAN, type Alasan } from "@/lib/klien";

export type Penjamin = "bpjs" | "umum" | "asuransi_lain";

const LABEL_PENJAMIN: Record<Penjamin, string> = {
  bpjs: "BPJS",
  umum: "Umum",
  asuransi_lain: "Asuransi lain",
};

/**
 * New ticket. Penjamin is optional and only stored for internal reports: it never
 * changes the order and never appears on the TV or QR page (PRD lampiran rule 1).
 */
export function DialogNomorBaru({
  namaPoli,
  terbuka,
  onTutup,
  onBuat,
  proses,
}: {
  namaPoli: string;
  terbuka: boolean;
  onTutup: () => void;
  onBuat: (data: { penjamin: Penjamin | null; alasanPrioritas: Alasan | null }) => void;
  proses: boolean;
}) {
  const [penjamin, setPenjamin] = useState<Penjamin | null>(null);
  const [prioritas, setPrioritas] = useState(false);
  const [alasan, setAlasan] = useState<Alasan | "">("");

  const siap = !prioritas || alasan !== "";

  return (
    <Dialog terbuka={terbuka} onTutup={onTutup} judul={`Nomor baru · ${namaPoli}`}>
      <div className="flex flex-col gap-2">
        <label htmlFor="penjamin" className="text-base font-medium text-slate-800">
          Penjamin <span className="font-normal text-slate-600">(opsional)</span>
        </label>
        <select
          id="penjamin"
          value={penjamin ?? ""}
          onChange={(e) => setPenjamin((e.target.value || null) as Penjamin | null)}
          className="min-h-14 rounded-xl border-2 border-slate-300 bg-white px-3 text-lg"
        >
          <option value="">Tidak diisi</option>
          {(Object.keys(LABEL_PENJAMIN) as Penjamin[]).map((p) => (
            <option key={p} value={p}>
              {LABEL_PENJAMIN[p]}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-600">
          Tidak mengubah urutan dan tidak tampil di TV maupun halaman pasien.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex min-h-14 cursor-pointer items-center gap-3 text-lg">
          <input
            type="checkbox"
            checked={prioritas}
            onChange={(e) => {
              setPrioritas(e.target.checked);
              if (!e.target.checked) setAlasan("");
            }}
            className="size-5 accent-[var(--warna-klinik)]"
          />
          Pasien prioritas
        </label>
        {prioritas && (
          <>
            <label htmlFor="alasan" className="text-base font-medium text-slate-800">
              Alasan prioritas (wajib)
            </label>
            <select
              id="alasan"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value as Alasan | "")}
              className="min-h-14 rounded-xl border-2 border-slate-300 bg-white px-3 text-lg"
            >
              <option value="">Pilih alasan…</option>
              {(Object.keys(LABEL_ALASAN) as Alasan[]).map((a) => (
                <option key={a} value={a}>
                  {LABEL_ALASAN[a]}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button varian="kedua" onClick={onTutup}>
          Batal
        </Button>
        <Button
          disabled={!siap || proses}
          onClick={() => onBuat({ penjamin, alasanPrioritas: alasan || null })}
        >
          {proses ? "Membuat…" : "Buat nomor"}
        </Button>
      </div>
    </Dialog>
  );
}
