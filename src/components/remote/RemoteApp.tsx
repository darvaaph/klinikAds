"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { api, LABEL_ALASAN } from "@/lib/klien";
import { PanelPoli, type Aksi, type PoliRemote } from "./PanelPoli";

// Polling keeps several phones in sync until Supabase Realtime is added (T-012).
const INTERVAL_MS = 2000;

type Toast = { jenis: "ok" | "galat"; teks: string } | null;

function bacaTab(slug: string): string | null {
  try {
    return localStorage.getItem(`lk-remote-tab:${slug}`);
  } catch {
    return null;
  }
}

function simpanTab(slug: string, poliId: string) {
  try {
    localStorage.setItem(`lk-remote-tab:${slug}`, poliId);
  } catch {
    // Private mode or blocked storage: the tab just isn't remembered.
  }
}

/** Maps a remote action to its endpoint in API §3. */
function kirimAksi(dasar: string, aksi: Aksi) {
  switch (aksi.jenis) {
    case "panggil":
    case "panggil-ulang":
      return api<{ kode: string }>(`${dasar}/${aksi.jenis}`, {
        method: "POST",
        body: { poliId: aksi.poliId },
      });
    case "tidak-hadir":
      return api<{ kode?: string }>(`${dasar}/tiket/${aksi.tiketId}`, {
        method: "PATCH",
        body: { status: "tidak_hadir" },
      });
    case "prioritas":
      return api<{ kode?: string }>(`${dasar}/tiket/${aksi.tiketId}/prioritas`, {
        method: "POST",
        body: { alasanPrioritas: aksi.alasan },
      });
    case "nomor-baru":
      return api<{ kode: string }>(`${dasar}/tiket`, {
        method: "POST",
        body: {
          poliId: aksi.poliId,
          penjamin: aksi.penjamin,
          alasanPrioritas: aksi.alasanPrioritas,
        },
      });
  }
}

