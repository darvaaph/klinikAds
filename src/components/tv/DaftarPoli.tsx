import type { Tampilan } from "@/types/api";
import { BadgeTv } from "./BadgeTv";

type Poli = Tampilan["poli"][number];

/**
 * List mode (5–6 poli): one row per poli, number 100 px. The highlighted row gets a
 * third line for its badge; rows have no min-h-0, so it grows and the others shrink.
 */
export function DaftarPoli({
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
      className={`flex flex-1 items-center justify-between gap-4 rounded-[18px] border-2 px-7 ${
        rapat ? "py-1" : "py-2"
      } ${disorot ? "tv-kedip border-klinik bg-klinik text-white" : "border-tv-garis bg-tv-kartu"}`}
    >
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <div className="max-w-full truncate text-[30px] leading-tight font-bold">{poli.nama}</div>
        <div
          className={`max-w-full truncate text-[28px] leading-tight ${disorot ? "" : "text-tv-teks-2"}`}
        >
          {poli.ruang}
        </div>
        {disorot && <BadgeTv>{poli.dipanggilPrioritas ? "Prioritas" : "DIPANGGIL"}</BadgeTv>}
      </div>
      <div className="font-angka shrink-0 text-[100px] leading-none font-bold whitespace-nowrap tabular-nums">
        {poli.kodeDipanggil ?? "–"}
      </div>
    </div>
  );
}
