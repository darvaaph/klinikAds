"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LABEL_ALASAN, type Alasan } from "@/lib/klien";
import { DialogNomorBaru, type Penjamin } from "./DialogNomorBaru";
import { DialogPrioritas } from "./DialogPrioritas";

export type PoliRemote = {
  poliId: string;
  nama: string;
  kodeHuruf: string;
  ruang: string;
  kodeDipanggil: string | null;
  tiketDipanggilId: string | null;
  menunggu: { tiketId: string; kode: string; prioritas: boolean; alasanPrioritas: Alasan | null }[];
};

export type Aksi =
  | { jenis: "panggil" | "panggil-ulang"; poliId: string }
  | { jenis: "tidak-hadir"; tiketId: string; kode: string }
  | { jenis: "prioritas"; tiketId: string; kode: string; alasan: Alasan }
  | {
      jenis: "nomor-baru";
      poliId: string;
      penjamin: Penjamin | null;
      alasanPrioritas: Alasan | null;
    };

/** One poli's controls. `sibuk` disables every button while a request runs (no double taps). */
export function PanelPoli({
  poli,
  sibuk,
  onAksi,
}: {
  poli: PoliRemote;
  sibuk: boolean;
  onAksi: (aksi: Aksi) => Promise<boolean>;
}) {
  const [nomorBaru, setNomorBaru] = useState(false);
  const [prioritasUntuk, setPrioritasUntuk] = useState<{ tiketId: string; kode: string } | null>(
    null,
  );
  const kosong = poli.menunggu.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <section aria-label={`Status ${poli.nama}`} className="rounded-2xl bg-klinik p-5 text-white">
        <p className="text-base opacity-90">Sedang dipanggil · {poli.ruang}</p>
        <p className="font-angka text-7xl leading-tight font-bold tabular-nums">
          {poli.kodeDipanggil ?? "–"}
        </p>
        <p className="text-lg">
          {kosong ? "Tidak ada yang menunggu" : `${poli.menunggu.length} orang menunggu`}
        </p>
      </section>

      <Button
        className="min-h-16 text-xl"
        disabled={sibuk || kosong}
        onClick={() => onAksi({ jenis: "panggil", poliId: poli.poliId })}
      >
        {kosong ? "Tidak ada antrian" : `Panggil berikutnya · ${poli.menunggu[0].kode}`}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button
          varian="kedua"
          disabled={sibuk || !poli.kodeDipanggil}
          onClick={() => onAksi({ jenis: "panggil-ulang", poliId: poli.poliId })}
        >
          Panggil ulang
        </Button>
        <Button
          varian="kedua"
          disabled={sibuk || !poli.tiketDipanggilId}
          onClick={() =>
            poli.tiketDipanggilId &&
            onAksi({
              jenis: "tidak-hadir",
              tiketId: poli.tiketDipanggilId,
              kode: poli.kodeDipanggil ?? "",
            })
          }
        >
          Tidak hadir
        </Button>
      </div>

      <Button varian="kedua" disabled={sibuk} onClick={() => setNomorBaru(true)}>
        + Nomor baru
      </Button>

      <section aria-label="Daftar menunggu" className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-slate-700">Menunggu (urutan panggil)</h2>
        {kosong && <p className="text-base text-slate-600">Belum ada nomor menunggu.</p>}
        <ol className="flex flex-col gap-2">
          {poli.menunggu.map((t, i) => (
            <li
              key={t.tiketId}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-right text-sm text-slate-500">{i + 1}.</span>
                <span className="font-angka text-2xl font-bold tabular-nums">{t.kode}</span>
                {t.prioritas && t.alasanPrioritas && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-900">
                    Prioritas · {LABEL_ALASAN[t.alasanPrioritas]}
                  </span>
                )}
              </div>
              {!t.prioritas && (
                <Button
                  varian="teks"
                  className="min-h-12 px-2 text-base"
                  disabled={sibuk}
                  onClick={() => setPrioritasUntuk({ tiketId: t.tiketId, kode: t.kode })}
                >
                  Prioritaskan
                </Button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <DialogNomorBaru
        key={nomorBaru ? "nomor-buka" : "nomor-tutup"}
        namaPoli={poli.nama}
        terbuka={nomorBaru}
        proses={sibuk}
        onTutup={() => setNomorBaru(false)}
        onBuat={async (data) => {
          if (await onAksi({ jenis: "nomor-baru", poliId: poli.poliId, ...data })) {
            setNomorBaru(false);
          }
        }}
      />
      <DialogPrioritas
        key={`prioritas-${prioritasUntuk?.tiketId ?? "tutup"}`}
        kode={prioritasUntuk?.kode ?? ""}
        terbuka={prioritasUntuk !== null}
        onTutup={() => setPrioritasUntuk(null)}
        onPilih={async (alasan) => {
          if (!prioritasUntuk) return;
          await onAksi({ jenis: "prioritas", ...prioritasUntuk, alasan });
          setPrioritasUntuk(null);
        }}
      />
    </div>
  );
}
