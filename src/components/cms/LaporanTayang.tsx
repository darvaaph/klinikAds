"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/klien";
import { tanggalWib, type KlinikRingkas } from "./label";
import { kelasInput, kelasLabel, Pesan } from "./Pesan";

type Laporan = {
  ringkasan: { totalTayang: number; totalDetik: number };
  perKonten: {
    kontenId: string;
    judul: string;
    sponsor: string | null;
    tayang: number;
    detik: number;
  }[];
  perHari: { tanggal: string; tayang: number }[];
};

// Single series: validated with the dataviz palette checks against white (#2a78d6).
const WARNA_BATANG = "#2a78d6";
const angka = new Intl.NumberFormat("id-ID");

function labelTanggal(t: string, panjang = false) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(panjang ? { weekday: "long", year: "numeric" } : {}),
  }).format(new Date(`${t}T00:00:00`));
}

function durasi(detik: number) {
  const jam = Math.floor(detik / 3600);
  const menit = Math.round((detik % 3600) / 60);
  return jam > 0 ? `${jam} jam ${menit} mnt` : `${menit} mnt`;
}

/** Clean y-axis step (1, 2, 5 × 10^n) for about four gridlines. */
function langkahSumbu(maks: number) {
  const kasar = Math.max(1, maks / 4);
  const pangkat = 10 ** Math.floor(Math.log10(kasar));
  const n = kasar / pangkat;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pangkat;
}

