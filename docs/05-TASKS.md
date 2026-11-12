# Task Implementasi: LayarKlinik (Prototipe Pitching)

**Versi:** 1.0
**Tanggal:** 2026-11-11
**Terkait:** `01-PRD.md`, `02-ARCHITECTURE.md`, `03-DATABASE.md`, `04-API.md`

---

## Cara Pakai
- Kerjakan berurutan. Setiap task berukuran 30–120 menit (satu sesi AI coding).
- Untuk vibe coding: muat dokumen pada baris **Konteks**, salin **Prompt**, lalu review hasilnya dan cek **Selesai jika**.
- Status: ⬜ belum · 🔄 dikerjakan · ✅ selesai · 🚫 terhambat · ⏭️ ditunda

**Estimasi total:** ±45–55 jam kerja ≈ 4 minggu paruh waktu (±12 jam/minggu). Tanggal pitching _TBD_.

| Minggu | Target |
|---|---|
| 1 | Fase 0–1: proyek, database, fungsi antrian, seed |
| 2 | Fase 2: Player TV (+ **uji pertama di TV sungguhan**) |
| 3 | Fase 3–4: Remote + halaman QR |
| 4 | Fase 5–6: CMS setengah jadi, multi-klinik, uji demo & SOP |

### Urutan Pengerjaan (revisi 2026-11-11: frontend dulu, lihat KEPUTUSAN.md)
Supabase ditunda. Sampai tahap 6, data berasal dari **data palsu di memori server** dengan bentuk persis seperti `04-API.md`, dan TV memakai polling ±2 detik.

| Tahap | Task |
|---|---|
| 1. Fondasi | T-007 |
| 2. Layar TV | T-008 (+ lapisan data palsu) → T-009 → T-010 → T-011 → T-013 |
| 3. Uji TV | T-014 (lewat Wi-Fi ke laptop) |
| 4. Remote & QR | T-015 → T-016 → T-017 → T-018 |
| 5. CMS | T-019 → T-020 → T-021 → T-022 → T-023 (file unggahan disimpan lokal dulu) |
| 6. Backend | T-002 → T-003 → T-004 → T-005 → T-006 → ganti data palsu dengan Supabase → T-012 → deploy Vercel |
| 7. Demo | T-024 → T-025 → T-026 |

---

## Fase 0 — Setup

### T-001: Inisialisasi proyek ✅ _(repo GitHub + deploy Vercel ⏭️ ditunda, lihat KEPUTUSAN.md)_
**Effort:** 45 mnt · **Butuh:** – · **Konteks:** ARCH §1.1, §3, §5.1
- Next.js 15 + TS + Tailwind + `src/`, ESLint, Prettier, alias `@/`.
- Buat struktur folder sesuai ARCH §3 (file kosong boleh).
- Repo GitHub + deploy pertama ke Vercel (halaman "Hello").
**Selesai jika:** `pnpm dev` jalan, URL Vercel bisa dibuka dari HP.
**Prompt:** `Buat proyek Next.js 15 App Router + TypeScript + Tailwind dengan struktur folder di 02-ARCHITECTURE.md §3. Pasang dependensi di §1.1. Siapkan ESLint/Prettier dan alias @/.`

### T-002: Environment & klien Supabase ✅ _(kunci diisi setelah project Supabase dibuat)_
**Effort:** 45 mnt · **Butuh:** T-001 · **Konteks:** ARCH §6.3, §4.2
- `.env.local.example`, validasi env dengan Zod (app gagal start kalau ada yang kosong).
- `lib/supabase/server.ts` (service role, ditandai `import 'server-only'`) dan `lib/supabase/browser.ts` (anon).
**Selesai jika:** build gagal kalau `server.ts` diimpor dari client component. Service key tidak ada di bundle klien.

---

## Fase 1 — Database & Inti Antrian

### T-003: Migrasi skema ⬜
**Effort:** 90 mnt · **Butuh:** T-002 · **Konteks:** DB §3–4
- Enum + semua tabel + index + constraint.
**Selesai jika:** `supabase db reset` sukses. Insert tiket prioritas tanpa alasan → ditolak constraint.

### T-004: Fungsi RPC antrian ⬜
**Effort:** 120 mnt · **Butuh:** T-003 · **Konteks:** DB §5
- `segarkan_status_poli`, `ambil_nomor`, `panggil_berikutnya`, `panggil_ulang`, `ubah_status_tiket`, `set_prioritas`, `reset_demo`.
- `revoke execute` dari `anon`/`authenticated`.
**Selesai jika:**
- [ ] 2 koneksi paralel `ambil_nomor` × 50 → nomor 1–100 unik, tanpa celah.
- [ ] 2 koneksi paralel `panggil_berikutnya` tidak memanggil tiket yang sama.
- [ ] Tiket prioritas dipanggil sebelum tiket biasa yang lebih dulu dibuat.

