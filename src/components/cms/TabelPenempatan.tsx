"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PanelSamping } from "@/components/ui/PanelSamping";
import { KepalaHalaman } from "./KepalaHalaman";
import { api } from "@/lib/klien";
import { LABEL_KATEGORI, tanggalWib, type KlinikRingkas } from "./label";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";

type KontenRingkas = {
  id: string;
  judul: string;
  tipe: string;
  kategori: keyof typeof LABEL_KATEGORI;
};

type Penempatan = {
  id: string;
  judul: string;
  tipe: string;
  kategori: keyof typeof LABEL_KATEGORI;
  klinik: string;
  mulai: string;
  selesai: string;
  bobot: number;
  persetujuanKlinik: string;
  tayangHariIni: boolean;
};

function formatTgl(t: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${t}T00:00:00`));
}

export function TabelPenempatan() {
  const [klinik, setKlinik] = useState<KlinikRingkas[]>([]);
  const [konten, setKonten] = useState<KontenRingkas[]>([]);
  const [daftar, setDaftar] = useState<Penempatan[] | null>(null);
  const [filter, setFilter] = useState("");

  const [kontenId, setKontenId] = useState("");
  const [tujuan, setTujuan] = useState<string[]>([]);
  const [mulai, setMulai] = useState(tanggalWib());
  const [selesai, setSelesai] = useState(tanggalWib(30));
  const [bobot, setBobot] = useState(1);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [panel, setPanel] = useState(false);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const [k, kt, p] = await Promise.all([
      api<KlinikRingkas[]>("/api/cms/klinik"),
      api<KontenRingkas[]>("/api/cms/konten?aktif=true"),
      api<Penempatan[]>(`/api/cms/penempatan${filter ? `?klinikId=${filter}` : ""}`),
    ]);
    if (k.ok) setKlinik(k.data);
    if (kt.ok) setKonten(kt.data.filter((x) => x.tipe !== "teks_berjalan"));
    if (p.ok) setDaftar(p.data.filter((x) => x.tipe !== "teks_berjalan"));
  }, [filter]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function tempatkan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const res = await api<{ penempatanIds: string[] }>("/api/cms/penempatan", {
      method: "POST",
      body: { kontenId, klinikIds: tujuan, mulai, selesai, bobot },
    });
    setProses(false);
    if (!res.ok) return setPesan({ jenis: "galat", teks: res.error.pesan });
    setBerhasil(
      `Ditempatkan di ${tujuan.length} klinik. Konten hanya tayang di klinik yang dipilih.`,
    );
    setPanel(false);
    setTujuan([]);
    setKontenId("");
    muat();
  }

  async function ubahBobot(p: Penempatan, nilai: number) {
    if (nilai === p.bobot || nilai < 1 || nilai > 10) return;
    await api(`/api/cms/penempatan/${p.id}`, { method: "PATCH", body: { bobot: nilai } });
    muat();
  }

  async function hapus(p: Penempatan) {
    if (!window.confirm(`Hentikan "${p.judul}" di ${p.klinik}?`)) return;
    await api(`/api/cms/penempatan/${p.id}`, { method: "DELETE" });
    muat();
  }

  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman
        judul="Penempatan"
        keterangan="Atur konten mana yang tayang di klinik mana, kapan, dan seberapa sering (bobot)."
        aksi={
          <Button
            onClick={() => {
              setBerhasil(null);
              setPesan(null);
              setPanel(true);
            }}
          >
            Tempatkan konten
          </Button>
        }
      />
      {berhasil && <Pesan jenis="ok">{berhasil}</Pesan>}

      <PanelSamping
        terbuka={panel}
        onTutup={() => setPanel(false)}
        judul="Tempatkan konten"
        keterangan="Konten hanya tayang di klinik yang dipilih, pada rentang tanggal ini."
      >
        <form onSubmit={tempatkan} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pe-konten" className={kelasLabel}>
              Konten
            </label>
            <select
              id="pe-konten"
              required
              value={kontenId}
              onChange={(e) => setKontenId(e.target.value)}
              className={kelasInput}
            >
              <option value="">Pilih konten…</option>
              {konten.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.judul} ({LABEL_KATEGORI[k.kategori]})
                </option>
              ))}
            </select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={`${kelasLabel} mb-1.5`}>Klinik</legend>
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
                      setTujuan((t) =>
                        e.target.checked ? [...t, k.id] : t.filter((x) => x !== k.id),
                      )
                    }
                  />
                  {k.nama}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-mulai" className={kelasLabel}>
                Mulai
              </label>
              <input
                id="pe-mulai"
                type="date"
                value={mulai}
                onChange={(e) => setMulai(e.target.value)}
                className={kelasInput}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-selesai" className={kelasLabel}>
                Selesai
              </label>
              <input
                id="pe-selesai"
                type="date"
                min={mulai}
                value={selesai}
                onChange={(e) => setSelesai(e.target.value)}
                className={kelasInput}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pe-bobot" className={kelasLabel}>
                Bobot (1–10)
              </label>
              <input
                id="pe-bobot"
                type="number"
                min={1}
                max={10}
                value={bobot}
                aria-describedby="pe-bobot-bantuan"
                onChange={(e) => setBobot(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className={kelasInput}
              />
            </div>
          </div>
          <p id="pe-bobot-bantuan" className="-mt-3 text-sm text-slate-600">
            Bobot 2 berarti tayang dua kali lebih sering daripada konten berbobot 1.
          </p>

          {pesan && <Pesan jenis={pesan.jenis}>{pesan.teks}</Pesan>}

          <Button
            type="submit"
            className="self-start"
            disabled={proses || !kontenId || tujuan.length === 0 || selesai < mulai}
          >
            {proses ? "Menyimpan…" : "Tempatkan"}
          </Button>
        </form>
      </PanelSamping>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold">
            Penempatan aktif{" "}
            {daftar && <span className="font-normal text-slate-600">({daftar.length})</span>}
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pe-filter" className={kelasLabel}>
              Tampilkan klinik
            </label>
            <select
              id="pe-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={kelasInput}
            >
              <option value="">Semua klinik</option>
              {klinik.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!daftar && <p className="text-slate-600">Memuat daftar penempatan…</p>}
        {daftar?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-700">
            Belum ada konten yang ditempatkan{filter ? " di klinik ini" : ""}. Tekan{" "}
            <strong>Tempatkan konten</strong> untuk memilih konten dan klinik tujuannya.
          </p>
        )}
        {daftar && daftar.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-base">
              <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Klinik
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Konten
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Periode
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Bobot
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Hari ini
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {daftar.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-600">
                      Belum ada penempatan.
                    </td>
                  </tr>
                )}
                {daftar.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{p.klinik}</td>
                    <td className="px-4 py-3">
                      {p.judul}
                      <span className="block text-sm text-slate-600">
                        {LABEL_KATEGORI[p.kategori]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTgl(p.mulai)} – {formatTgl(p.selesai)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={p.bobot}
                        aria-label={`Bobot ${p.judul} di ${p.klinik}`}
                        onBlur={(e) => ubahBobot(p, Number(e.target.value))}
                        className="w-16 rounded-md border-2 border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                          p.tayangHariIni
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {p.tayangHariIni ? "Tayang" : "Tidak tayang"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => hapus(p)}
                        className="text-sm text-red-800 underline"
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
    </div>
  );
}
