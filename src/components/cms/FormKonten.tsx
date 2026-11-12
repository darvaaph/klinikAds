"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/klien";
import { cekFileLokal, unggahFile, type TipeUnggah } from "@/lib/unggah";
import {
  LABEL_KATEGORI,
  LABEL_KATEGORI_SPONSOR,
  tanggalWib,
  type Kategori,
  type KlinikRingkas,
  type Sponsor,
} from "./label";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";
import { PilihFile } from "./PilihFile";

/** Reads a video's length in the browser, so the admin doesn't have to type it. */
function bacaDurasiVideo(file: File): Promise<number | null> {
  return new Promise((selesai) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      selesai(Number.isFinite(v.duration) ? v.duration : null);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      selesai(null);
    };
    v.src = url;
  });
}

function bacaUkuranGambar(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((selesai) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      selesai({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      selesai(null);
    };
    img.src = url;
  });
}

const batasDurasi = (d: number) => Math.min(120, Math.max(5, Math.round(d)));

/** PRD §6.2: file → kategori/sponsor/BPOM → klinik tujuan & tanggal → Simpan. */
export function FormKonten({
  klinik,
  sponsor,
  onTersimpan,
  onBerhasil,
}: {
  klinik: KlinikRingkas[];
  sponsor: Sponsor[];
  /** Refresh the list (also after a partial failure). */
  onTersimpan: () => void;
  /** Everything saved: the parent closes the panel and shows this message. */
  onBerhasil?: (teks: string) => void;
}) {
  const [tipe, setTipe] = useState<TipeUnggah>("video");
  const [file, setFile] = useState<File | null>(null);
  const [infoFile, setInfoFile] = useState<string | null>(null);
  const [peringatan, setPeringatan] = useState<string | null>(null);
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<Kategori>("edukasi");
  const [sponsorId, setSponsorId] = useState("");
  const [sponsorBaru, setSponsorBaru] = useState({ nama: "", kategori: "bank" });
  const [durasi, setDurasi] = useState(10);
  const [obat, setObat] = useState(false);
  const [bpom, setBpom] = useState("");
  const [tujuan, setTujuan] = useState<string[]>([]);
  const [mulai, setMulai] = useState(tanggalWib());
  const [selesai, setSelesai] = useState(tanggalWib(30));
  const [bobot, setBobot] = useState(1);
  const [progres, setProgres] = useState<number | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);

  async function pilihFile(f: File | undefined) {
    setFile(null);
    setInfoFile(null);
    setPeringatan(null);
    setPesan(null);
    if (!f) return;
    const masalah = cekFileLokal(f, tipe);
    if (masalah) return setPesan({ jenis: "galat", teks: masalah });
    setFile(f);
    if (!judul) setJudul(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const mb = (f.size / 1024 / 1024).toFixed(1);
    if (tipe === "video") {
      const d = await bacaDurasiVideo(f);
      if (d === null) {
        setPeringatan(
          "Video tidak bisa dibaca browser ini. Pastikan codec H.264, atau TV akan melewatinya.",
        );
      } else {
        setDurasi(batasDurasi(d));
        setInfoFile(`${mb} MB · ${Math.round(d)} detik`);
      }
    } else {
      const u = await bacaUkuranGambar(f);
      setInfoFile(u ? `${mb} MB · ${u.w}×${u.h} px` : `${mb} MB`);
      if (u && (u.w !== 1920 || u.h !== 1080)) {
        setPeringatan(
          "Disarankan 1920×1080 px. Gambar lain tetap tampil, dengan bingkai gelap di sisi.",
        );
      }
    }
  }

  function gantiKategori(k: Kategori) {
    setKategori(k);
    setBobot(k === "iklan_sponsor" ? 2 : 1);
    if (k !== "iklan_sponsor") setSponsorId("");
  }

  const butuhSponsorBaru = sponsorId === "baru";
  const siap =
    file !== null &&
    judul.trim().length >= 3 &&
    (!obat || bpom.trim().length > 0) &&
    (!butuhSponsorBaru || sponsorBaru.nama.trim().length >= 2) &&
    selesai >= mulai &&
    progres === null &&
    !proses;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setProses(true);
    setPesan(null);

    let idSponsor: string | null = sponsorId || null;
    if (butuhSponsorBaru) {
      const s = await api<Sponsor>("/api/cms/sponsor", { method: "POST", body: sponsorBaru });
      if (!s.ok) {
        setProses(false);
        return setPesan({ jenis: "galat", teks: s.error.pesan });
      }
      idSponsor = s.data.id;
    }

    setProgres(0);
    const unggah = await unggahFile(file, tipe, setProgres);
    setProgres(null);
    if (!unggah.ok) {
      setProses(false);
      return setPesan({ jenis: "galat", teks: unggah.pesan });
    }

    const konten = await api<{ kontenId: string }>("/api/cms/konten", {
      method: "POST",
      body: {
        judul: judul.trim(),
        tipe,
        kategori,
        filePath: unggah.path,
        teks: null,
        durasiDetik: durasi,
        sponsorId: idSponsor,
        produkObatSuplemen: obat,
        izinEdarBpom: obat ? bpom.trim() : null,
      },
    });
    if (!konten.ok) {
      setProses(false);
      return setPesan({
        jenis: "galat",
        teks:
          konten.error.kode === "IZIN_BPOM_WAJIB"
            ? "Produk obat/suplemen wajib mencantumkan nomor izin edar BPOM."
            : konten.error.pesan,
      });
    }

    if (tujuan.length > 0) {
      const tempat = await api("/api/cms/penempatan", {
        method: "POST",
        body: { kontenId: konten.data.kontenId, klinikIds: tujuan, mulai, selesai, bobot },
      });
      if (!tempat.ok) {
        setProses(false);
        onTersimpan();
        return setPesan({
          jenis: "galat",
          teks: `Konten tersimpan, tapi gagal ditempatkan: ${tempat.error.pesan}`,
        });
      }
    }

    setProses(false);
    setFile(null);
    setJudul("");
    setObat(false);
    setBpom("");
    setInfoFile(null);
    setPeringatan(null);
    (e.target as HTMLFormElement).reset();
    const teks =
      tujuan.length > 0
        ? `Tersimpan dan masuk playlist ${tujuan.length} klinik. TV klinik itu mengambil playlist baru dalam ±2 detik.`
        : "Tersimpan. Konten belum tayang di klinik mana pun; atur di menu Penempatan.";
    if (onBerhasil) onBerhasil(teks);
    else setPesan({ jenis: "ok", teks });
    onTersimpan();
  }

  return (
    <form onSubmit={simpan} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className={`${kelasLabel} mb-1.5`}>Jenis file</legend>
        <div className="flex gap-3">
          {(["video", "gambar"] as const).map((t) => (
            <label
              key={t}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 border-slate-300 px-4 has-[:checked]:border-slate-900"
            >
              <input
                type="radio"
                name="tipe"
                value={t}
                checked={tipe === t}
                onChange={() => {
                  setTipe(t);
                  setFile(null);
                  setInfoFile(null);
                  setPeringatan(null);
                }}
              />
              {t === "video" ? "Video" : "Gambar"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <span className={kelasLabel}>File</span>
        <PilihFile
          key={tipe}
          id="file-konten"
          required
          accept={tipe === "video" ? "video/mp4" : "image/jpeg,image/png,image/webp"}
          aturan={tipe === "video" ? "MP4 H.264, maks 50 MB" : "JPG/PNG/WebP 1920×1080, maks 5 MB"}
          namaFile={file?.name ?? null}
          disabled={progres !== null || proses}
          onPilih={pilihFile}
        />
        {infoFile && <p className="text-sm text-slate-700">{infoFile}</p>}
        {peringatan && <p className="text-sm text-amber-900">{peringatan}</p>}
        {progres !== null && (
          <div className="flex items-center gap-3">
            <progress value={progres} max={100} className="w-full" aria-label="Progres unggah" />
            <span className="w-12 text-right text-sm tabular-nums">{progres}%</span>
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="judul-konten" className={kelasLabel}>
            Judul
          </label>
          <input
            id="judul-konten"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            minLength={3}
            maxLength={120}
            required
            className={kelasInput}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="kategori-konten" className={kelasLabel}>
            Kategori
          </label>
          <select
            id="kategori-konten"
            value={kategori}
            onChange={(e) => gantiKategori(e.target.value as Kategori)}
            className={kelasInput}
          >
            {(Object.keys(LABEL_KATEGORI) as Kategori[]).map((k) => (
              <option key={k} value={k}>
                {LABEL_KATEGORI[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {kategori === "iklan_sponsor" && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sponsor-konten" className={kelasLabel}>
              Sponsor
            </label>
            <select
              id="sponsor-konten"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className={kelasInput}
            >
              <option value="">Tanpa sponsor</option>
              {sponsor.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
              <option value="baru">+ Sponsor baru…</option>
            </select>
          </div>
          {butuhSponsorBaru && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sponsor-nama" className={kelasLabel}>
                  Nama sponsor
                </label>
                <input
                  id="sponsor-nama"
                  value={sponsorBaru.nama}
                  onChange={(e) => setSponsorBaru((s) => ({ ...s, nama: e.target.value }))}
                  className={kelasInput}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sponsor-kategori" className={kelasLabel}>
                  Jenis
                </label>
                <select
                  id="sponsor-kategori"
                  value={sponsorBaru.kategori}
                  onChange={(e) => setSponsorBaru((s) => ({ ...s, kategori: e.target.value }))}
                  className={kelasInput}
                >
                  {Object.entries(LABEL_KATEGORI_SPONSOR).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5 md:max-w-xs">
        <label htmlFor="durasi-konten" className={kelasLabel}>
          Durasi tampil (detik)
        </label>
        <input
          id="durasi-konten"
          type="number"
          min={5}
          max={120}
          value={durasi}
          onChange={(e) => setDurasi(batasDurasi(Number(e.target.value) || 5))}
          readOnly={tipe === "video"}
          aria-describedby="durasi-bantuan"
          className={`${kelasInput} ${tipe === "video" ? "bg-slate-100" : ""}`}
        />
        <p id="durasi-bantuan" className="text-sm text-slate-600">
          {tipe === "video"
            ? "Diisi otomatis dari panjang video. Video tetap diputar sampai selesai."
            : "Berapa lama gambar tampil di TV (5–120 detik)."}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4">
        <label className="flex cursor-pointer items-center gap-3 text-base font-medium">
          <input
            type="checkbox"
            checked={obat}
            onChange={(e) => setObat(e.target.checked)}
            className="size-5"
          />
          Produk obat atau suplemen
        </label>
        {obat && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bpom" className={kelasLabel}>
              Nomor izin edar BPOM (wajib)
            </label>
            <input
              id="bpom"
              value={bpom}
              onChange={(e) => setBpom(e.target.value)}
              required
              maxLength={60}
              placeholder="Contoh: POM SD.123456789"
              aria-describedby="bpom-bantuan"
              className={`${kelasInput} md:max-w-sm`}
            />
            <p id="bpom-bantuan" className="text-sm text-slate-700">
              Tanpa nomor izin edar, konten tidak bisa disimpan. Obat keras tidak boleh diiklankan.
            </p>
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={`${kelasLabel} mb-1.5`}>Tayang di klinik</legend>
        <div className="flex flex-wrap gap-3">
          {klinik.map((k) => (
            <label
              key={k.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 border-slate-300 px-4 has-[:checked]:border-slate-900"
            >
              <input
                type="checkbox"
                checked={tujuan.includes(k.id)}
                onChange={(e) =>
                  setTujuan((t) => (e.target.checked ? [...t, k.id] : t.filter((x) => x !== k.id)))
                }
              />
              {k.nama}
            </label>
          ))}
        </div>
        {tujuan.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mulai-konten" className={kelasLabel}>
                Mulai
              </label>
              <input
                id="mulai-konten"
                type="date"
                value={mulai}
                onChange={(e) => setMulai(e.target.value)}
                className={kelasInput}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="selesai-konten" className={kelasLabel}>
                Selesai
              </label>
              <input
                id="selesai-konten"
                type="date"
                value={selesai}
                min={mulai}
                onChange={(e) => setSelesai(e.target.value)}
                className={kelasInput}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bobot-konten" className={kelasLabel}>
                Bobot (1–10)
              </label>
              <input
                id="bobot-konten"
                type="number"
                min={1}
                max={10}
                value={bobot}
                onChange={(e) => setBobot(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className={kelasInput}
              />
            </div>
          </div>
        )}
      </fieldset>

      {pesan && <Pesan jenis={pesan.jenis}>{pesan.teks}</Pesan>}

      <Button type="submit" className="self-start" disabled={!siap}>
        {progres !== null ? `Mengunggah… ${progres}%` : proses ? "Menyimpan…" : "Simpan konten"}
      </Button>
    </form>
  );
}