function GrafikPerHari({ data }: { data: Laporan["perHari"] }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const L = 760;
  const T = 240;
  const kiri = 44;
  const bawah = 28;
  const atas = 12;
  const lebarPlot = L - kiri - 8;
  const tinggiPlot = T - bawah - atas;
  const maksData = Math.max(1, ...data.map((d) => d.tayang));
  const langkah = langkahSumbu(maksData);
  const maks = Math.ceil(maksData / langkah) * langkah;
  const slot = lebarPlot / data.length;
  const lebarBatang = Math.min(24, Math.max(2, slot - 2)); // ≤ 24 px, ≥ 2 px air between bars
  const y = (v: number) => atas + tinggiPlot - (v / maks) * tinggiPlot;
  const tiapLabel = Math.ceil(data.length / 8);
  const titik = aktif !== null ? data[aktif] : null;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-base font-semibold text-slate-800">Tayangan per hari</figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${L} ${T}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Grafik batang tayangan per hari, ${data.length} hari. Tabel lengkap di bawah.`}
          onMouseLeave={() => setAktif(null)}
        >
          {Array.from({ length: maks / langkah + 1 }, (_, i) => i * langkah).map((v) => (
            <g key={v}>
              <line x1={kiri} x2={L - 8} y1={y(v)} y2={y(v)} stroke="#e7e5e4" strokeWidth={1} />
              <text x={kiri - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="#57534e">
                {angka.format(v)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = kiri + i * slot + (slot - lebarBatang) / 2;
            const tinggi = Math.max(0, y(0) - y(d.tayang));
            const r = Math.min(4, tinggi, lebarBatang / 2);
            return (
              <g key={d.tanggal}>
                {tinggi > 0 && (
                  // Rounded data end (4 px), square at the baseline.
                  <path
                    d={`M${x},${y(0)} V${y(d.tayang) + r} Q${x},${y(d.tayang)} ${x + r},${y(d.tayang)} H${x + lebarBatang - r} Q${x + lebarBatang},${y(d.tayang)} ${x + lebarBatang},${y(d.tayang) + r} V${y(0)} Z`}
                    fill={WARNA_BATANG}
                    opacity={aktif === null || aktif === i ? 1 : 0.45}
                  />
                )}
                {i % tiapLabel === 0 && (
                  <text
                    x={x + lebarBatang / 2}
                    y={T - 8}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#57534e"
                  >
                    {labelTanggal(d.tanggal)}
                  </text>
                )}
                {/* Hit target: the full column, larger than the bar. */}
                <rect
                  x={kiri + i * slot}
                  y={atas}
                  width={slot}
                  height={tinggiPlot}
                  fill="transparent"
                  onMouseEnter={() => setAktif(i)}
                />
              </g>
            );
          })}
          <line x1={kiri} x2={L - 8} y1={y(0)} y2={y(0)} stroke="#a8a29e" strokeWidth={1} />
        </svg>
        {titik && aktif !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md"
            style={{
              left: `${((kiri + (aktif + 0.5) * slot) / L) * 100}%`,
              transform: `translateX(${aktif > data.length / 2 ? "-105%" : "5%"})`,
            }}
          >
            <p className="text-slate-600">{labelTanggal(titik.tanggal, true)}</p>
            <p className="font-semibold text-slate-900">{angka.format(titik.tayang)} tayangan</p>
          </div>
        )}
      </div>
      <details className="text-base">
        <summary className="cursor-pointer text-slate-700 underline">Lihat sebagai tabel</summary>
        <table className="mt-2 w-full max-w-sm text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th scope="col" className="py-1.5 font-semibold">
                Tanggal
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Tayangan
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.tanggal} className="border-b border-slate-100">
                <td className="py-1.5">{labelTanggal(d.tanggal, true)}</td>
                <td className="py-1.5 text-right tabular-nums">{angka.format(d.tayang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function LaporanTayang() {
  const [klinik, setKlinik] = useState<KlinikRingkas[]>([]);
  const [klinikId, setKlinikId] = useState("");
  const [dari, setDari] = useState(tanggalWib(-14));
  const [sampai, setSampai] = useState(tanggalWib(-1));
  const [data, setData] = useState<Laporan | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    api<KlinikRingkas[]>("/api/cms/klinik").then((r) => r.ok && setKlinik(r.data));
  }, []);

  const muat = useCallback(async () => {
    if (sampai < dari) return setGalat("Tanggal akhir tidak boleh sebelum tanggal awal.");
    const q = new URLSearchParams({ dari, sampai, ...(klinikId ? { klinikId } : {}) });
    const res = await api<Laporan>(`/api/cms/laporan?${q}`);
    if (res.ok) {
      setData(res.data);
      setGalat(null);
    } else setGalat(res.error.pesan);
  }, [klinikId, dari, sampai]);

  useEffect(() => {
    muat();
  }, [muat]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Laporan tayang</h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-950">
            DATA CONTOH
          </span>
        </div>
        <p className="text-base text-slate-700">
          Angka di halaman ini dibuat otomatis untuk demo, bukan catatan tayang sungguhan. Bukti
          tayang asli dari TV dikerjakan di fase MVP (F-103).
        </p>
      </header>

      {/* Filters: one row above the chart. */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex min-w-48 flex-col gap-1.5">
          <label htmlFor="lp-klinik" className={kelasLabel}>
            Klinik
          </label>
          <select
            id="lp-klinik"
            value={klinikId}
            onChange={(e) => setKlinikId(e.target.value)}
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lp-dari" className={kelasLabel}>
            Dari
          </label>
          <input
            id="lp-dari"
            type="date"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className={kelasInput}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lp-sampai" className={kelasLabel}>
            Sampai
          </label>
          <input
            id="lp-sampai"
            type="date"
            value={sampai}
            min={dari}
            onChange={(e) => setSampai(e.target.value)}
            className={kelasInput}
          />
        </div>
      </div>

      {galat && <Pesan jenis="galat">{galat}</Pesan>}
      {!data && !galat && <p className="text-slate-600">Memuat…</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">Total tayangan</p>
              <p className="text-4xl font-bold tabular-nums">
                {angka.format(data.ringkasan.totalTayang)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">Total waktu tayang</p>
              <p className="text-4xl font-bold tabular-nums">{durasi(data.ringkasan.totalDetik)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <GrafikPerHari data={data.perHari} />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Per konten dan sponsor</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] text-left text-base">
                <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Konten
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Sponsor
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Tayangan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Waktu tayang
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.perKonten.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                        Tidak ada tayangan pada rentang ini.
                      </td>
                    </tr>
                  )}
                  {data.perKonten.map((k) => (
                    <tr key={k.kontenId} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">{k.judul}</td>
                      <td className="px-4 py-3">{k.sponsor ?? "–"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {angka.format(k.tayang)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{durasi(k.detik)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