### T-005: View publik, RLS, publikasi Realtime ⬜
**Effort:** 60 mnt · **Butuh:** T-004 · **Konteks:** DB §6–7
- `v_tampilan_poli`, `v_playlist`, `v_klinik_publik`. RLS untuk semua tabel. Publikasi realtime: `status_poli`, `panggilan`, `klinik`.
**Selesai jika:** dengan anon key, `select * from tiket_antrian` → 0 baris/ditolak, dan `select pin_remote_hash from klinik` → ditolak.

### T-006: Trigger versi playlist + seed ⬜
**Effort:** 90 mnt · **Butuh:** T-005 · **Konteks:** DB §5 (trigger), §8
- Trigger `penempatan`/`konten`. `seed.sql`: 3 klinik, poli, konten contoh, ±2.000 baris `log_tayang`.
- Siapkan aset: 3 video edukasi ≤ 20 MB (MP4 H.264), gambar 1920×1080, `chime.mp3`. **Tanpa merek sponsor sungguhan.**
**Selesai jika:** `klinik-b` punya 5 poli. Menambah penempatan menaikkan `playlist_versi`.

### T-007: Utilitas & sesi PIN ✅
**Effort:** 60 mnt · **Butuh:** T-002 · **Konteks:** API §1, ARCH §7
- `lib/session.ts` (jose sign/verify), `lib/format.ts` (tanggal Indonesia, kode nomor), `lib/kontras.ts` (rasio kontras WCAG), helper respons `{ok,data|error}`.
- Unit test Vitest untuk `kontras` dan `format`.
**Selesai jika:** `kontras('#0B5563','#FFFFFF') ≥ 4.5` lolos, `kontras('#7FD1C7','#FFFFFF')` gagal.

---

## Fase 2 — Player TV

### T-008: Endpoint snapshot tampilan ✅ _(sumber data: data palsu di memori)_
**Effort:** 60 mnt · **Butuh:** T-006 · **Konteks:** API §2 `GET /tampilan`
**Selesai jika:** respons sesuai contoh API, tanpa `penjamin`/`pin`. `no-store`.

### T-009: Kerangka player + ScaleToFit + zona aman ✅
**Effort:** 90 mnt · **Butuh:** T-008 · **Konteks:** ARCH §4.5, desain A (artifact "Layar TV Antrian + Iklan Klinik")
- `ScaleToFit` (1920×1080 → skala, letterbox hitam). Header (logo, nama, tanggal, jam), footer running text (CSS animation, 70 detik per putaran).
- Font lokal `next/font` (Inter, Space Grotesk). Warna utama dari klinik lewat CSS variable.
**Selesai jika:** tampil penuh tanpa scrollbar di 1366×768, 1920×1080, 3840×2160 (cek di DevTools).

### T-010: Panel antrian mode kartu & daftar ✅
**Effort:** 90 mnt · **Butuh:** T-009 · **Konteks:** PRD F-001, ARCH §4.5
- `KartuPoli` (≤ 4 poli, panel 520 px, angka 112 px) dan `DaftarPoli` (5–6 poli, panel 600 px, angka 100 px). Pilih otomatis dari jumlah poli atau `modeTampilan`.
- Badge "DIPANGGIL" pada poli yang terakhir memanggil. Badge "Prioritas" kalau `dipanggilPrioritas`. Kedip 3× (CSS).
- Poli tanpa panggilan menampilkan "–".
**Selesai jika:** `/tv/palsigunung-2` (3 poli) mode kartu, `/tv/klinik-b` (5 poli) mode daftar.

### T-011: Pemutar konten (playlist berbobot) ✅ _(uji 30 menit oleh pemilik proyek)_
**Effort:** 120 mnt · **Butuh:** T-009 · **Konteks:** PRD F-001, ARCH §2.3, §8
- `lib/playlist.ts`: urutan berbobot, tidak memutar konten yang sama dua kali berturut-turut (kalau konten > 1).
- `PemutarKonten`: video `muted` + `playsInline` (iklan tanpa suara), gambar selama `durasiDetik`, preload item berikutnya, `onError` → lewati.
- Label "Iklan" untuk kategori `iklan_sponsor`.
**Selesai jika:** berputar 30 menit tanpa macet di Chrome desktop. Unit test distribusi bobot lolos.

