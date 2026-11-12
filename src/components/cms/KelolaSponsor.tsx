"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PanelSamping } from "@/components/ui/PanelSamping";
import { api } from "@/lib/klien";
import { cekFileLokal, unggahFile } from "@/lib/unggah";
import { KepalaHalaman } from "./KepalaHalaman";
import { LABEL_KATEGORI_SPONSOR, type Sponsor } from "./label";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";
import { PilihFile } from "./PilihFile";

type Kategori = keyof typeof LABEL_KATEGORI_SPONSOR;

function LogoSponsor({ nama, logoUrl }: { nama: string; logoUrl: string | null }) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      className="size-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl font-bold text-slate-700"
    >
      {nama.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Create (sponsor = null) or edit a sponsor. Logo is optional; the TV shows the name either way. */
function FormSponsor({
  sponsor,
  onTersimpan,
}: {
  sponsor: Sponsor | null;
  onTersimpan: (teks: string) => void;
}) {
  const [nama, setNama] = useState(sponsor?.nama ?? "");
  const [kategori, setKategori] = useState<Kategori>(
    (sponsor?.kategori as Kategori | undefined) ?? "bank",
  );
  const [kontak, setKontak] = useState(sponsor?.kontak ?? "");
  const [logoUrl, setLogoUrl] = useState(sponsor?.logoUrl ?? null);
  const [namaLogo, setNamaLogo] = useState<string | null>(null);
  const [progres, setProgres] = useState<number | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);

  async function pilihLogo(file: File | undefined) {
    if (!file) return;
    setPesan(null);
    const masalah = cekFileLokal(file, "gambar");
    if (masalah) return setPesan({ jenis: "galat", teks: masalah });
    setProgres(0);
    const hasil = await unggahFile(file, "gambar", setProgres);
    setProgres(null);
    if (!hasil.ok) return setPesan({ jenis: "galat", teks: hasil.pesan });
    setLogoUrl(`/api/media/${hasil.path}`);
    setNamaLogo(file.name);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const body = {
      nama,
      kategori,
      kontak: kontak.trim() || null,
      // Only send the logo when it changed: sample logos live in /contoh and are not re-validated.
      ...(logoUrl !== (sponsor?.logoUrl ?? null) ? { logoUrl } : {}),
    };
    const res = sponsor
      ? await api(`/api/cms/sponsor/${sponsor.id}`, { method: "PATCH", body })
      : await api("/api/cms/sponsor", { method: "POST", body });
    setProses(false);
    if (!res.ok) return setPesan({ jenis: "galat", teks: res.error.pesan });
    onTersimpan(
      sponsor
        ? `${nama} tersimpan. Strip sponsor di TV ikut berubah dalam ±2 detik.`
        : `${nama} ditambahkan. Pilih sponsor ini saat menambah konten iklan.`,
    );
  }

  return (
    <form onSubmit={simpan} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sp-nama" className={kelasLabel}>
          Nama sponsor
        </label>
        <input
          id="sp-nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          minLength={2}
          maxLength={80}
          required
          className={kelasInput}
        />
        <p className="text-sm text-slate-600">
          Tampil di TV sebagai &ldquo;Dipersembahkan oleh {nama.trim() || "…"}&rdquo;.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={kelasLabel}>Logo (opsional)</span>
        <div className="flex items-center gap-3">
          <LogoSponsor nama={nama} logoUrl={logoUrl} />
          <div className="min-w-0 flex-1">
            <PilihFile
              id="sp-logo"
              accept="image/jpeg,image/png,image/webp"
              aturan="JPG/PNG/WebP, maks 5 MB. Sebaiknya persegi dengan latar polos."
              namaFile={namaLogo}
              disabled={progres !== null}
              onPilih={pilihLogo}
            />
          </div>
        </div>
        {progres !== null && (
          <progress value={progres} max={100} className="w-full" aria-label="Progres unggah logo" />
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
            Hapus logo (TV hanya menampilkan nama)
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-kategori" className={kelasLabel}>
            Kategori
          </label>
          <select
            id="sp-kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value as Kategori)}
            className={kelasInput}
          >
            {Object.entries(LABEL_KATEGORI_SPONSOR).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-kontak" className={kelasLabel}>
            Kontak (opsional, tidak tampil di TV)
          </label>
          <input
            id="sp-kontak"
            value={kontak}
            onChange={(e) => setKontak(e.target.value)}
            maxLength={120}
            placeholder="Nama PIC atau email"
            className={kelasInput}
          />
        </div>
      </div>

      {pesan && <Pesan jenis={pesan.jenis}>{pesan.teks}</Pesan>}

      <Button type="submit" className="self-start" disabled={proses || progres !== null}>
        {proses ? "Menyimpan…" : sponsor ? "Simpan" : "Tambah sponsor"}
      </Button>
    </form>
  );
}

export function KelolaSponsor() {
  const [daftar, setDaftar] = useState<Sponsor[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  // undefined = panel closed, null = new sponsor, Sponsor = editing that one.
  const [dipilih, setDipilih] = useState<Sponsor | null | undefined>(undefined);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const res = await api<Sponsor[]>("/api/cms/sponsor");
    if (res.ok) setDaftar(res.data);
    else setGalat(res.error.pesan);
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  function buka(s: Sponsor | null) {
    setBerhasil(null);
    setDipilih(s);
  }

  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman
        judul="Sponsor"
        keterangan="Pengiklan beserta logonya. Logo dan nama tampil di strip “Dipersembahkan oleh” saat iklannya tayang."
        aksi={<Button onClick={() => buka(null)}>Tambah sponsor</Button>}
      />
      {berhasil && <Pesan jenis="ok">{berhasil}</Pesan>}
      {galat && <Pesan jenis="galat">{galat}</Pesan>}
      {!daftar && !galat && <p className="text-slate-600">Memuat daftar sponsor…</p>}
      {daftar?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-700">
          Belum ada sponsor. Tekan <strong>Tambah sponsor</strong> untuk mencatat pengiklan pertama.
        </p>
      )}
      {daftar && daftar.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {daftar.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <LogoSponsor nama={s.nama} logoUrl={s.logoUrl} />
                <div className="min-w-0">
                  <h2 className="text-lg leading-snug font-bold">{s.nama}</h2>
                  <p className="text-sm text-slate-600">
                    {LABEL_KATEGORI_SPONSOR[s.kategori as Kategori] ?? s.kategori}
                    {!s.logoUrl && " · belum ada logo"}
                  </p>
                </div>
              </div>
              <Button varian="kedua" onClick={() => buka(s)} className="mt-auto min-h-11 text-base">
                Ubah sponsor
              </Button>
            </li>
          ))}
        </ul>
      )}

      <PanelSamping
        terbuka={dipilih !== undefined}
        onTutup={() => setDipilih(undefined)}
        judul={dipilih ? `Ubah ${dipilih.nama}` : "Tambah sponsor"}
      >
        {dipilih !== undefined && (
          <FormSponsor
            key={dipilih?.id ?? "baru"}
            sponsor={dipilih}
            onTersimpan={(teks) => {
              setDipilih(undefined);
              setBerhasil(teks);
              muat();
            }}
          />
        )}
      </PanelSamping>
    </div>
  );
}
