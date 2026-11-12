"use client";

import { useEffect, useState } from "react";
import type { Respons } from "@/lib/respons";
import type { Tampilan } from "@/types/api";

// Polling stands in for Supabase Realtime until the backend phase (docs/KEPUTUSAN.md).
const INTERVAL_MS = 2000;

/**
 * Keeps the TV snapshot fresh. Returns the latest snapshot and the offset between
 * server and device clocks. On a failed fetch the last good snapshot stays on screen.
 */
export function useTampilan(slug: string, awal: Tampilan) {
  const [tampilan, setTampilan] = useState(awal);
  const [selisihMs, setSelisihMs] = useState(0);

  useEffect(() => {
    let aktif = true;
    let sedangAmbil = false;

    const ambil = async () => {
      if (sedangAmbil) return;
      sedangAmbil = true;
      try {
        const res = await fetch(`/api/klinik/${slug}/tampilan`, { cache: "no-store" });
        const json = (await res.json()) as Respons<Tampilan>;
        if (aktif && json.ok) {
          setTampilan(json.data);
          setSelisihMs(new Date(json.data.waktuServer).getTime() - Date.now());
        }
      } catch {
        // Keep showing the last snapshot; offline badge comes in T-012.
      } finally {
        sedangAmbil = false;
      }
    };

    ambil();
    const id = setInterval(ambil, INTERVAL_MS);
    return () => {
      aktif = false;
      clearInterval(id);
    };
  }, [slug]);

  return { tampilan, selisihMs };
}
