"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { normalisasiKode } from "@/lib/format";
import { api } from "@/lib/klien";

// PRD F-004: refresh every 10 s (Realtime replaces this in the backend phase).
const INTERVAL_MS = 10_000;

type Posisi = {
  kode: string;
  poli: string;
  ruang: string;
  status: "menunggu" | "dipanggil" | "dilayani" | "selesai" | "tidak_hadir";
  kodeDipanggil: string | null;
  orangDiDepan: number;
};

function kunciSimpan(slug: string) {
  return `lk-kode:${slug}`;
}

function bacaKode(slug: string): string {
  try {
    return localStorage.getItem(kunciSimpan(slug)) ?? "";
  } catch {
    return "";
  }
}

function simpanKode(slug: string, kode: string | null) {
  try {
    if (kode) localStorage.setItem(kunciSimpan(slug), kode);
    else localStorage.removeItem(kunciSimpan(slug));
  } catch {
    // Storage blocked: the patient just types the number again next time.
  }
}

function Ringkasan({ p }: { p: Posisi }) {
  switch (p.status) {
    case "menunggu":
      return (
        <p className="text-2xl font-bold text-slate-900">
          {p.orangDiDepan === 0 ? "Anda berikutnya" : `${p.orangDiDepan} orang lagi di depan Anda`}
        </p>
      );
    case "dipanggil":
      return (
        <p className="text-2xl font-bold text-slate-900">
          Nomor Anda sedang dipanggil. Silakan ke {p.poli}, {p.ruang}.
        </p>
      );
    case "dilayani":
      return <p className="text-2xl font-bold text-slate-900">Anda sedang dilayani.</p>;
    case "selesai":
      return <p className="text-2xl font-bold text-slate-900">Selesai. Terima kasih.</p>;
    case "tidak_hadir":
      return (
        <p className="text-2xl font-bold text-slate-900">
          Nomor Anda terlewat. Silakan hubungi petugas pendaftaran.
        </p>
      );
  }
}

export function PantauAntrian({ slug, namaKlinik }: { slug: string; namaKlinik: string }) {
  const [masukan, setMasukan] = useState("");
  const [kode, setKode] = useState<string | null>(null);
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [diperbarui, setDiperbarui] = useState<Date | null>(null);

  // Restore the last number on this phone.
  useEffect(() => {
    const tersimpan = normalisasiKode(bacaKode(slug));
    if (tersimpan) setKode(tersimpan);
  }, [slug]);

  const muat = useCallback(
    async (k: string) => {
      const res = await api<Posisi>(`/api/klinik/${slug}/posisi?kode=${encodeURIComponent(k)}`);
      if (res.ok) {
        setPosisi(res.data);
        setGalat(null);
        setDiperbarui(new Date());
      } else if (res.error.kode === "TIKET_TIDAK_DITEMUKAN") {
        setPosisi(null);
        setGalat(`Nomor ${k} tidak ditemukan hari ini. Periksa lagi kode di kertas antrian Anda.`);
      } else {
        // Keep the last known position on screen; just flag that it may be stale.
        setGalat(res.error.pesan);
      }
    },
    [slug],
  );

  useEffect(() => {
    if (!kode) return;
    muat(kode);
    const id = setInterval(() => muat(kode), INTERVAL_MS);
    return () => clearInterval(id);
  }, [kode, muat]);

  function cari(e: React.FormEvent) {
    e.preventDefault();
    const k = normalisasiKode(masukan);
    if (!k) {
      setGalat("Tulis kode seperti di kertas antrian, misalnya A-014.");
      return;
    }
    setPosisi(null);
    setGalat(null);
    setKode(k);
    simpanKode(slug, k);
  }

  function ganti() {
    setKode(null);
    setPosisi(null);
    setGalat(null);
    setMasukan("");
    simpanKode(slug, null);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
          Pantau antrian
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{namaKlinik}</h1>
      </header>

      {!kode && (
        <form onSubmit={cari} className="flex flex-col gap-3">
          <label htmlFor="kode" className="text-base font-medium text-slate-800">
            Nomor antrian Anda
          </label>
          <input
            id="kode"
            value={masukan}
            onChange={(e) => setMasukan(e.target.value)}
            placeholder="Contoh: A-014"
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={galat !== null}
            aria-describedby={galat ? "galat-kode" : undefined}
            className="min-h-14 rounded-xl border-2 border-slate-300 px-4 text-2xl font-semibold uppercase placeholder:font-normal placeholder:normal-case focus:border-klinik focus:outline-none"
          />
          {galat && (
            <p id="galat-kode" role="alert" className="text-base text-red-800">
              {galat}
            </p>
          )}
          <Button type="submit">Lihat posisi</Button>
        </form>
      )}

      {kode && (
        <section aria-live="polite" className="flex flex-col gap-5">
          <div className="rounded-2xl bg-klinik p-5 text-white">
            <p className="text-base opacity-90">Nomor Anda</p>
            <p className="font-angka text-6xl leading-tight font-bold tabular-nums">{kode}</p>
            {posisi && (
              <p className="text-lg">
                {posisi.poli} · {posisi.ruang}
              </p>
            )}
          </div>

          {posisi && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <Ringkasan p={posisi} />
              <p className="text-lg text-slate-700">
                Sedang dilayani di {posisi.poli}:{" "}
                <span className="font-angka font-bold whitespace-nowrap text-slate-900 tabular-nums">
                  {posisi.kodeDipanggil ?? "–"}
                </span>
              </p>
            </div>
          )}

          {!posisi && !galat && <p className="text-base text-slate-600">Memuat posisi…</p>}
          {galat && (
            <p role="alert" className="rounded-xl bg-amber-100 px-4 py-3 text-base text-amber-950">
              {galat}
            </p>
          )}

          {diperbarui && (
            <p className="text-sm text-slate-600">
              Diperbarui otomatis setiap 10 detik. Terakhir{" "}
              {diperbarui.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}.
            </p>
          )}

          <Button varian="kedua" onClick={ganti}>
            Ganti nomor
          </Button>
        </section>
      )}

      <p className="mt-auto text-sm text-slate-600">
        Halaman ini hanya menampilkan nomor antrian, tanpa nama atau data pribadi.
      </p>
    </main>
  );
}
