"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PanelSamping } from "@/components/ui/PanelSamping";
import { api } from "@/lib/klien";
import { FormKonten } from "./FormKonten";
import { KepalaHalaman } from "./KepalaHalaman";
import { LABEL_KATEGORI, LABEL_TIPE, tanggalWib, type KlinikRingkas, type Sponsor } from "./label";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";

type Konten = {
  id: string;
  judul: string;
  tipe: keyof typeof LABEL_TIPE;
  kategori: keyof typeof LABEL_KATEGORI;
  url: string | null;
  durasiDetik: number;
  aktif: boolean;
  sponsor: string | null;
  produkObatSuplemen: boolean;
  izinEdarBpom: string | null;
  jumlahKlinik: number;
};

type PenempatanTeks = { id: string; teks: string | null; tipe: string };

const BATAS_TEKS = 140;

function RunningText({ klinik }: { klinik: KlinikRingkas[] }) {
  const [klinikId, setKlinikId] = useState(klinik[0]?.id ?? "");
  const [daftar, setDaftar] = useState<PenempatanTeks[]>([]);
  const [teks, setTeks] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    if (!klinikId) return;
    const res = await api<PenempatanTeks[]>(`/api/cms/penempatan?klinikId=${klinikId}`);
    if (res.ok) setDaftar(res.data.filter((p) => p.tipe === "teks_berjalan"));
  }, [klinikId]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    const k = await api<{ kontenId: string }>("/api/cms/konten", {
      method: "POST",
      body: {
        judul: teks.trim().slice(0, 40).padEnd(3, "."),
        tipe: "teks_berjalan",
        kategori: "info",
        filePath: null,
        teks: teks.trim(),
        durasiDetik: 10,
        sponsorId: null,
        produkObatSuplemen: false,
        izinEdarBpom: null,
      },
    });
    const p = k.ok
      ? await api("/api/cms/penempatan", {
          method: "POST",
          body: {
            kontenId: k.data.kontenId,
            klinikIds: [klinikId],
            mulai: tanggalWib(),
            selesai: tanggalWib(365),
            bobot: 1,
          },
        })
      : k;
    setProses(false);
    if (!p.ok) return setGalat(p.error.pesan);
    setTeks("");
    muat();
  }

  async function hapus(id: string) {
    setProses(true);
    await api(`/api/cms/penempatan/${id}`, { method: "DELETE" });
    setProses(false);
    muat();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold">Running text per klinik</h2>
      <div className="flex flex-col gap-1.5 md:max-w-sm">
        <label htmlFor="rt-klinik" className={kelasLabel}>
          Klinik
        </label>
        <select
          id="rt-klinik"
          value={klinikId}
          onChange={(e) => setKlinikId(e.target.value)}
          className={kelasInput}
        >
          {klinik.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col gap-2">
        {daftar.length === 0 && <li className="text-slate-600">Belum ada running text.</li>}
        {daftar.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
          >
            <span className="text-base">{d.teks}</span>
            <button
              type="button"
              disabled={proses}
              onClick={() => hapus(d.id)}
              className="shrink-0 text-sm text-red-800 underline disabled:opacity-50"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={tambah} className="flex flex-col gap-1.5">
        <label htmlFor="rt-teks" className={kelasLabel}>
          Teks baru
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="rt-teks"
            value={teks}
            onChange={(e) => setTeks(e.target.value.slice(0, BATAS_TEKS))}
            minLength={3}
            required
            aria-describedby="rt-sisa"
            className={kelasInput}
          />
          <Button type="submit" disabled={proses || teks.trim().length < 3} className="shrink-0">
            Tambah
          </Button>
        </div>
        <p id="rt-sisa" className="text-sm text-slate-600">
          {teks.length}/{BATAS_TEKS} karakter
        </p>
        {galat && <Pesan jenis="galat">{galat}</Pesan>}
      </form>
    </section>
  );
}

export function KelolaKonten() {
  const [klinik, setKlinik] = useState<KlinikRingkas[]>([]);
  const [sponsor, setSponsor] = useState<Sponsor[]>([]);
  const [konten, setKonten] = useState<Konten[] | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const [k, s, kt] = await Promise.all([
      api<KlinikRingkas[]>("/api/cms/klinik"),
      api<Sponsor[]>("/api/cms/sponsor"),
      api<Konten[]>("/api/cms/konten"),
    ]);
    if (k.ok) setKlinik(k.data);
    if (s.ok) setSponsor(s.data);
    if (kt.ok) setKonten(kt.data.filter((x) => x.tipe !== "teks_berjalan"));
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  async function ubahAktif(k: Konten) {
    setSibuk(k.id);
    await api(`/api/cms/konten/${k.id}`, { method: "PATCH", body: { aktif: !k.aktif } });
    setSibuk(null);
    muat();
  }

  async function hapus(k: Konten) {
    if (!window.confirm(`Hapus "${k.judul}"? Konten akan berhenti tayang di semua klinik.`)) return;
    setSibuk(k.id);
    await api(`/api/cms/konten/${k.id}`, { method: "DELETE" });
    setSibuk(null);
    muat();
  }

  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman
        judul="Konten"
        keterangan="Video dan gambar iklan, edukasi, dan promo. Pilih klinik tujuan supaya langsung tayang."
        aksi={
          <Button
            disabled={klinik.length === 0}
            onClick={() => {
              setBerhasil(null);
              setPanel(true);
            }}
          >
            Tambah konten
          </Button>
        }
      />
      {berhasil && <Pesan jenis="ok">{berhasil}</Pesan>}

      <PanelSamping
        terbuka={panel}
        onTutup={() => setPanel(false)}
        judul="Tambah konten"
        keterangan="Unggah file, isi keterangan, lalu pilih klinik tempat konten tayang."
      >
        <FormKonten
          klinik={klinik}
          sponsor={sponsor}
          onTersimpan={muat}
          onBerhasil={(teks) => {
            setPanel(false);
            setBerhasil(teks);
          }}
        />
      </PanelSamping>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">
          Daftar konten{" "}
          {konten && <span className="font-normal text-slate-600">({konten.length})</span>}
        </h2>
        {!konten && <p className="text-slate-600">Memuat daftar konten…</p>}
        {konten?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-700">
            Belum ada konten. Tekan <strong>Tambah konten</strong> untuk mengunggah video atau
            gambar pertama.
          </p>
        )}
        {konten && konten.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-base">
              <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Judul
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Jenis
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Kategori
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Sponsor
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Klinik
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {konten.map((k) => (
                  <tr key={k.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {k.url ? (
                        <a href={k.url} target="_blank" className="underline">
                          {k.judul}
                        </a>
                      ) : (
                        k.judul
                      )}
                      {k.produkObatSuplemen && (
                        <span className="block text-sm text-slate-600">BPOM {k.izinEdarBpom}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {LABEL_TIPE[k.tipe]} · {k.durasiDetik} dtk
                    </td>
                    <td className="px-4 py-3">{LABEL_KATEGORI[k.kategori]}</td>
                    <td className="px-4 py-3">{k.sponsor ?? "–"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{k.jumlahKlinik}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={k.aktif}
                        aria-label={`Tayangkan ${k.judul}`}
                        disabled={sibuk === k.id}
                        onClick={() => ubahAktif(k)}
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          k.aktif
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {k.aktif ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={sibuk === k.id}
                        onClick={() => hapus(k)}
                        className="text-sm text-red-800 underline disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {klinik.length > 0 && <RunningText klinik={klinik} />}
    </div>
  );
}
