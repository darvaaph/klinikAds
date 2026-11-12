# PRD: LayarKlinik (nama sementara)

**Versi:** 1.0 — Fase Prototipe Pitching
**Tanggal:** 2026-11-11
**Penulis:** Darva
**Status:** Draft

---

## 1. Ringkasan

**Satu kalimat:** Layar TV ruang tunggu klinik yang menampilkan nomor antrian per poli sekaligus iklan, edukasi, dan promo, dan bisa dipakai banyak klinik dari satu pusat kendali.

**Masalah:**
- Pasien tidak tahu nomor antrian yang sedang dilayani, sehingga terus bertanya ke petugas.
- Urutan pasien kadang diselak (pasien umum didahulukan).
- TV ruang tunggu hanya menayangkan sinetron. Pemilik klinik menilai ini tidak bermanfaat dan tidak menghasilkan apa-apa.

**Solusi:** TV menampilkan antrian real-time dan tayangan iklan/edukasi yang diatur dari CMS. Pemasukan dari sponsor dibagi dengan klinik.

**Fase dokumen ini:** **prototipe untuk pitching** ke dokter mitra (dr. Gamal) dan pengurus ASKLIN Kota Depok, dengan Klinik Pratama Palsigunung 2 sebagai klinik pilot utama. Demo memakai TV sungguhan yang dikendalikan dari HP. Sistem pilot penuh adalah fase berikutnya (lihat §4.2).

**Pengguna:** pasien di ruang tunggu, petugas klinik, admin pusat (Darva/tim), dan admin klinik (fase MVP).

**Platform:** Web app. TV membuka halaman player dalam mode kiosk, HP membuka remote dan halaman pantau antrian, laptop membuka CMS.

**Stack:** Next.js + TypeScript, Supabase (Postgres, Realtime, Storage), di-host di Vercel.

---

## 2. Visi Produk

### 2.1 Pernyataan Masalah
Di klinik pratama, pasien menunggu tanpa informasi urutan. Nomor dipanggil dengan suara petugas, sehingga sering terlewat, dan pasien terus bertanya. Ketika urutan tidak terlihat, penyelakan sulit dicegah dan menimbulkan rasa tidak adil. Di sisi lain, TV ruang tunggu sudah ada tetapi hanya menayangkan siaran umum. Layar itu bisa jadi media edukasi dan sumber pemasukan.

### 2.2 Alternatif yang Ada Sekarang
| Alternatif | Kenapa belum cukup |
|---|---|
| Panggilan suara manual | Mudah terlewat, tidak ada catatan urutan |
| Fitur display antrian di SIMKlinik | Hanya antrian, tidak ada iklan/edukasi atau pemasukan. Tiap vendor berbeda |
| Platform digital signage umum | Tidak tersambung ke antrian, dan tidak memahami aturan iklan kesehatan |
| TV menayangkan siaran umum | Tidak relevan, tidak ada manfaat bagi klinik |

### 2.3 Nilai Unik
- **Untuk pasien:** tahu posisi antrian dari TV atau HP, dan urutannya transparan.
- **Untuk klinik:** ruang tunggu lebih tertib, ada media promo layanan sendiri, dan ada **bagi hasil iklan**.
- **Untuk sponsor:** menjangkau audiens yang sedang memikirkan kesehatannya, dengan laporan bukti tayang per klinik.

### 2.4 Indikator Sukses (Fase Pitching)
- Prototipe didemokan di depan dokter mitra dan pengurus ASKLIN **tanpa gangguan teknis**.
- Setidaknya **1 klinik setuju menjadi pilot** setelah demo.
- Setidaknya **1 calon sponsor** (bank atau FMCG) tertarik setelah melihat demo.

### 2.5 Kriteria Prototipe Selesai
- [ ] TV sungguhan menampilkan player dalam layar penuh, dan tidak ada bagian yang terpotong.
- [ ] Tombol "Panggil berikutnya" di HP mengubah TV dalam **≤ 2 detik**.
- [ ] Kartu panggilan muncul ±6 detik, disertai suara panggilan bahasa Indonesia atau bunyi chime.
- [ ] Iklan video dan gambar bergiliran tanpa macet selama **≥ 30 menit**.
- [ ] Bisa berpindah antara 2–3 klinik contoh dengan logo, warna, dan poli berbeda.
- [ ] Iklan baru bisa diunggah dari CMS ke klinik tertentu dan langsung tayang di TV klinik itu.
- [ ] Halaman QR menampilkan posisi antrian pasien.

