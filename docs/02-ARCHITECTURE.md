# Arsitektur: LayarKlinik (Prototipe)

**Versi:** 1.0
**Tanggal:** 2026-11-11
**Terkait:** `01-PRD.md`

---

## 1. Tech Stack

### 1.1 Pilihan

| Lapisan | Teknologi | Versi | Alasan |
|---|---|---|---|
| Frontend + server | Next.js (App Router) + TypeScript | 15.x | Sudah dikuasai. Satu codebase untuk player, remote, QR, dan CMS |
| Styling | Tailwind CSS | 4.x | Cepat. Token warna per klinik lewat CSS variable |
| Database | Supabase Postgres | 15+ | Relasional (cocok untuk laporan tayang), ada fungsi SQL untuk penomoran yang aman |
| Real-time | Supabase Realtime (`postgres_changes`) | – | HP → DB → TV tanpa server WebSocket sendiri |
| Penyimpanan file | Supabase Storage (bucket publik `konten`) | – | Video/gambar iklan, dengan URL CDN |
| Validasi | Zod | 3.x | Validasi input di route handler |
| Hash PIN | bcryptjs | – | Tanpa dependensi native, aman di Vercel |
| Sesi prototipe | Cookie httpOnly bertanda tangan (`jose`, HS256) | – | Ringan. Diganti Supabase Auth di fase MVP |
| Hosting | Vercel | – | Deploy dari Git, preview per branch |
| Browser TV | Fully Kiosk Browser (Android TV) atau Chrome layar penuh | – | Autostart, mode kiosk, reload jarak jauh |

### 1.2 Alternatif yang Ditolak
| Alternatif | Alasan |
|---|---|
| Firebase Firestore | NoSQL, sehingga rekap bukti tayang per klinik per bulan lebih repot |
| Socket.io + server sendiri | Harus mengurus server. Terlalu lama untuk prototipe yang dikerjakan sendiri |
| BroadcastChannel/localStorage saja | Hanya bekerja di satu browser yang sama, sedangkan HP dan TV adalah perangkat berbeda |
| Aplikasi Android TV native | Perlu waktu lebih lama. Ditunda sampai browser TV terbukti tidak andal (F-204) |

### 1.3 Batasan yang Perlu Ditinjau Ulang
- Sesi PIN dan cookie hanya untuk prototipe. Fase MVP wajib Supabase Auth + RLS per klinik.
- Free tier Supabase punya batas penyimpanan dan bisa menjeda proyek yang lama tidak dipakai. _Cek batas terbaru sebelum demo._
- Playlist diambil penuh setiap ada perubahan. Ini cukup untuk ≤ 50 konten per klinik.

---

## 2. Arsitektur Sistem

### 2.1 Pola
Monolit Next.js (SSR + Route Handlers) di Vercel. Status disimpan di Postgres. Perubahan didorong ke klien lewat Supabase Realtime. Klien publik hanya membaca **view** yang aman.

### 2.2 Diagram

```
 HP Presenter/Petugas            TV Ruang Tunggu               HP Pasien
 /remote/[slug]                  /tv/[slug]                    /q/[slug]
      │ POST (cookie PIN)             ▲ subscribe realtime          ▲ subscribe/poll
      ▼                               │ + GET snapshot              │
┌──────────────────────────── Next.js @ Vercel ─────────────────────────────┐
│ Route Handlers  /api/...   ── service role key (server only) ──┐          │
│ Server Components (SSR awal player, CMS)                       │          │
└────────────────────────────────────────────────────────────────┼──────────┘
                                                                  ▼
                       ┌──────────────────── Supabase ───────────────────────┐
                       │ Postgres: tabel + fungsi RPC (ambil_nomor,           │
                       │           panggil_berikutnya, panggil_ulang)         │
                       │ Views publik: v_tampilan_poli, v_playlist            │
                       │ Realtime: postgres_changes (panggilan, tiket, dll)   │
                       │ Storage: bucket "konten" (video/gambar)              │
                       └──────────────────────────────────────────────────────┘
 Laptop Admin  /cms  ──► Route Handlers ──► Storage (signed upload URL) + DB
```

