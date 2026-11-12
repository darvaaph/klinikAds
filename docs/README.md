# LayarKlinik — Paket Perencanaan (Prototipe Pitching)

**Tanggal:** 2026-11-11 · **Penulis:** Darva · **Status:** Draft v1.0

Layar TV ruang tunggu klinik yang menampilkan **antrian per poli** dan **iklan/edukasi/promo** bergiliran, dikelola dari satu CMS untuk banyak klinik. Fase ini adalah **prototipe untuk pitching** ke dokter mitra (dr. Gamal) dan pengurus ASKLIN Kota Depok: TV sungguhan yang dikendalikan dari HP. Klinik pilot utama: **Klinik Pratama Palsigunung 2 (KPRJ Palsigunung 2)**, slug `palsigunung-2`.

## Isi Paket

| File | Isi | Baca kalau… |
|---|---|---|
| `01-PRD.md` | Masalah, peran, 6 fitur prototipe + fitur MVP, user stories, alur, edge case, risiko | Mau tahu **apa** yang dibuat dan kapan dianggap selesai |
| `02-ARCHITECTURE.md` | Stack, diagram sistem, struktur folder, alur data, aturan tampilan TV, deployment | Mulai coding, atau mengambil keputusan teknis |
| `03-DATABASE.md` | Skema Postgres, fungsi antrian (RPC), view publik, RLS, data contoh | Mengerjakan database dan logika antrian |
| `04-API.md` | Semua endpoint, format respons, kode error, event real-time | Mengerjakan frontend atau backend |
| `05-TASKS.md` | 26 task berurutan (±4 minggu paruh waktu) dengan kriteria selesai dan prompt | Menentukan apa yang dikerjakan hari ini |

## Ringkasan Keputusan
- **Stack:** Next.js 15 + TypeScript + Tailwind · Supabase (Postgres, Realtime, Storage) · Vercel · Fully Kiosk Browser di Android TV.
- **Tampilan TV:** desain A (antrian kiri ±27%, iklan kanan), kanvas 1920×1080 diskalakan, zona aman 96/54 px, angka ≥ 100 px.
- **Antrian:** urut waktu daftar. Satu-satunya cara mendahului adalah **prioritas dengan alasan** (lansia, ibu hamil, disabilitas, darurat). **Tidak ada label BPJS/umum** di layar.
- **Privasi:** tidak ada nama atau NIK. `penjamin` opsional dan tidak pernah dikirim ke endpoint publik.
- **Iklan obat/suplemen:** wajib nomor izin edar BPOM. Obat keras tidak boleh diiklankan.
- **Di luar cakupan:** SIMKlinik, BPJS, SATUSEHAT, pembayaran.

## Masih _TBD_
- Tanggal pitching
- Nama produk final (LayarKlinik adalah nama sementara)
- Model bagi hasil final (persentase atau insentif tetap) dan rasio slot sponsor:klinik
- Data asli KPRJ Palsigunung 2: daftar poli dan ruang, merek/OS TV, kondisi internet, ketersediaan suara TTS bahasa Indonesia di TV tersebut, serta izin memakai nama/logo di demo
- Pendapat IDI/dr. Gamal soal etika iklan obat di tempat praktik dokter
- Batas free tier Supabase/Vercel terbaru (cek sebelum demo)

## Cara Memakai untuk Vibe Coding
- **Frontend (player/remote/QR/CMS):** muat `01-PRD.md` + `04-API.md` + `02-ARCHITECTURE.md` §4.5.
- **Backend & database:** muat `01-PRD.md` + `03-DATABASE.md` + `04-API.md`.
- **Setiap sesi:** ambil satu task dari `05-TASKS.md`, tempel prompt-nya, lalu cek "Selesai jika".
- **Referensi visual:** artifact desain "Layar TV Antrian + Iklan Klinik" (artboard A revisi 3 poli & 5 poli, C kartu panggilan).

## Dokumen Pendukung Lain
- Daftar Pertanyaan Wawancara Pemilik Klinik (Claude Docs)
- Desain layar TV (canvas Design)