---

## 3. Pengguna & Peran

### 3.1 Peran

| Peran | Siapa | Kemampuan utama (prototipe) |
|---|---|---|
| `pasien` | Orang di ruang tunggu | Menonton TV, scan QR, melihat posisi antrian. Tanpa login |
| `petugas_klinik` | Petugas pendaftaran/poli (saat demo: presenter) | Lewat remote ber-PIN: buat nomor, panggil, panggil ulang, tandai tidak hadir, beri prioritas dengan alasan |
| `admin_pusat` | Darva/tim | Lewat CMS ber-PIN admin: kelola klinik contoh, unggah konten, atur penempatan per klinik, lihat laporan tayang (data contoh) |
| `admin_klinik` | Pemilik/manajer klinik | **Fase MVP.** Di prototipe hanya ditunjukkan sebagai mockup: kelola konten milik klinik, tolak iklan sponsor, lihat laporan kliniknya |

### 3.2 Persona Utama

**Bu Rina — pasien BPJS, 45 tahun**
- **Konteks:** datang pagi, menunggu 30–90 menit, membawa anak.
- **Tujuan:** tahu kapan gilirannya, bisa ke warung sebentar tanpa takut terlewat.
- **Masalah sekarang:** tidak ada informasi, merasa diselak.
- **Kenyamanan teknologi:** sedang. Bisa memakai WhatsApp dan scan QR.

**dr. Gamal — dokter mitra / pemilik klinik**
- **Tujuan:** ruang tunggu tertib, ada pemasukan tambahan, citra klinik modern.
- **Kekhawatiran:** iklan yang tidak pantas, etika profesi, repot mengurus sistem.
- **Kenyamanan teknologi:** sedang–tinggi.

### 3.3 Autentikasi (Prototipe)
- **Remote:** PIN 6 digit per klinik → cookie httpOnly bertanda tangan, berlaku 12 jam.
- **CMS:** PIN admin pusat (satu, dari environment variable) → cookie 12 jam.
- **TV player & halaman QR:** tanpa login. Hanya menampilkan data yang aman untuk publik (tanpa nama atau NIK).
- **Fase MVP:** Supabase Auth (email + password) dengan peran `admin_pusat`, `admin_klinik`, `petugas_klinik`.

---

## 4. Fitur

### 4.1 Must-Have (Prototipe)

#### F-001: Web Player TV
- **Deskripsi:** Halaman layar penuh `/tv/[slugKlinik]` dengan tata letak desain A: antrian per poli di kiri (±27%), iklan di kanan, logo sponsor, running text, jam, dan tanggal.
- **Peran:** pasien (melihat)
- **Input:** slug klinik di URL, data antrian dan playlist dari Supabase
- **Proses:**
  - Kanvas tetap 1920×1080 diskalakan ke ukuran layar (scale-to-fit, letterbox).
  - Semua teks dan angka berada di zona aman (96 px kiri-kanan, 54 px atas-bawah).
  - Mode **kartu** untuk ≤ 4 poli, mode **daftar** untuk 5–6 poli.
  - Berlangganan perubahan real-time. Kalau koneksi real-time putus, beralih ke polling setiap 5 detik.
- **Output:** tampilan antrian terkini dan tayangan iklan bergiliran
- **Kriteria penerimaan:**
  - Tampil penuh tanpa terpotong di 1920×1080, 1366×768, dan 3840×2160.
  - Angka antrian ≥ 100 px, teks lain ≥ 28 px pada kanvas 1920.
  - Perubahan antrian muncul ≤ 2 detik setelah tombol ditekan di remote.
  - Tidak menampilkan nama, NIK, atau jenis penjamin.
- **Ketergantungan:** F-006 (data klinik), F-002 (data antrian)

#### F-002: Kartu Panggilan + Suara
- **Deskripsi:** Saat ada panggilan, layar menampilkan kartu besar "A-014 → Poli Umum, Ruang 1" selama ±6 detik. Video iklan dijeda dan suara panggilan diputar 2×.
- **Peran:** pasien
- **Input:** event `panggilan` baru (jenis `baru` atau `ulang`)
- **Proses:**
  - Pause video, tampilkan kartu, putar chime lalu TTS bahasa Indonesia (`speechSynthesis`, `lang=id-ID`). Kalau TTS tidak tersedia, cukup chime.
  - Setelah kartu hilang, video dilanjutkan dan kartu poli berkedip 3×.
  - Kalau ada beberapa panggilan berturut-turut, semuanya masuk antrean tampil dan tidak saling menimpa.
