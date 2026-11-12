import type { Sorot } from "@/hooks/useAntreanPanggilan";
import { pilihMode } from "@/lib/modeTampilan";
import type { Tampilan } from "@/types/api";
import { DaftarPoli } from "./DaftarPoli";
import { KartuPoli } from "./KartuPoli";

/**
 * Left queue column. `sorot` is the poli whose call card was shown last; a new
 * `sorot.ke` re-keys that item, which restarts its 3× CSS blink.
 */
export function PanelAntrian({ tampilan, sorot }: { tampilan: Tampilan; sorot: Sorot }) {
  const { poli, klinik } = tampilan;
  const mode = pilihMode(poli.length, klinik.modeTampilan);

  return (
    <section
      aria-label="Antrian per poli"
      className={`flex shrink-0 flex-col ${
        mode === "kartu"
          ? `w-[520px] ${poli.length >= 4 ? "gap-3" : "gap-4"}`
          : `w-[600px] ${poli.length >= 6 ? "gap-2" : "gap-2.5"}`
      }`}
    >
      {poli.map((p) => {
        const disorot = sorot?.poliId === p.poliId;
        const key = disorot ? `${p.poliId}-${sorot.ke}` : p.poliId;
        return mode === "kartu" ? (
          <KartuPoli key={key} poli={p} disorot={disorot} rapat={poli.length >= 4} />
        ) : (
          <DaftarPoli key={key} poli={p} disorot={disorot} rapat={poli.length >= 6} />
        );
      })}
    </section>
  );
}
