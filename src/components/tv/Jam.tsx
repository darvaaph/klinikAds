"use client";

import { useEffect, useState } from "react";
import { formatJam, formatTanggal } from "@/lib/format";

/**
 * Date and clock in WIB. `selisihMs` is server time minus device time, so a TV
 * with a wrong system clock still shows the right time.
 */
export function Jam({ selisihMs }: { selisihMs: number }) {
  const [sekarang, setSekarang] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setSekarang(new Date(Date.now() + selisihMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selisihMs]);

  // Rendered client-only to avoid a server/client hydration mismatch on the minute.
  if (!sekarang) return null;

  return (
    <div className="flex items-baseline gap-7">
      <div className="text-[28px] font-medium text-tv-teks-2">{formatTanggal(sekarang)}</div>
      <div className="font-angka text-[60px] font-bold tabular-nums">{formatJam(sekarang)}</div>
    </div>
  );
}