### 2.3 Komponen

**Player TV (`/tv/[slug]`)**
- Client component layar penuh di dalam pembungkus `ScaleToFit` (kanvas 1920×1080 → `transform: scale(min(w/1920, h/1080))`).
- Status lokal: `poli[]`, `playlist[]`, `antreanKartu[]` (panggilan yang menunggu tampil), `audioUnlocked`.
- Berlangganan: `INSERT` pada `panggilan`, `INSERT/UPDATE` pada `tiket_antrian`, perubahan `penempatan`/`konten`/`klinik` (filter `klinik_id`). Setiap event → ambil ulang snapshot (`GET /api/klinik/[slug]/tampilan`). Lebih sederhana dan konsisten daripada menggabungkan perubahan satu per satu di klien.
- Fallback: kalau status channel bukan `SUBSCRIBED` selama > 10 detik → polling snapshot setiap 5 detik.
- Pemutar konten: satu elemen `<video>` dan satu `<img>`. Rotasi berbobot dari `v_playlist`. Gambar tampil `durasi_detik`, video sampai `ended`. Kalau error, lewati ke berikutnya.
- Kartu panggilan: antrean FIFO; tiap item tampil 6 detik; `video.pause()` → chime (`/sounds/chime.mp3`) → `speechSynthesis.speak("Nomor antrian A, nol satu empat, silakan ke Poli Umum, Ruang satu")` ×2 → `video.play()`.

**Remote (`/remote/[slug]`)**
- Login PIN → cookie `lk_remote` (berisi `klinik_id`, berlaku 12 jam).
- Tampilan per poli: nomor terakhir dipanggil, jumlah menunggu, tombol aksi.
- Berlangganan perubahan tiket supaya beberapa HP tetap sinkron.

**Halaman QR (`/q/[slug]`)**
- Input kode → `GET /api/klinik/[slug]/posisi?kode=A-014` → polling 10 detik.

**CMS (`/cms`)**
- Login PIN admin → cookie `lk_admin`.
- Halaman: Klinik, Konten (unggah), Penempatan, Running text, Laporan (data contoh), Mockup Admin Klinik (statis).
- Unggah: server membuat signed upload URL → browser mengunggah langsung ke Storage → server menyimpan baris `konten`.

### 2.4 Layanan Eksternal
| Layanan | Fungsi | Cara |
|---|---|---|
| Supabase | DB, real-time, storage | `@supabase/supabase-js` v2 |
| Web Speech API | Suara panggilan | Bawaan browser. Ketersediaan suara `id-ID` di TV **harus diuji** |
| Fully Kiosk Browser | Mode kiosk di Android TV | Aplikasi di TV, start URL = player |

---

## 3. Struktur Folder

```
layarklinik/
├── src/
│   ├── app/
│   │   ├── tv/[slug]/page.tsx            # Player TV
│   │   ├── remote/[slug]/page.tsx        # Remote HP (+ login PIN)
│   │   ├── q/[slug]/page.tsx             # Pantau antrian
│   │   ├── cms/
│   │   │   ├── login/page.tsx
│   │   │   ├── klinik/page.tsx
│   │   │   ├── konten/page.tsx
│   │   │   ├── penempatan/page.tsx
│   │   │   ├── laporan/page.tsx
│   │   │   └── mockup-admin-klinik/page.tsx
│   │   └── api/                          # Lihat 04-API.md
│   ├── components/
│   │   ├── tv/      ScaleToFit.tsx, PanelAntrian.tsx, KartuPoli.tsx, DaftarPoli.tsx,
│   │   │            PemutarKonten.tsx, KartuPanggilan.tsx, RunningText.tsx, Jam.tsx
│   │   ├── remote/  PanelPoli.tsx, DialogPrioritas.tsx
│   │   ├── cms/     FormKonten.tsx, TabelPenempatan.tsx
│   │   └── ui/      Button.tsx, Card.tsx, Dialog.tsx
│   ├── lib/
│   │   ├── supabase/server.ts            # client service role (server only)
│   │   ├── supabase/browser.ts           # client anon (realtime + view publik)
│   │   ├── session.ts                    # sign/verify cookie PIN (jose)
│   │   ├── suara.ts                      # chime + TTS + unlock audio
│   │   ├── playlist.ts                   # rotasi berbobot
│   │   ├── kontras.ts                    # cek kontras warna klinik
│   │   └── format.ts                     # kode nomor, tanggal Indonesia
│   ├── hooks/ useTampilan.ts, useRealtimeKlinik.ts
│   └── types/ db.ts                      # hasil `supabase gen types`
├── supabase/
│   ├── migrations/                       # skema, fungsi, view (03-DATABASE.md)
│   └── seed.sql                          # 3 klinik contoh + konten + log contoh
├── public/sounds/chime.mp3
└── docs/                                 # dokumen perencanaan ini
```

