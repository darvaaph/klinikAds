"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatJam } from "@/lib/format";
import { api } from "@/lib/klien";

export function LoginAdmin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    const res = await api("/api/cms/login", { method: "POST", body: { pin } });
    setProses(false);
    if (res.ok) {
      router.push("/cms/konten");
      router.refresh();
      return;
    }
    setPin("");
    const sampai = (res.error.detail as { sampai?: string } | undefined)?.sampai;
    setGalat(
      res.error.kode === "TERKUNCI" && sampai
        ? `Terlalu banyak PIN salah. Coba lagi pukul ${formatJam(sampai)}.`
        : res.error.kode === "PIN_SALAH"
          ? "PIN salah."
          : res.error.pesan,
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={masuk}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
            LayarKlinik
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Masuk CMS</h1>
        </div>
        <label htmlFor="pin-admin" className="text-base font-medium text-slate-800">
          PIN admin pusat
        </label>
        <input
          id="pin-admin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          aria-invalid={galat !== null}
          aria-describedby={galat ? "galat-admin" : undefined}
          className="min-h-12 rounded-lg border-2 border-slate-300 px-3 text-center font-mono text-2xl tracking-[0.4em] focus:border-slate-900 focus:outline-none"
        />
        {galat && (
          <p id="galat-admin" role="alert" className="text-base text-red-800">
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
