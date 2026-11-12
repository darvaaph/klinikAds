"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

// Static pitch mockup of the future admin_klinik role (PRD F-005, F-102).
// Nothing here is saved; revenue figures stay placeholders until the business model is final.

type Usulan = {
  id: string;
  judul: string;
  sponsor: string;
  status: "menunggu" | "disetujui" | "ditolak";
};

const USULAN_AWAL: Usulan[] = [
  {
    id: "u1",
    judul: "Video tabungan kesehatan",
    sponsor: "Contoh Bank Sehat (fiktif)",
    status: "menunggu",
  },
  {
    id: "u2",
    judul: "Gambar vitamin anak",
    sponsor: "Contoh Apotek Sentosa (fiktif)",
    status: "menunggu",
  },
];

const SLOT_SPONSOR = [
  "Contoh Bank Sehat (fiktif) · 2 tayang/jam",
  "Contoh Apotek Sentosa (fiktif) · 2 tayang/jam",
];
const SLOT_KLINIK = ["Promo cek gula darah", "Jadwal dokter gigi", "Edukasi cuci tangan"];

function IkonKunci() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function MockupAdminKlinik() {
  const [usulan, setUsulan] = useState(USULAN_AWAL);
  const ubah = (id: string, status: Usulan["status"]) =>
    setUsulan((u) => u.map((x) => (x.id === id ? { ...x, status } : x)));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Admin Klinik</h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-950">
            MOCKUP · BELUM BERFUNGSI
          </span>
        </div>
        <p className="text-base text-slate-700">
          Gambaran fase MVP: yang dilihat pengelola klinik. Contoh di sini untuk Klinik Pratama
          Palsigunung 2.
        </p>
      </header>

      <section aria-labelledby="judul-slot" className="flex flex-col gap-3">
        <h2 id="judul-slot" className="text-xl font-bold">
          1. Pembagian slot layar
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <IkonKunci />
              Slot sponsor (diatur pusat)
            </div>
            <p className="text-sm text-slate-700">
              Dijual oleh LayarKlinik. Klinik tidak bisa mengubah, hanya menyetujui atau menolak
              iklan baru.
            </p>
            <ul className="flex flex-col gap-2">
              {SLOT_SPONSOR.map((s) => (
                <li key={s} className="rounded-lg bg-white px-3 py-2 text-base text-slate-700">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-800">Slot klinik (diatur klinik)</p>
            <p className="text-sm text-slate-700">
              Promo layanan, jadwal dokter, edukasi pilihan klinik.
            </p>
            <ul className="flex flex-col gap-2">
              {SLOT_KLINIK.map((s) => (
                <li key={s} className="rounded-lg border border-slate-200 px-3 py-2 text-base">
                  {s}
                </li>
              ))}
            </ul>
            <Button varian="kedua" disabled className="self-start">
              + Tambah konten klinik
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-600">Rasio slot sponsor : klinik masih TBD.</p>
      </section>

      <section aria-labelledby="judul-setuju" className="flex flex-col gap-3">
        <h2 id="judul-setuju" className="text-xl font-bold">
          2. Iklan baru menunggu persetujuan klinik
        </h2>
        <ul className="flex flex-col gap-3">
          {usulan.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-semibold">{u.judul}</p>
                <p className="text-sm text-slate-700">{u.sponsor}</p>
              </div>
              {u.status === "menunggu" ? (
                <div className="flex gap-2">
                  <Button varian="kedua" onClick={() => ubah(u.id, "ditolak")}>
                    Tolak
                  </Button>
                  <Button onClick={() => ubah(u.id, "disetujui")}>Setujui</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      u.status === "disetujui"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {u.status === "disetujui" ? "Disetujui" : "Ditolak"}
                  </span>
                  <button
                    type="button"
                    onClick={() => ubah(u.id, "menunggu")}
                    className="text-sm underline"
                  >
                    Batalkan
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="judul-bagi" className="flex flex-col gap-3">
        <h2 id="judul-bagi" className="text-xl font-bold">
          3. Estimasi bagi hasil bulan ini
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Tayangan sponsor", "± 2.900"],
            ["Pendapatan iklan", "Rp [TBD]"],
            ["Bagian klinik", "Rp [TBD]"],
          ].map(([label, nilai]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-3xl font-bold tabular-nums">{nilai}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Model bagi hasil (persentase atau insentif tetap) belum final, jadi angka rupiah sengaja
          dikosongkan.
        </p>
      </section>
    </div>
  );
}