---

## 4. Keputusan Arsitektur Penting

### 4.1 Alur Data "Panggil Berikutnya"
1. HP: `POST /api/klinik/palsigunung-2/panggil {poliId}`. Cookie diverifikasi, `klinik_id` cocok.
2. Server: `rpc('panggil_berikutnya', {p_poli_id})`. Fungsi SQL mengunci baris poli, menandai tiket `dipanggil` sebelumnya sebagai `dilayani`, memilih tiket `menunggu` urut `prioritas DESC, dibuat_pada ASC`, mengubahnya jadi `dipanggil`, lalu `INSERT panggilan`. Semuanya dalam satu transaksi.
3. Realtime menyiarkan `INSERT panggilan` ke TV dan HP lain.
4. TV mengambil snapshot, memasukkan panggilan ke antrean kartu, lalu menampilkan kartu dan suara.

### 4.2 Keamanan Data
- Browser hanya memakai **anon key** dan hanya bisa `SELECT` ke view publik dan tabel yang dibuka RLS (`klinik`, `poli`, `panggilan` tanpa data sensitif, `v_tampilan_poli`, `v_playlist`).
- Semua penulisan lewat Route Handler dengan **service role key** (env server). Tidak ada `INSERT/UPDATE` langsung dari browser.
- Kolom `penjamin` tidak pernah masuk view publik.
- Realtime `postgres_changes` mematuhi RLS. Tabel `tiket_antrian` hanya dibuka untuk kolom yang aman lewat publikasi terbatas. Kalau terlalu rumit, TV cukup berlangganan `panggilan` dan `tiket_event` lalu mengambil snapshot.

### 4.3 Error Handling
- **Route Handler:** respons `{ ok: false, error: { kode, pesan } }` dengan HTTP status yang sesuai (lihat `04-API.md`).
- **Player:** tidak boleh menampilkan error teknis di TV. Error dicatat ke console, lalu badge kecil "Offline" atau "Memuat ulang…" muncul di zona aman.
- **Remote:** toast berisi pesan dalam bahasa Indonesia.
- **Error boundary** di `/tv`: kalau komponen crash → reload halaman setelah 10 detik.

### 4.4 State
- **Server state:** snapshot dari API + event real-time (tanpa React Query di prototipe, cukup hook custom).
- **URL state:** slug klinik di path. `?demo=1` menampilkan tombol bantu presenter.
- **Persisten lokal:** `localStorage` hanya untuk `audioUnlocked` dan kode nomor terakhir di halaman QR, dibungkus try/catch.