### T-012: Realtime + fallback polling ⬜
**Effort:** 90 mnt · **Butuh:** T-010, T-011 · **Konteks:** API §5
- `useRealtimeKlinik`: langganan 3 event. Event → ambil ulang snapshot (debounce 300 ms).
- Status bukan `SUBSCRIBED` > 10 detik → polling 5 detik. Badge "Offline" di zona aman kalau fetch gagal 3× berturut-turut.
- Reload penuh otomatis setiap 6 jam. `?debug=1` menampilkan status channel.
**Selesai jika:** mengubah `status_poli` lewat SQL editor → TV berubah ≤ 2 detik. Matikan Wi-Fi 30 detik lalu nyalakan → TV pulih sendiri.

### T-013: Kartu panggilan + suara ✅
**Effort:** 120 mnt · **Butuh:** T-012 · **Konteks:** PRD F-002, ARCH §2.3
- Layar awal **"Tekan OK untuk mulai"**. Tombol fokus otomatis, bisa diaktifkan tombol OK remote TV → buka izin audio (`AudioContext.resume()` + putar chime 0 volume).
- `lib/suara.ts`: chime → TTS `id-ID` ("Nomor antrian A, nol satu empat, silakan ke Poli Umum, Ruang satu") ×2. Kalau suara `id-ID` tidak ada → chime saja.
- Antrean kartu FIFO (6 detik per item), pause/resume video, lewati `id` yang sudah tampil (untuk `panggilanTerakhir` saat reconnect).
**Selesai jika:** 3 panggilan dalam 2 detik tampil berurutan. Video lanjut setelah kartu terakhir.

### T-014: 🔴 Uji pertama di TV sungguhan ⬜ _(lembar uji siap: docs/uji-tv.md, butuh TV sungguhan)_
**Effort:** 90 mnt · **Butuh:** T-013 · **Konteks:** PRD §7.6, §8.5
- Pasang Fully Kiosk Browser (atau Chrome) di Android TV target. Start URL = `/tv/palsigunung-2`. Matikan overscan ("Screen Fit/Just Scan").
- Catat: versi Android/Chromium, apakah suara `id-ID` tersedia, apakah video lancar, dan pemakaian memori setelah 1 jam.
**Selesai jika:** hasil uji ditulis di `docs/uji-tv.md`. Kalau ada yang gagal, buat task perbaikan **sebelum** lanjut ke Fase 3.

---

## Fase 3 — Remote HP

### T-015: Login PIN remote + rate limit ✅ _(batas percobaan disimpan di memori server)_
**Effort:** 60 mnt · **Butuh:** T-007 · **Konteks:** API §3 login, ARCH §7
**Selesai jika:** PIN benar → masuk. 5× salah → `429 TERKUNCI` selama 5 menit.

### T-016: Endpoint aksi antrian ✅
**Effort:** 90 mnt · **Butuh:** T-015, T-004 · **Konteks:** API §3
- `GET remote`, `POST tiket`, `POST tiket/[id]/prioritas`, `POST panggil`, `POST panggil-ulang`, `PATCH tiket/[id]`, `POST reset-demo`.
- Pemetaan exception SQL → kode error API.
**Selesai jika:** semua kode error di API §1.2 yang relevan bisa dipicu dan diuji dengan `curl`.

### T-017: UI remote ✅
**Effort:** 120 mnt · **Butuh:** T-016 · **Konteks:** PRD F-003, US-003/004/009
- Tab per poli: nomor dipanggil (besar), jumlah menunggu, tombol **Panggil berikutnya** (utama), **Panggil ulang**, **Tidak hadir**, **+ Nomor baru** (pilihan penjamin opsional dan prioritas dengan alasan), daftar menunggu dengan tombol "Prioritaskan".
- **Reset demo** dengan dialog ketik "RESET".
- Tombol ≥ 56 px. Tombol dinonaktifkan selama request berjalan (cegah tekan ganda). Toast error berbahasa Indonesia.
- Langganan realtime supaya 2 HP tetap sinkron.
**Selesai jika:** demo alur PRD §6.1 langkah 3–7 berjalan dari HP ke TV.

---

## Fase 4 — Halaman QR

### T-018: Halaman pantau antrian ✅
**Effort:** 90 mnt · **Butuh:** T-016 · **Konteks:** PRD F-004, API §2 `posisi`
- Input kode (huruf poli + angka), simpan kode terakhir di localStorage (try/catch). Tampilkan status, nomor dipanggil, orang di depan. Diperbarui realtime `status_poli` atau polling 10 detik.
- Gambar QR untuk slide TV: QR besar (≥ 600 px pada kanvas 1920) ke `/q/palsigunung-2`, dibuat sekali dan diunggah sebagai konten gambar.
**Selesai jika:** scan QR dari layar TV (jarak 2 m) → halaman terbuka, posisi benar.

