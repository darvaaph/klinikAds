"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatJam } from "@/lib/format";
import { api } from "@/lib/klien";

export function LoginPin({ slug, namaKlinik }: { slug: string; namaKlinik: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    const res = await api("/api/remote/login", { method: "POST", body: { slug, pin } });
    setProses(false);
    if (res.ok) return router.refresh();
    setPin("");
    if (res.error.kode === "TERKUNCI") {
      const sampai = (res.error.detail as { sampai?: string } | undefined)?.sampai;
      setGalat(
        sampai
          ? `Terlalu banyak PIN salah. Coba lagi pukul ${formatJam(sampai)}.`
          : res.error.pesan,
      );
    } else if (res.error.kode === "PIN_SALAH") {
      setGalat("PIN salah. Periksa lagi lalu coba ulang.");
    } else {
      setGalat(res.error.pesan);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div>
        <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
          Remote antrian
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{namaKlinik}</h1>
      </div>
      <form onSubmit={masuk} className="flex flex-col gap-4">
        <label htmlFor="pin" className="text-base font-medium text-slate-800">
          PIN petugas (6 angka)
        </label>
        <input
          id="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          aria-invalid={galat !== null}
          aria-describedby={galat ? "galat-pin" : undefined}
          className="min-h-14 rounded-xl border-2 border-slate-300 px-4 text-center font-mono text-3xl tracking-[0.5em] text-slate-900 focus:border-klinik focus:outline-none"
        />
        {galat && (
          <p id="galat-pin" role="alert" className="text-base text-red-800">
            {galat}
          </p>
        )}
        <Button type="submit" disabled={proses || pin.length !== 6}>
          {proses ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>
    </main>
  );
}