- **Output:** kartu panggilan dan suara
- **Kriteria penerimaan:**
  - Kartu tampil 6 ± 1 detik per panggilan.
  - 3 panggilan dalam 2 detik tampil berurutan, tidak ada yang hilang.
  - Ada tombol "Mulai" saat player pertama dibuka, untuk membuka izin suara dari browser.
- **Ketergantungan:** F-001

#### F-003: Remote / Simulator di HP
- **Deskripsi:** Halaman `/remote/[slugKlinik]` yang nyaman di HP, untuk mengendalikan antrian saat demo, dan nantinya dipakai petugas.
- **Peran:** petugas_klinik
- **Input:** PIN, pilihan poli, tombol aksi; opsional penjamin dan prioritas beserta alasannya
- **Proses:**
  - **Buat nomor:** pilih poli → nomor berikutnya hari itu (A-001, A-002, …).
  - **Panggil berikutnya:** yang dipilih adalah tiket `menunggu` dengan prioritas terlebih dahulu, lalu yang paling lama menunggu.
  - **Panggil ulang:** nomor yang terakhir dipanggil.
  - **Tidak hadir:** tiket ditandai `tidak_hadir`.
  - **Prioritas:** wajib memilih alasan: lansia, ibu hamil, disabilitas, atau darurat.
  - **Reset demo:** hapus semua tiket hari ini di klinik itu.
- **Output:** status terbaru per poli di HP, dan perubahan di TV
- **Kriteria penerimaan:**
  - Tidak ada pilihan "dahulukan pasien umum". Satu-satunya cara memajukan urutan adalah prioritas dengan alasan.
  - Dua HP yang menekan "panggil" bersamaan tidak memanggil nomor yang sama.
  - Tombol minimal 56 px dan bisa dipakai dengan satu tangan.
- **Ketergantungan:** F-006

#### F-004: Halaman Pantau Antrian (QR)
- **Deskripsi:** `/q/[slugKlinik]`. Pasien memasukkan atau memilih nomornya, lalu melihat nomor yang sedang dilayani dan berapa orang lagi di depannya.
- **Peran:** pasien
- **Input:** kode nomor (misal A-014)
- **Output:** nomor yang sedang dilayani di poli itu, jumlah orang di depan, dan status tiket
- **Kriteria penerimaan:**
  - Halaman terbuka ≤ 3 detik di jaringan 4G.
  - Diperbarui otomatis (real-time atau polling 10 detik).
  - Tidak menampilkan data pribadi apa pun.
- **Ketergantungan:** F-003

#### F-005: CMS Konten (setengah jadi)
- **Deskripsi:** `/cms` untuk admin pusat.
- **Peran:** admin_pusat
- **Input:** file video (MP4 H.264, ≤ 50 MB) atau gambar (JPG/PNG/WebP 1920×1080), judul, kategori (iklan sponsor / edukasi / promo klinik / info), sponsor, durasi tampil gambar, nomor izin edar BPOM (wajib untuk kategori obat/suplemen), dan klinik tujuan
- **Proses:**
  - Unggah ke Supabase Storage, buat `konten`, lalu buat `penempatan` per klinik.
  - Atur running text per klinik.
- **Output:** konten masuk ke playlist TV klinik tujuan dalam ≤ 1 menit
- **Kriteria penerimaan:**
  - Konten sponsor obat atau suplemen tanpa nomor izin edar BPOM ditolak oleh form.
  - Halaman "Laporan tayang" tampil, berisi data contoh: tayangan per konten per klinik per hari.
  - Mockup statis peran `admin_klinik` (setujui/tolak iklan, isi slot klinik) tersedia untuk ditunjukkan.
- **Ketergantungan:** F-006

#### F-006: Multi-Klinik Contoh
- **Deskripsi:** 2–3 klinik contoh, masing-masing dengan logo, warna utama, poli, ruang, dan playlist sendiri.
- **Peran:** admin_pusat (atur), pasien (melihat)
- **Kriteria penerimaan:**
  - Mengganti URL `/tv/palsigunung-2` ke `/tv/klinik-b` mengubah logo, warna, poli, dan iklan.
  - Warna utama dicek kontrasnya dengan teks putih (≥ 4,5:1). Kalau gagal, warna ditolak.

