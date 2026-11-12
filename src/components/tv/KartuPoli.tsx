import type { Tampilan } from "@/types/api";
import { BadgeTv } from "./BadgeTv";

type Poli = Tampilan["poli"][number];

/** Card mode (≤ 4 poli): number 112 px. `rapat` tightens spacing so 4 cards fit. */
export function KartuPoli({
  poli,
  disorot,
  rapat,
}: {
  poli: Poli;
  disorot: boolean;
  rapat: boolean;
}) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col justify-center rounded-[20px] border-2 px-7 ${
        rapat ? "gap-1 py-3" : "gap-1.5 py-5"
      } ${disorot ? "tv-kedip border-klinik bg-klinik text-white" : "border-tv-garis bg-tv-kartu"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-[32px] leading-tight font-bold">{poli.nama}</div>
        {/* One badge per line so the poli name is never cut. With 4 cards there is no
            "Berikutnya" line, so "Prioritas" takes this spot instead. */}
        {disorot && (
          <BadgeTv>{rapat && poli.dipanggilPrioritas ? "Prioritas" : "DIPANGGIL"}</BadgeTv>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="font-angka shrink-0 text-[112px] leading-none font-bold whitespace-nowrap tabular-nums">
          {poli.kodeDipanggil ?? "–"}
        </div>
        {/* A long room name ("Loket Obat") wraps to two lines instead of being cut. */}
        <div
          className={`line-clamp-2 min-w-0 text-right text-[28px] leading-tight font-semibold ${
            disorot ? "" : "text-tv-teks-2"
          }`}
        >
          {poli.ruang}
        </div>
      </div>
      {/* With 4 cards there is no room for this line (see docs/KEPUTUSAN.md). */}
      {!rapat && (
        <div className="flex items-center justify-between gap-3">
          <div className={`text-[28px] ${disorot ? "text-[#D3E6E9]" : "text-tv-teks-2"}`}>
            Berikutnya {poli.kodeBerikutnya ?? "–"}
          </div>
          {disorot && poli.dipanggilPrioritas && <BadgeTv>Prioritas</BadgeTv>}
        </div>
      )}
    </div>
  );
}