export function RemoteApp({ slug, namaKlinik }: { slug: string; namaKlinik: string }) {
  const router = useRouter();
  const [poli, setPoli] = useState<PoliRemote[] | null>(null);
  const [aktif, setAktif] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [offline, setOffline] = useState(false);
  const [resetBuka, setResetBuka] = useState(false);
  const [ketikReset, setKetikReset] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tampilkanToast = useCallback((t: NonNullable<Toast>) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), t.jenis === "ok" ? 2500 : 5000);
  }, []);

  const muat = useCallback(async () => {
    const res = await api<{ poli: PoliRemote[] }>(`/api/klinik/${slug}/remote`);
    if (res.ok) {
      setOffline(false);
      setPoli(res.data.poli);
      setAktif((a) => {
        if (a && res.data.poli.some((p) => p.poliId === a)) return a;
        const tersimpan = bacaTab(slug);
        return (
          res.data.poli.find((p) => p.poliId === tersimpan)?.poliId ??
          res.data.poli[0]?.poliId ??
          null
        );
      });
    } else if (res.error.kode === "BELUM_LOGIN" || res.error.kode === "BUKAN_KLINIK_ANDA") {
      router.refresh(); // session expired: the page swaps to the PIN form
    } else {
      setOffline(true);
    }
  }, [slug, router]);

  useEffect(() => {
    muat();
    const id = setInterval(muat, INTERVAL_MS);
    return () => clearInterval(id);
  }, [muat]);

  async function jalankan(aksi: Aksi): Promise<boolean> {
    setSibuk(true);
    const res = await kirimAksi(`/api/klinik/${slug}`, aksi);
    await muat();
    setSibuk(false);

    if (!res.ok) {
      tampilkanToast({ jenis: "galat", teks: res.error.pesan });
      return false;
    }
    const kode = (res.data as { kode?: string } | null)?.kode;
    const pesan =
      aksi.jenis === "panggil"
        ? `${kode} dipanggil ke TV`
        : aksi.jenis === "panggil-ulang"
          ? `${kode} dipanggil ulang`
          : aksi.jenis === "tidak-hadir"
            ? `${aksi.kode} ditandai tidak hadir`
            : aksi.jenis === "prioritas"
              ? `${aksi.kode} diprioritaskan (${LABEL_ALASAN[aksi.alasan]})`
              : `Nomor ${kode} dibuat`;
    tampilkanToast({ jenis: "ok", teks: pesan });
    return true;
  }

  async function reset() {
    setSibuk(true);
    const res = await api(`/api/klinik/${slug}/reset-demo`, {
      method: "POST",
      body: { konfirmasi: ketikReset },
    });
    await muat();
    setSibuk(false);
    setResetBuka(false);
    setKetikReset("");
    tampilkanToast(
      res.ok
        ? { jenis: "ok", teks: "Antrian hari ini dikosongkan" }
        : { jenis: "galat", teks: res.error.pesan },
    );
  }

  async function keluar() {
    await api("/api/remote/logout", { method: "POST" });
    router.refresh();
  }

  const poliAktif = poli?.find((p) => p.poliId === aktif) ?? null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-4 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
            Remote antrian
          </p>
          <h1 className="truncate text-xl font-bold text-slate-900">{namaKlinik}</h1>
        </div>
        <Button varian="teks" className="min-h-12 shrink-0 px-2 text-base" onClick={keluar}>
          Keluar
        </Button>
      </header>

      {offline && (
        <p role="status" className="rounded-xl bg-amber-100 px-4 py-3 text-base text-amber-950">
          Koneksi ke server terputus. Data di bawah mungkin belum terbaru.
        </p>
      )}

      {!poli && <p className="text-base text-slate-600">Memuat antrian…</p>}

      {poli && (
        <div role="tablist" aria-label="Pilih poli" className="flex gap-2 overflow-x-auto pb-1">
          {poli.map((p) => {
            const dipilih = p.poliId === aktif;
            return (
              <button
                key={p.poliId}
                role="tab"
                type="button"
                aria-selected={dipilih}
                onClick={() => {
                  setAktif(p.poliId);
                  simpanTab(slug, p.poliId);
                }}
                className={`flex min-h-14 shrink-0 flex-col items-start justify-center rounded-xl border-2 px-4 text-left ${
                  dipilih
                    ? "border-klinik bg-klinik text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <span className="text-base font-semibold whitespace-nowrap">{p.nama}</span>
                <span className={`text-sm ${dipilih ? "opacity-90" : "text-slate-600"}`}>
                  {p.menunggu.length} menunggu
                </span>
              </button>
            );
          })}
        </div>
      )}

      {poliAktif && (
        <PanelPoli key={poliAktif.poliId} poli={poliAktif} sibuk={sibuk} onAksi={jalankan} />
      )}

      {poli && (
        <Button
          varian="bahaya"
          className="mt-4"
          disabled={sibuk}
          onClick={() => setResetBuka(true)}
        >
          Reset demo
        </Button>
      )}

      <Dialog terbuka={resetBuka} onTutup={() => setResetBuka(false)} judul="Reset demo?">
        <p className="text-base text-slate-700">
          Semua nomor antrian hari ini di {namaKlinik} akan dihapus, dan nomor mulai lagi dari 001.
        </p>
        <label htmlFor="ketik-reset" className="text-base font-medium text-slate-800">
          Ketik <span className="font-mono font-bold">RESET</span> untuk melanjutkan
        </label>
        <input
          id="ketik-reset"
          value={ketikReset}
          onChange={(e) => setKetikReset(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          className="min-h-14 rounded-xl border-2 border-slate-300 px-4 text-lg uppercase"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button varian="kedua" onClick={() => setResetBuka(false)}>
            Batal
          </Button>
          <Button varian="bahaya" disabled={ketikReset !== "RESET" || sibuk} onClick={reset}>
            Reset
          </Button>
        </div>
      </Dialog>

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4"
      >
        {toast && (
          <p
            role={toast.jenis === "galat" ? "alert" : "status"}
            className={`max-w-md rounded-xl px-5 py-3 text-base font-medium text-white shadow-lg ${
              toast.jenis === "ok" ? "bg-slate-900" : "bg-red-800"
            }`}
          >
            {toast.teks}
          </p>
        )}
      </div>
    </main>
  );
}