### 4.2 Should-Have (Fase MVP Pilot)
- **F-101 Login & peran sungguhan** (Supabase Auth, RLS per klinik)
- **F-102 Panel admin klinik:** isi slot klinik, tolak iklan sponsor, lihat laporan sendiri
- **F-103 Bukti tayang sungguhan:** player mencatat setiap tayangan ke `log_tayang`
- **F-104 Slot sponsor vs slot klinik** dengan rasio yang diatur (misal 60:40) dan dikunci
- **F-105 Mode offline player:** video di-cache dengan Service Worker. Antrian tetap tampil versi terakhir ketika internet putus
- **F-106 Heartbeat layar:** status online/offline tiap TV terlihat di CMS
- **F-107 Laporan bagi hasil** per klinik per bulan dari data `log_tayang`
- **F-108 Cetak tiket antrian** dengan QR (printer thermal)

### 4.3 Nice-to-Have (Nanti)
- **F-201 Integrasi SIMKlinik vendor** sebagai sumber antrian. *Alasan ditunda:* tiap vendor berbeda, perlu izin dan akses API.
- **F-202 Penjadwalan iklan per jam** (misal iklan susu bayi hanya pagi hari saat jadwal poli KIA).
- **F-203 Estimasi waktu tunggu** dari rata-rata lama layanan.
- **F-204 Aplikasi Android TV native** kalau browser TV terbukti tidak andal.

---

## 5. User Stories

**US-001:** Sebagai pasien, saya ingin melihat nomor yang sedang dilayani di poli saya, supaya saya tahu masih berapa lama menunggu.
- **Given** TV menyala di `/tv/palsigunung-2` · **When** petugas memanggil A-014 · **Then** kartu Poli Umum menampilkan A-014 dalam ≤ 2 detik. — F-001

**US-002:** Sebagai pasien, saya ingin mendengar dan melihat panggilan dengan jelas, supaya tidak terlewat.
- **Given** video iklan sedang diputar · **When** ada panggilan baru · **Then** video dijeda, kartu besar muncul ±6 detik, dan suara panggilan diputar 2×. — F-002

**US-003:** Sebagai petugas, saya ingin memanggil pasien berikutnya dengan satu tombol, supaya tidak perlu berteriak.
- **Given** ada 3 tiket menunggu di Poli Umum · **When** saya menekan "Panggil berikutnya" · **Then** tiket paling lama (atau yang berprioritas) berstatus `dipanggil` dan TV ikut berubah. — F-003

**US-004:** Sebagai petugas, saya ingin mendahulukan lansia atau ibu hamil, dengan alasan yang tercatat.
- **Given** tiket A-020 dibuat · **When** saya menandai prioritas "lansia" · **Then** A-020 dipanggil sebelum tiket non-prioritas, dan TV menampilkan tanda "Prioritas". — F-003

**US-005:** Sebagai pasien, saya ingin memantau antrian dari HP, supaya bisa keluar ruangan sebentar.
- **Given** saya punya nomor A-014 · **When** saya scan QR dan memasukkan A-014 · **Then** saya melihat "Sedang dilayani A-011 · 2 orang lagi". — F-004

**US-006:** Sebagai admin pusat, saya ingin mengunggah iklan sponsor ke klinik tertentu, supaya iklan tayang hanya di klinik yang dibayar sponsor.
- **Given** saya login CMS · **When** saya mengunggah video dan memilih Klinik A · **Then** video tayang di TV Klinik A dalam ≤ 1 menit, dan tidak tayang di Klinik B. — F-005

**US-007:** Sebagai admin pusat, saya ingin form menolak iklan obat tanpa nomor izin edar, supaya kita tidak melanggar aturan BPOM.
- **Given** kategori konten "obat/suplemen" · **When** kolom izin edar kosong · **Then** form tidak bisa disimpan. — F-005

**US-008:** Sebagai presenter demo, saya ingin berpindah klinik contoh, supaya audiens melihat sistem ini bisa dipakai banyak klinik.
- **Given** TV di `/tv/palsigunung-2` · **When** saya membuka `/tv/klinik-b` · **Then** logo, warna, poli, dan iklan berubah. — F-006

**US-009:** Sebagai presenter, saya ingin mengosongkan antrian sebelum demo, supaya mulai dari A-001.
- **Given** ada tiket hari ini · **When** saya menekan "Reset demo" dan mengonfirmasi · **Then** semua tiket hari ini di klinik itu terhapus dan TV menampilkan "–". — F-003

---

## 6. Alur Pengguna

