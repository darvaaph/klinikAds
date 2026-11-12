"use client";

import { useEffect, useRef, useState } from "react";
import { umumkan } from "@/lib/suara";
import type { Tampilan } from "@/types/api";

export const DURASI_KARTU_MS = 6000;

export type KartuAntre = {
  id: string;
  poliId: string;
  kode: string;
  jenis: "baru" | "ulang";
  namaPoli: string;
  ruang: string;
  prioritas: boolean;
};

export type Sorot = { poliId: string; ke: number } | null;

/**
 * FIFO queue of call cards (PRD F-002). Every `panggilan` id is handled once: ids
 * already in the first snapshot, or that arrive before the "Mulai" screen is
 * dismissed, are only marked as seen. Each card shows for 6 s; when it leaves, its
 * poli becomes the highlighted one and blinks.
 */
export function useAntreanPanggilan(tampilan: Tampilan, aktif: boolean) {
  const { panggilanTerakhir, poli } = tampilan;

  const sudahDilihat = useRef<Set<string> | null>(null);
  sudahDilihat.current ??= new Set(panggilanTerakhir.map((p) => p.id));

  const [antrean, setAntrean] = useState<KartuAntre[]>([]);
  const [sorot, setSorot] = useState<Sorot>(() => {
    const terakhir = panggilanTerakhir.at(-1);
    return terakhir ? { poliId: terakhir.poliId, ke: 0 } : null;
  });

  // New calls from the latest snapshot.
  useEffect(() => {
    const dilihat = sudahDilihat.current!;
    const baru = panggilanTerakhir.filter((p) => !dilihat.has(p.id));
    if (baru.length === 0) return;
    for (const p of baru) dilihat.add(p.id);
    if (!aktif) return;
    const kartu = baru.flatMap((p): KartuAntre[] => {
      const info = poli.find((x) => x.poliId === p.poliId);
      if (!info) return [];
      return [
        {
          ...p,
          namaPoli: info.nama,
          ruang: info.ruang,
          prioritas: info.kodeDipanggil === p.kode && info.dipanggilPrioritas,
        },
      ];
    });
    setAntrean((a) => [...a, ...kartu]);
  }, [panggilanTerakhir, poli, aktif]);

  const tampil = antrean[0] ?? null;

  // Show the head card for 6 s, announce it, then hand the highlight to its poli.
  useEffect(() => {
    if (!tampil) return;
    umumkan(tampil.kode, tampil.namaPoli, tampil.ruang);
    const id = setTimeout(() => {
      setAntrean((a) => a.slice(1));
      setSorot((s) => ({ poliId: tampil.poliId, ke: (s?.ke ?? 0) + 1 }));
    }, DURASI_KARTU_MS);
    return () => clearTimeout(id);
  }, [tampil]);

  return { kartu: tampil, sisa: Math.max(0, antrean.length - 1), sorot };
}
