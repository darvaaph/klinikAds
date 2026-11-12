"use client";

import { useCallback, useState } from "react";
import { useAntreanPanggilan } from "@/hooks/useAntreanPanggilan";
import { useTampilan } from "@/hooks/useTampilan";
import { bukaKunciAudio } from "@/lib/suara";
import type { Tampilan } from "@/types/api";
import { Jam } from "./Jam";
import { KartuPanggilan } from "./KartuPanggilan";
import { LayarMulai } from "./LayarMulai";
import { PanelAntrian } from "./PanelAntrian";
import { PemutarKonten } from "./PemutarKonten";
import { RunningText } from "./RunningText";
import { ScaleToFit } from "./ScaleToFit";
import { StripSponsor } from "./StripSponsor";

// Layout from design A (artifact "Layar TV Antrian + Iklan Klinik"):
// safe zone 96/54 px, header 80, footer 64, gaps 24/32, queue panel 520, media 16:9,
// sponsor strip fills the rest of the right column.
export function PlayerTv({ slug, awal }: { slug: string; awal: Tampilan }) {
  const { tampilan, selisihMs } = useTampilan(slug, awal);
  const { klinik } = tampilan;

  const [mulai, setMulai] = useState(false);
  const [tayang, setTayang] = useState<Tampilan["playlist"][number] | null>(null);
  const { kartu, sisa, sorot } = useAntreanPanggilan(tampilan, mulai);

  const tekanMulai = useCallback(() => {
    // Unlock inside the gesture, then show the player right away.
    void bukaKunciAudio();
    setMulai(true);
  }, []);

  return (
    <ScaleToFit>
      <div
        className="relative h-full w-full font-sans text-tv-teks"
        style={{ "--warna-klinik": klinik.warnaUtama } as React.CSSProperties}
      >
        <div className="flex h-full w-full flex-col gap-6 bg-tv-latar px-24 py-[54px]">
          <header className="flex h-20 shrink-0 items-center justify-between">
            <div className="flex min-w-0 items-center gap-5">
              {klinik.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- logo comes from Storage later
                <img
                  src={klinik.logoUrl}
                  alt=""
                  className="h-[72px] w-[72px] rounded-2xl bg-white object-contain"
                />
              )}
              <h1 className="truncate text-[40px] font-bold tracking-[-0.01em]">{klinik.nama}</h1>
            </div>
            <Jam selisihMs={selisihMs} />
          </header>

          <div className="flex min-h-0 flex-1 gap-8">
            <PanelAntrian tampilan={tampilan} sorot={sorot} />

            <section aria-label="Iklan dan edukasi" className="flex min-w-0 flex-1 flex-col gap-6">
              {/* Paused while a call card is up or before "Mulai"; resumes afterwards. */}
              <PemutarKonten
                playlist={tampilan.playlist}
                dijeda={!mulai || kartu !== null}
                onTayang={setTayang}
              />
              <StripSponsor
                // Fresh sponsor name/logo from the latest snapshot, not the item captured at rotation time.
                item={tampilan.playlist.find((p) => p.kontenId === tayang?.kontenId) ?? tayang}
                namaKlinik={klinik.nama}
              />
            </section>
          </div>

          <RunningText teks={tampilan.runningText} />
        </div>

        {kartu && <KartuPanggilan kartu={kartu} sisa={sisa} />}
        {!mulai && <LayarMulai onMulai={tekanMulai} namaKlinik={klinik.nama} />}
      </div>
    </ScaleToFit>
  );
}