---

## Fase 5 — CMS Setengah Jadi

### T-019: Login admin + kerangka CMS ✅
**Effort:** 60 mnt · **Butuh:** T-007 · **Konteks:** API §4 login
- Layout sidebar: Klinik, Konten, Penempatan, Laporan, Mockup Admin Klinik.

### T-020: Kelola klinik ✅
**Effort:** 60 mnt · **Butuh:** T-019 · **Konteks:** API `PATCH /cms/klinik`
- Ubah nama, warna (dengan cek kontras langsung + pratinjau kartu), logo, dan PIN remote.
**Selesai jika:** ganti warna `palsigunung-2` → TV berubah ≤ 2 detik. Warna kontras rendah ditolak.

### T-021: Unggah konten ✅ _(file disimpan lokal di .data/, belum Supabase Storage)_
**Effort:** 120 mnt · **Butuh:** T-019 · **Konteks:** PRD F-005, API konten
- Signed upload URL → unggah langsung dari browser dengan progress bar. Validasi tipe/ukuran.
- Form kategori, sponsor, durasi, dan centang "produk obat/suplemen" yang membuat kolom izin BPOM wajib diisi.
- Running text per klinik.
**Selesai jika:** US-006 dan US-007 lolos.

### T-022: Penempatan konten ✅
**Effort:** 90 mnt · **Butuh:** T-021 · **Konteks:** API penempatan
- Pilih konten → centang klinik (multi) → tanggal → bobot. Tabel penempatan per klinik + hapus.
**Selesai jika:** konten hanya tayang di klinik yang dipilih (US-006).

### T-023: Laporan tayang + mockup admin klinik ✅
**Effort:** 120 mnt · **Butuh:** T-022 · **Konteks:** API laporan, PRD F-005
- Laporan: filter klinik dan rentang tanggal, total tayang, tabel per konten/sponsor, grafik batang per hari (data seed). Tulis label "Data contoh" yang jelas.
- Halaman mockup statis "Admin Klinik": slot sponsor (terkunci) vs slot klinik, tombol setujui/tolak iklan, estimasi bagi hasil **dengan angka placeholder** (_TBD_ sampai model bisnis final).
**Selesai jika:** halaman bisa dipakai menjelaskan alur bisnis saat pitching dalam ≤ 2 menit.

---

## Fase 6 — Persiapan Demo

### T-024: Polesan multi-klinik & pengalaman demo ⬜
**Effort:** 90 mnt · **Butuh:** T-017, T-022
- Halaman `/demo` untuk presenter: link cepat ke 3 klinik (TV, remote, QR) + QR untuk membuka remote di HP.
- Cek ulang semua teks di TV: ukuran minimum, zona aman, tidak ada data pribadi.

### T-025: Uji soak & uji demo penuh ⬜
**Effort:** 120 mnt · **Butuh:** T-024 · **Konteks:** PRD §2.5
- Player jalan 2 jam di TV target. Catat crash/macet/memori.
- Gladi resik skenario PRD §6.1 dari awal sampai akhir, termasuk cabut internet 30 detik di tengah demo.
**Selesai jika:** semua checklist PRD §2.5 tercentang.

### T-026: SOP demo (1 halaman) ⬜
**Effort:** 45 mnt · **Butuh:** T-025
Isi minimal:
- **H-1:** buka proyek Supabase (cegah jeda), ganti PIN demo, reset demo, isi baterai HP.
- **Di lokasi:** sambungkan TV ke hotspot sendiri, matikan overscan, buka player, tekan **Mulai**, tes 1 panggilan dengan suara.
- **Rencana cadangan:** laptop + HDMI dengan Chrome layar penuh, dan video rekaman demo (60–90 detik) kalau semua gagal.

---

## Setelah Pitching (Fase MVP Pilot — belum dirinci)
⏭️ F-101 Login & peran Supabase Auth · ⏭️ F-102 Panel admin klinik · ⏭️ F-103 Bukti tayang sungguhan · ⏭️ F-104 Rasio slot sponsor/klinik · ⏭️ F-105 Mode offline (Service Worker) · ⏭️ F-106 Heartbeat layar · ⏭️ F-107 Laporan bagi hasil · ⏭️ F-108 Cetak tiket QR

## Ringkasan Ketergantungan
```
T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-008 → T-009 → T-010 ┐
                  └→ T-007 ─────────────┐                    └→ T-011 ┴→ T-012 → T-013 → T-014
                                         ├→ T-015 → T-016 → T-017 ─────────────┐
                                         │            └→ T-018                  ├→ T-024 → T-025 → T-026
                                         └→ T-019 → T-020, T-021 → T-022 → T-023┘
```