### 6.1 Alur Utama: Panggilan Pasien (skenario demo)
**Aktor:** presenter (sebagai petugas) dan audiens (sebagai pasien)
1. Presenter menyalakan TV dan membuka `/tv/palsigunung-2` di browser kiosk, lalu menekan **Mulai** dengan remote TV.
2. TV menampilkan antrian kosong dan playlist iklan berjalan.
3. Presenter membuka `/remote/palsigunung-2` di HP, lalu memasukkan PIN.
4. Presenter membuat 5 nomor (Poli Umum ×3, Poli Gigi ×2).
5. Presenter menekan **Panggil berikutnya** di Poli Umum.
6. Sistem mengubah A-001 menjadi `dipanggil` dan mencatat event `panggilan`.
7. Dalam ≤ 2 detik, video di TV dijeda, kartu "A-001 → Poli Umum, Ruang 1" muncul, suara diputar, lalu tampilan kembali normal.
8. Audiens scan QR di layar (slide QR) dan melihat posisi antrian di HP masing-masing.

**Jalur alternatif:**
- Pasien tidak datang → **Tidak hadir** → panggil berikutnya.
- Panggilan tidak terdengar → **Panggil ulang** → kartu muncul lagi dengan jenis `ulang`.

### 6.2 Alur Unggah Iklan
1. Admin login di `/cms` → **Konten → Tambah**.
2. Pilih file, kategori, sponsor, dan izin BPOM (kalau obat/suplemen).
3. Pilih klinik tujuan dan rentang tanggal → **Simpan**.
4. TV klinik tujuan menerima perubahan playlist (real-time). Konten baru masuk ke putaran berikutnya.

### 6.3 Error & Edge Case
| Skenario | Perilaku |
|---|---|
| Internet venue demo putus | Player tetap memutar video yang sudah dimuat dan antrian terakhir. Badge kecil "Offline" muncul di pojok (hanya di zona aman). Remote menampilkan pesan gagal |
| Browser memblokir suara | Layar "Ketuk Mulai" saat player dibuka. Kalau suara tetap gagal, cukup kartu visual dan chime |
| TTS bahasa Indonesia tidak ada di TV | Hanya chime, kartu tetap tampil |
| File video tidak bisa diputar (codec) | Lewati ke konten berikutnya, catat di console. CMS hanya menerima MP4 H.264 |
| Dua HP memanggil bersamaan | Fungsi database terkunci per poli, jadi setiap HP mendapat nomor berbeda |
| Panggil saat tidak ada tiket menunggu | Tombol nonaktif, dengan teks "Tidak ada antrian" |
| Slug klinik salah | Halaman "Klinik tidak ditemukan" |
| PIN salah 5× | Kunci 5 menit |
| Pergantian hari | Nomor mulai lagi dari 001. Tiket kemarin tidak tampil |

---

## 7. Kebutuhan Non-Fungsional

### 7.1 Performa
- Perubahan antrian sampai ke TV ≤ 2 detik (p95) di Wi-Fi atau 4G.
- Player jalan stabil ≥ 8 jam tanpa memori bocor (uji soak 2 jam di fase prototipe).
- Halaman QR ≤ 3 detik di 4G.

### 7.2 Keamanan & Privasi
- Tidak ada data pribadi pasien di prototipe. `penjamin` opsional dan tidak pernah dikirim ke endpoint publik.
- Service role key Supabase hanya dipakai di server dan tidak pernah dikirim ke browser.
- Endpoint publik (`/tv`, `/q`) hanya membaca view yang aman.
- PIN disimpan dalam bentuk hash (bcrypt).

### 7.3 Skalabilitas
- Prototipe: 3 klinik, 1–2 layar per klinik.
- MVP pilot: target 10 klinik / 20 layar. Masih dalam batas free atau paket kecil Supabase.

### 7.4 Aksesibilitas (Layar TV)
- Kontras teks ≥ 4,5:1, termasuk warna utama klinik terhadap teks putih.
- Status panggilan tidak hanya dibedakan dengan warna, tapi juga badge teks dan kedipan.
- Huruf minimum sesuai §4.1 F-001.

### 7.5 Bahasa
- Bahasa Indonesia saja. Format waktu 24 jam (`14.05`), tanggal "Rabu, 11 November 2026", zona waktu Asia/Jakarta.

### 7.6 Kompatibilitas
- **Player:** Chrome/WebView Android TV versi 2021 ke atas (Chromium ≥ 90), Chrome desktop. Diuji di minimal 1 Android TV sungguhan.
- **Remote & QR:** Chrome Android dan Safari iOS terbaru.
- **CMS:** Chrome/Edge desktop.

