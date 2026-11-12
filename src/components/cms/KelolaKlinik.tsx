"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PanelSamping } from "@/components/ui/PanelSamping";
import { api } from "@/lib/klien";
import { kontras, KONTRAS_MINIMUM } from "@/lib/kontras";
import { cekFileLokal, unggahFile } from "@/lib/unggah";
import { KepalaHalaman } from "./KepalaHalaman";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";
import { PilihFile } from "./PilihFile";

type Klinik = {
  id: string;
  slug: string;
  nama: string;
  warnaUtama: string;
  logoUrl: string | null;
  modeTampilan: "otomatis" | "kartu" | "daftar";
  jumlahPoli: number;
};

function rasio(warna: string): number | null {
  try {
    return /^#[0-9a-f]{6}$/i.test(warna) ? kontras(warna, "#FFFFFF") : null;
  } catch {
    return null;
  }
}

function FormKlinik({
  klinik,
  onTersimpan,
}: {
  klinik: Klinik;
  onTersimpan: (teks: string) => void;
}) {
  const [nama, setNama] = useState(klinik.nama);
  const [warna, setWarna] = useState(klinik.warnaUtama);
  const [mode, setMode] = useState(klinik.modeTampilan);
  const [logoUrl, setLogoUrl] = useState(klinik.logoUrl);
  const [namaLogo, setNamaLogo] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [progres, setProgres] = useState<number | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);

  const r = rasio(warna);
  const kontrasOk = r !== null && r >= KONTRAS_MINIMUM;

  async function pilihLogo(file: File | undefined) {
    if (!file) return;
    const masalah = cekFileLokal(file, "gambar");
    if (masalah) return setPesan({ jenis: "galat", teks: masalah });
    setProgres(0);
    const hasil = await unggahFile(file, "gambar", setProgres);
    setProgres(null);
    if (!hasil.ok) return setPesan({ jenis: "galat", teks: hasil.pesan });
    setLogoUrl(`/api/media/${hasil.path}`);
    setNamaLogo(file.name);
    setPesan({ jenis: "ok", teks: "Logo terunggah. Tekan Simpan untuk menerapkan." });
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const res = await api(`/api/cms/klinik/${klinik.id}`, {
      method: "PATCH",
      body: {
        nama,
        warnaUtama: warna,
        modeTampilan: mode,
        logoUrl,
        ...(pin ? { pinRemoteBaru: pin } : {}),
      },
    });
    setProses(false);
    if (!res.ok) return setPesan({ jenis: "galat", teks: res.error.pesan });
    onTersimpan(`${nama} tersimpan. TV klinik ini berubah dalam ±2 detik.`);
  }

  return (
    <form onSubmit={simpan} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`nama-${klinik.id}`} className={kelasLabel}>
          Nama klinik
        </label>
        <input
          id={`nama-${klinik.id}`}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          minLength={3}
          maxLength={80}
          required
          className={kelasInput}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`warna-${klinik.id}`} className={kelasLabel}>
            Warna utama
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Pilih warna"
              value={/^#[0-9a-f]{6}$/i.test(warna) ? warna : "#000000"}
              onChange={(e) => setWarna(e.target.value.toUpperCase())}
              className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-2 border-slate-300"
            />
            <input
              id={`warna-${klinik.id}`}
              value={warna}
              onChange={(e) => setWarna(e.target.value.trim())}
              pattern="#[0-9A-Fa-f]{6}"
              aria-describedby={`kontras-${klinik.id}`}
              className={`${kelasInput} font-mono uppercase`}
            />
          </div>
          <p
            id={`kontras-${klinik.id}`}
            className={`text-sm ${kontrasOk ? "text-emerald-800" : "text-red-800"}`}
          >
            {r === null
              ? "Tulis warna dengan format #RRGGBB."
              : `Kontras dengan teks putih ${r.toFixed(2)}:1 · ${
                  kontrasOk ? "lolos" : `kurang dari ${KONTRAS_MINIMUM}:1, akan ditolak`
                }`}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={kelasLabel}>Pratinjau di TV</span>
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3 text-white"
            style={{ background: r === null ? "#94A3B8" : warna }}
          >
            <div>
              <p className="font-bold">Poli Umum</p>
              <p className="font-angka text-3xl font-bold tabular-nums">A-013</p>
            </div>
            <span className="rounded-full bg-tv-penanda px-2.5 py-0.5 text-sm font-bold text-[#1D1606]">
              DIPANGGIL
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className={kelasLabel}>Logo</span>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo saat ini"
                className="size-14 shrink-0 rounded-xl border border-slate-200 object-contain"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
                style={{ background: r === null ? "#94A3B8" : warna }}
              >
                {nama.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <PilihFile
                id={`logo-${klinik.id}`}
                accept="image/jpeg,image/png,image/webp"
                aturan="JPG/PNG/WebP, maks 5 MB"
                namaFile={namaLogo}
                disabled={progres !== null}
                onPilih={pilihLogo}
              />
            </div>
          </div>
          {progres !== null && (
            <progress
              value={progres}
              max={100}
              className="w-full"
              aria-label="Progres unggah logo"
            />
          )}
          {logoUrl && (
            <button
              type="button"
              onClick={() => {
                setLogoUrl(null);
                setNamaLogo(null);
              }}
              className="self-start text-sm text-slate-700 underline"
            >
              Hapus logo
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`mode-${klinik.id}`} className={kelasLabel}>
            Mode panel antrian ({klinik.jumlahPoli} poli)
          </label>
          <select
            id={`mode-${klinik.id}`}
            value={mode}
            onChange={(e) => setMode(e.target.value as Klinik["modeTampilan"])}
            className={kelasInput}
          >
            <option value="otomatis">Otomatis (kartu ≤ 4 poli, daftar 5–6 poli)</option>
            <option value="kartu">Kartu (hanya berlaku sampai 4 poli)</option>
            <option value="daftar">Daftar</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor={`pin-${klinik.id}`} className={kelasLabel}>
          PIN remote baru (opsional, 6 angka)
        </label>
        <input
          id={`pin-${klinik.id}`}
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className={`${kelasInput} font-mono tracking-widest`}
        />
        <p className="text-sm text-slate-600">Kosongkan kalau PIN tidak diganti.</p>
      </div>

      {pesan && <Pesan jenis={pesan.jenis}>{pesan.teks}</Pesan>}

      <Button
        type="submit"
        className="self-start"
        disabled={proses || progres !== null || !kontrasOk || (pin.length > 0 && pin.length !== 6)}
      >
        {proses ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}

const LABEL_MODE: Record<Klinik["modeTampilan"], string> = {
  otomatis: "Otomatis",
  kartu: "Kartu",
  daftar: "Daftar",
};

function KartuKlinik({ klinik, onUbah }: { klinik: Klinik; onUbah: () => void }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-4">
        {klinik.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={klinik.logoUrl}
            alt=""
            className="size-14 shrink-0 rounded-xl border border-slate-200 object-contain"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ background: klinik.warnaUtama }}
          >
            {klinik.nama.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-bold">{klinik.nama}</h2>
          <p className="font-mono text-sm text-slate-600">/{klinik.slug}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-y border-slate-100 py-3 text-sm">
        <div>
          <dt className="text-slate-600">Poli</dt>
          <dd className="text-base font-semibold tabular-nums">{klinik.jumlahPoli}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Panel</dt>
          <dd className="text-base font-semibold">{LABEL_MODE[klinik.modeTampilan]}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Warna</dt>
          <dd className="flex items-center gap-1.5 font-mono text-base font-semibold">
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded"
              style={{ background: klinik.warnaUtama }}
            />
            {klinik.warnaUtama}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex gap-5 text-base">
          <a className="text-slate-700 underline" href={`/tv/${klinik.slug}`} target="_blank">
            Buka TV
          </a>
          <a className="text-slate-700 underline" href={`/remote/${klinik.slug}`} target="_blank">
            Buka remote
          </a>
        </div>
        <Button varian="kedua" onClick={onUbah} className="min-h-11 w-full text-base">
          Ubah pengaturan
        </Button>
      </div>
    </li>
  );
}

export function KelolaKlinik() {
  const [klinik, setKlinik] = useState<Klinik[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dipilih, setDipilih] = useState<Klinik | null>(null);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const res = await api<Klinik[]>("/api/cms/klinik");
    if (res.ok) setKlinik(res.data);
    else setGalat(res.error.pesan);
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman
        judul="Klinik"
        keterangan="Nama, warna, logo, dan PIN remote setiap klinik. Perubahan langsung terlihat di TV."
      />
      {berhasil && <Pesan jenis="ok">{berhasil}</Pesan>}
      {galat && <Pesan jenis="galat">{galat}</Pesan>}
      {!klinik && !galat && <p className="text-slate-600">Memuat daftar klinik…</p>}
      {klinik && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {klinik.map((k) => (
            <KartuKlinik
              key={k.id}
              klinik={k}
              onUbah={() => {
                setBerhasil(null);
                setDipilih(k);
              }}
            />
          ))}
        </ul>
      )}

      <PanelSamping
        terbuka={dipilih !== null}
        onTutup={() => setDipilih(null)}
        judul={dipilih ? `Ubah ${dipilih.nama}` : ""}
        keterangan={dipilih ? `${dipilih.jumlahPoli} poli · /${dipilih.slug}` : undefined}
      >
        {dipilih && (
          <FormKlinik
            key={dipilih.id}
            klinik={dipilih}
            onTersimpan={(teks) => {
              setDipilih(null);
              setBerhasil(teks);
              muat();
            }}
          />
        )}
      </PanelSamping>
    </div>
  );
}
