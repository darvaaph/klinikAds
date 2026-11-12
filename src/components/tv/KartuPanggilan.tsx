import type { KartuAntre } from "@/hooks/useAntreanPanggilan";
import { DURASI_KARTU_MS } from "@/hooks/useAntreanPanggilan";
import { BadgeTv } from "./BadgeTv";

/** Full-screen call card, design C (artifact "Layar TV Antrian + Iklan Klinik"). */
export function KartuPanggilan({ kartu, sisa }: { kartu: KartuAntre; sisa: number }) {
  return (
    <div
      role="alert"
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#0E1A1C]/85"
    >
      <div className="relative flex w-[1240px] flex-col items-center gap-5 overflow-hidden rounded-[32px] bg-white px-[72px] pt-16 text-center">
        <div className="flex items-center gap-4 text-[34px] font-semibold tracking-[0.04em] text-[#3C5458]">
          {kartu.jenis === "ulang" ? "PANGGILAN ULANG" : "NOMOR ANTRIAN"}
          {kartu.prioritas && <BadgeTv>Prioritas</BadgeTv>}
        </div>
        <div className="font-angka text-[300px] leading-[0.9] font-bold whitespace-nowrap text-[#0B3B3C] tabular-nums">
          {kartu.kode}
        </div>
        <div className="text-[36px] text-[#3C5458]">silakan menuju</div>
        <div className="flex max-w-full items-center gap-5 rounded-full bg-klinik px-10 py-[18px] text-white">
          <div className="truncate text-[52px] font-bold">{kartu.namaPoli}</div>
          <div className="h-11 w-[3px] shrink-0 bg-white/50" />
          <div className="truncate text-[44px] font-semibold">{kartu.ruang}</div>
        </div>
        <div className="mt-3 mb-10 h-[34px] text-[28px] text-[#4D6366]">
          {sisa > 0 ? `${sisa} panggilan lagi` : ""}
        </div>
        {/* 6 s countdown; key restarts it for every card. */}
        <div className="-mx-[72px] h-3 self-stretch bg-[#E2ECEB]">
          <div
            key={kartu.id}
            className="tv-hitung-mundur h-3 bg-[#0B3B3C]"
            style={{ animationDuration: `${DURASI_KARTU_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