---

## 8. Batasan & Di Luar Cakupan

### 8.1 Timeline
- **Tanggal pitching:** _TBD_
- **Estimasi pengerjaan:** ±4 minggu, dikerjakan sendiri paruh waktu (lihat `05-TASKS.md`)

### 8.2 Tim
| Nama | Peran | Tanggung jawab |
|---|---|---|
| Darva | Developer & desainer | Arsitektur, prototipe, materi demo |
| dr. Gamal | Mitra bisnis | Akses ke ASKLIN Depok/IDI Jabar, bank, prinsipal farmasi, 1–3 klinik pilot |

**Klinik pilot utama:** Klinik Pratama Palsigunung 2 (KPRJ Palsigunung 2), slug `palsigunung-2`. Data poli, ruang, TV, dan internet: _TBD_ dari wawancara. Nama dan logo klinik dipakai di demo hanya dengan izin klinik.

### 8.3 Budget
- Ada sedikit budget. Gunakan free tier Supabase dan Vercel. Opsional: domain (±Rp150–250 ribu/tahun, _perlu dicek_).
- Catatan: paket gratis Vercel (Hobby) ditujukan untuk penggunaan non-komersial. Saat masuk fase pilot berbayar, pertimbangkan paket berbayar. _This needs verification._

### 8.4 Di Luar Cakupan
- SIMKlinik, rekam medis, integrasi BPJS (P-Care/Antrean Online), integrasi SATUSEHAT
- Data pribadi pasien (nama, NIK, nomor kartu)
- Pembayaran sponsor, penagihan, dan pembayaran bagi hasil
- Aplikasi native (Android TV/iOS)
- Fitur "dahulukan pasien umum" atau label BPJS/umum di layar

### 8.5 Risiko
| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Suara terblokir atau TTS tidak ada di TV saat demo | Tinggi | Tinggi | Tombol "Mulai", fallback chime, uji di TV yang sama sebelum demo |
| Internet venue lemah | Sedang | Tinggi | Bawa hotspot. Video demo kecil (720p, ≤ 20 MB), dimuat sebelum mulai |
| Proyek Supabase gratis "tidur" karena lama tidak dipakai | Sedang | Tinggi | Buka proyek H-1 dan pagi hari demo. _Aturan jeda perlu dicek_ |
| Browser TV lama tidak mendukung fitur | Sedang | Sedang | Uji di TV target sejak minggu 2. Siapkan Android TV box sebagai cadangan |
| Iklan obat dianggap konflik etika dokter | Sedang | Tinggi | Konsultasikan ke dr. Gamal/IDI sebelum pitching ke farmasi. Utamakan sponsor bank/FMCG |
| Klinik menolak urutan antrian yang transparan | Sedang | Sedang | Bahas sejak awal. Prioritas medis dengan alasan tercatat |

---

## 9. Glosarium
| Istilah | Arti |
|---|---|
| Poli | Unit layanan di klinik (umum, gigi, KIA) atau loket (farmasi, lab) |
| Tiket | Satu nomor antrian, misal A-014 |
| Panggilan | Event ketika tiket dipanggil (baru atau ulang) |
| Konten | Video, gambar, atau running text yang ditayangkan |
| Penempatan | Aturan "konten X tayang di klinik Y dari tanggal A sampai B" |
| Slot sponsor / slot klinik | Bagian waktu tayang milik sponsor (dikunci pusat) atau milik klinik |
| Bukti tayang | Catatan konten apa tayang kapan dan di layar mana |
| Zona aman | Area tengah layar yang dijamin tidak terpotong overscan TV |
| Mode kiosk | Browser dikunci ke satu halaman layar penuh |

## 10. Riwayat Perubahan
| Versi | Tanggal | Penulis | Perubahan |
|---|---|---|---|
| 1.0 | 2026-11-11 | Darva | PRD awal fase prototipe |

---

## Lampiran: Catatan untuk AI Coding
Prioritaskan §4 (fitur & kriteria), §5 (user stories), §6.3 (edge case). Aturan yang **tidak boleh dilanggar**:
1. Tidak ada fitur dan tidak ada tampilan yang membedakan pasien BPJS dan pasien umum.
2. Endpoint publik tidak pernah mengembalikan `penjamin` atau data pribadi.
3. Semua teks TV di dalam zona aman, dengan ukuran minimum sesuai F-001.
