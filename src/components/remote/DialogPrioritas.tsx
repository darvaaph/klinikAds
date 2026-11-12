"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { LABEL_ALASAN, type Alasan } from "@/lib/klien";

/** Prioritas always needs a reason (PRD F-003): there is no "just move it up". */
export function DialogPrioritas({
  kode,
  terbuka,
  onTutup,
  onPilih,
}: {
  kode: string;
  terbuka: boolean;
  onTutup: () => void;
  onPilih: (alasan: Alasan) => void;
}) {
  const [alasan, setAlasan] = useState<Alasan | null>(null);
  return (
    <Dialog terbuka={terbuka} onTutup={onTutup} judul={`Prioritaskan ${kode}`}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base text-slate-700">Pilih alasan prioritas:</legend>
        {(Object.keys(LABEL_ALASAN) as Alasan[]).map((a) => (
          <label
            key={a}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 px-4 text-lg has-[:checked]:border-klinik has-[:checked]:bg-slate-50"
          >
            <input
              type="radio"
              name="alasan"
              value={a}
              checked={alasan === a}
              onChange={() => setAlasan(a)}
              className="size-5 accent-[var(--warna-klinik)]"
            />
            {LABEL_ALASAN[a]}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Button varian="kedua" onClick={onTutup}>
          Batal
        </Button>
        <Button disabled={!alasan} onClick={() => alasan && onPilih(alasan)}>
          Prioritaskan
        </Button>
      </div>
    </Dialog>
  );
}