### 4.5 Aturan Tampilan TV (dari hasil desain)
- Kanvas 1920×1080. Zona aman 96 px kiri-kanan, 54 px atas-bawah.
- Mode kartu (≤ 4 poli): panel antrian 520 px, angka 112 px. Mode daftar (5–6 poli): panel 600 px, angka 100 px.
- Area video 16:9. Label "Iklan" pada konten kategori iklan sponsor.
- Warna: latar #F6F8F9, kartu #FFFFFF, teks #13262B/#4A5F65, warna utama per klinik (default #0B5563), penanda #F2B134 (badge "DIPANGGIL" dan kedipan saja).
- Font: Inter (teks), Space Grotesk (angka, `tabular-nums`). Font dimuat lokal (`next/font`) supaya tidak bergantung pada internet venue.

---

## 5. Workflow Pengembangan

### 5.1 Setup Lokal
- Node.js 20+, pnpm, Supabase CLI, Docker (untuk `supabase start`)

```bash
pnpm create next-app layarklinik --ts --tailwind --app --src-dir
cd layarklinik
pnpm add @supabase/supabase-js zod bcryptjs jose
pnpm add -D supabase @types/bcryptjs
pnpm supabase init && pnpm supabase start
pnpm supabase db reset          # jalankan migrasi + seed
pnpm supabase gen types typescript --local > src/types/db.ts
pnpm dev
```

### 5.2 Konvensi
- Komponen PascalCase, fungsi camelCase, file non-komponen kebab-case.
- Nama domain dalam bahasa Indonesia (`tiket`, `poli`, `penempatan`). Istilah teknis tetap bahasa Inggris (`hook`, `route`).
- Import absolut `@/`.

### 5.3 Git
- GitHub Flow: `main` selalu bisa didemokan, fitur di branch `feat/...`.
- Conventional Commits (`feat:`, `fix:`, `chore:`).

### 5.4 Pengujian
- **Unit (Vitest):** `playlist.ts`, `kontras.ts`, `format.ts`.
- **SQL:** uji `panggil_berikutnya` untuk panggilan bersamaan (2 koneksi paralel).
- **Manual wajib:** checklist uji di TV sungguhan (lihat `05-TASKS.md` Fase 6).

---

## 6. Deployment

### 6.1 Lingkungan
| Lingkungan | URL | Fungsi |
|---|---|---|
| Lokal | localhost:3000 | Pengembangan |
| Preview | *.vercel.app per branch | Uji di TV/HP sebelum merge |
| Demo | _TBD_ (domain sendiri, opsional) | Dipakai saat pitching |

### 6.2 Proses
Push ke `main` → Vercel build otomatis. Migrasi database dijalankan manual dengan `supabase db push` sebelum merge.

### 6.3 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
SESSION_SECRET=                    # min 32 karakter, untuk tanda tangan cookie
ADMIN_PIN_HASH=                    # bcrypt hash PIN CMS
```

### 6.4 Monitoring
- Prototipe: log Vercel dan console player. Halaman `/tv/[slug]?debug=1` menampilkan status real-time, FPS, dan konten aktif (hanya untuk persiapan demo).
- MVP: heartbeat layar (F-106) dan Sentry (opsional).

---

## 7. Keamanan
- Validasi Zod di semua Route Handler.
- Query lewat supabase-js/RPC, tidak ada SQL string mentah dari input.
- Teks konten (running text) dirender sebagai teks, bukan HTML.
- Batas percobaan PIN: 5 gagal → kunci 5 menit (disimpan di tabel `percobaan_pin` atau memori instance. Untuk prototipe cukup di DB).
- Service role key hanya di server. Cek dengan build: tidak ada `SUPABASE_SERVICE_ROLE_KEY` di bundle klien.

## 8. Performa
- Video demo: MP4 H.264, 1080p ≤ 8 Mbps atau 720p, ≤ 20 MB per file. Preload video berikutnya (`preload="auto"` di elemen kedua).
- Snapshot TV < 10 KB JSON.
- Player tanpa library animasi berat. Animasi hanya pakai CSS (`transform`, `opacity`).
- Reload otomatis player setiap 6 jam (mencegah memori menumpuk di browser TV).

## 9. Dokumen Terkait
- `01-PRD.md` · `03-DATABASE.md` · `04-API.md` · `05-TASKS.md`
