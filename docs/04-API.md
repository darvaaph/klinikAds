# API: LayarKlinik (Prototipe)

**Versi:** 1.0
**Tanggal:** 2026-11-11
**Base URL:** `/api` (Next.js Route Handlers)
**Terkait:** `03-DATABASE.md`

---

## 1. Konvensi

- JSON, UTF-8, waktu dalam ISO 8601 (UTC). Klien menampilkan waktu dalam zona Asia/Jakarta.
- **Respons sukses:** `{ "ok": true, "data": ... }`
- **Respons gagal:** `{ "ok": false, "error": { "kode": "ANTRIAN_KOSONG", "pesan": "Tidak ada antrian menunggu di poli ini." } }`
- Validasi input memakai Zod. Input tidak valid → `400 VALIDASI_GAGAL`, dengan `error.detail` per field.

### 1.1 Autentikasi Prototipe
| Cookie | Didapat dari | Isi (JWT HS256) | Dipakai untuk |
|---|---|---|---|
| `lk_remote` | `POST /api/remote/login` | `{ klinikId, slug, exp }` (12 jam) | Semua endpoint `/api/klinik/[slug]/...` yang menulis |
| `lk_admin` | `POST /api/cms/login` | `{ peran: "admin_pusat", exp }` (12 jam) | Semua endpoint `/api/cms/...` |

Cookie: `httpOnly`, `secure`, `sameSite=lax`, `path=/`.
Kalau slug di URL ≠ slug di cookie → `403 BUKAN_KLINIK_ANDA`.

### 1.2 Kode Error
| HTTP | Kode | Arti |
|---|---|---|
| 400 | `VALIDASI_GAGAL` | Input tidak sesuai skema |
| 400 | `IZIN_BPOM_WAJIB` | Konten obat/suplemen tanpa nomor izin edar |
| 400 | `WARNA_KONTRAS_RENDAH` | Warna klinik < 4,5:1 terhadap putih |
| 401 | `BELUM_LOGIN` | Cookie tidak ada atau kedaluwarsa |
| 401 | `PIN_SALAH` | PIN salah |
| 403 | `BUKAN_KLINIK_ANDA` | Cookie untuk klinik lain |
| 404 | `KLINIK_TIDAK_DITEMUKAN` / `POLI_TIDAK_DITEMUKAN` / `TIKET_TIDAK_DITEMUKAN` | – |
| 409 | `ANTRIAN_KOSONG` | Tidak ada tiket menunggu |
| 409 | `BELUM_ADA_PANGGILAN` | Panggil ulang tanpa nomor aktif |
| 429 | `TERKUNCI` | 5× PIN salah, tunggu 5 menit (`error.detail.sampai`) |
| 500 | `KESALAHAN_SERVER` | Error tak terduga (detail hanya di log) |

---

## 2. Endpoint Publik (tanpa login)

### `GET /api/klinik/[slug]/tampilan`
Snapshot untuk TV. Tidak berisi data pribadi.

**200**
```json
{ "ok": true, "data": {
  "klinik": { "id": "uuid", "slug": "palsigunung-2", "nama": "Klinik Pratama Palsigunung 2",
              "warnaUtama": "#0B5563", "logoUrl": "https://...", "modeTampilan": "otomatis",
              "playlistVersi": 7 },
  "poli": [
    { "poliId": "uuid", "nama": "Poli Umum", "kodeHuruf": "A", "ruang": "Ruang 1",
      "kodeDipanggil": "A-013", "dipanggilPrioritas": false,
      "kodeBerikutnya": "A-014", "jumlahMenunggu": 4 }
  ],
  "playlist": [
    { "kontenId": "uuid", "tipe": "video", "kategori": "iklan_sponsor",
      "url": "https://<supabase>/storage/v1/object/public/konten/...", "durasiDetik": 30, "bobot": 2,
      "sponsorNama": "Contoh Bank Sehat (fiktif)" },
    { "kontenId": "uuid", "tipe": "gambar", "kategori": "edukasi", "url": "...", "durasiDetik": 12, "bobot": 1, "sponsorNama": null }
  ],
  "runningText": ["Dokter gigi praktik hari ini pukul 16.00–20.00", "..."],
  "panggilanTerakhir": [ { "id": "uuid", "poliId": "uuid", "kode": "A-013", "jenis": "baru", "dibuatPada": "..." } ],
  "waktuServer": "2026-11-11T07:30:00Z"
}}
```
- `panggilanTerakhir`: maksimal 5 dari 60 detik terakhir. Dipakai TV untuk menyusul panggilan yang terlewat saat reconnect, dengan mencocokkan `id` yang sudah pernah ditampilkan.
- Cache: `Cache-Control: no-store`.

### `GET /api/klinik/[slug]/posisi?kode=A-014`
Untuk halaman QR.

**200**
```json
{ "ok": true, "data": {
  "kode": "A-014", "poli": "Poli Umum", "ruang": "Ruang 1",
  "status": "menunggu",              // menunggu | dipanggil | dilayani | selesai | tidak_hadir
  "kodeDipanggil": "A-011",
  "orangDiDepan": 2
}}
```
- `orangDiDepan` = jumlah tiket `menunggu` di poli yang sama yang akan dipanggil lebih dulu (prioritas, lalu waktu dibuat).
- 404 `TIKET_TIDAK_DITEMUKAN` kalau kode tidak ada hari ini.
- Rate limit sederhana: 30 permintaan/menit per IP (prototipe: opsional).

---

## 3. Remote (petugas)

### `POST /api/remote/login`
```json
{ "slug": "palsigunung-2", "pin": "246810" }
```
**200** → set cookie `lk_remote`, `data: { "klinik": { "nama": "...", "slug": "..." } }`
**401** `PIN_SALAH` · **429** `TERKUNCI`

### `POST /api/remote/logout` → hapus cookie.

### `GET /api/klinik/[slug]/remote`
Status per poli untuk layar remote (butuh `lk_remote`).
```json
{ "ok": true, "data": { "poli": [
  { "poliId": "uuid", "nama": "Poli Umum", "kodeHuruf": "A",
    "kodeDipanggil": "A-013", "tiketDipanggilId": "uuid",
    "menunggu": [ { "tiketId": "uuid", "kode": "A-014", "prioritas": false, "alasanPrioritas": null } ] }
]}}
```
`penjamin` sengaja tidak ikut dikirim. Remote tidak membutuhkannya untuk mengurutkan.

### `POST /api/klinik/[slug]/tiket`
Buat nomor baru → RPC `ambil_nomor`.
```json
{ "poliId": "uuid", "penjamin": "bpjs", "alasanPrioritas": null }
```
- `penjamin` opsional (`bpjs` | `umum` | `asuransi_lain`). `alasanPrioritas` opsional (`lansia` | `ibu_hamil` | `disabilitas` | `darurat`).

**201** `data: { "tiketId": "uuid", "kode": "A-015", "prioritas": false }`

### `POST /api/klinik/[slug]/tiket/[tiketId]/prioritas`
Menandai tiket menunggu sebagai prioritas.
```json
{ "alasanPrioritas": "lansia" }
```
**200** · **409** kalau tiket bukan `menunggu`.

### `POST /api/klinik/[slug]/panggil`
```json
{ "poliId": "uuid" }
```
→ RPC `panggil_berikutnya`. **200** `data: { "panggilanId": "uuid", "kode": "A-014" }` · **409** `ANTRIAN_KOSONG`

### `POST /api/klinik/[slug]/panggil-ulang`
```json
{ "poliId": "uuid" }
```
→ RPC `panggil_ulang`. **200** · **409** `BELUM_ADA_PANGGILAN`

### `PATCH /api/klinik/[slug]/tiket/[tiketId]`
```json
{ "status": "tidak_hadir" }
```
`status`: `tidak_hadir` | `selesai`. → RPC `ubah_status_tiket`. **200**

### `POST /api/klinik/[slug]/reset-demo`
```json
{ "konfirmasi": "RESET" }
```
→ RPC `reset_demo`. **200**. Hanya aktif kalau env `MODE_DEMO=true`.

---

## 4. CMS (admin pusat)

### `POST /api/cms/login` `{ "pin": "..." }` → cookie `lk_admin`. · `POST /api/cms/logout`

### `GET /api/cms/klinik` → daftar klinik.
### `PATCH /api/cms/klinik/[id]`
```json
{ "nama": "...", "warnaUtama": "#1F4E8C", "logoUrl": "...", "modeTampilan": "otomatis", "pinRemoteBaru": "135790" }
```
Semua field opsional. `warnaUtama` dicek kontrasnya → 400 `WARNA_KONTRAS_RENDAH`. `pinRemoteBaru` di-hash bcrypt.

### `GET /api/cms/sponsor` · `POST /api/cms/sponsor` `{ "nama": "...", "kategori": "bank", "kontak": "..." }`

### `POST /api/cms/konten/url-unggah`
Minta signed upload URL ke Storage.
```json
{ "namaFile": "edukasi-cuci-tangan.mp4", "tipe": "video", "ukuranByte": 18400000 }
```
- Video: hanya `video/mp4`, ≤ 50 MB. Gambar: `image/jpeg|png|webp`, ≤ 5 MB.
**200** `data: { "path": "2026/11/uuid.mp4", "signedUrl": "https://...", "token": "..." }`

### `POST /api/cms/konten`
```json
{ "judul": "Edukasi Cuci Tangan", "tipe": "video", "kategori": "edukasi",
  "filePath": "2026/11/uuid.mp4", "teks": null, "durasiDetik": 30,
  "sponsorId": null, "produkObatSuplemen": false, "izinEdarBpom": null }
```
**201** `data: { "kontenId": "uuid" }` · **400** `IZIN_BPOM_WAJIB`
Untuk running text: `"tipe": "teks_berjalan", "teks": "...", "filePath": null` (≤ 140 karakter).

### `GET /api/cms/konten?kategori=&aktif=` · `PATCH /api/cms/konten/[id]` (`judul`, `aktif`, `durasiDetik`) · `DELETE /api/cms/konten/[id]`

### `POST /api/cms/penempatan`
```json
{ "kontenId": "uuid", "klinikIds": ["uuid-a", "uuid-b"], "mulai": "2026-11-12", "selesai": "2026-12-12", "bobot": 2 }
```
Membuat satu baris per klinik. **201** `data: { "penempatanIds": ["..."] }`
Efek: trigger menaikkan `klinik.playlist_versi` → TV yang berlangganan mengambil ulang playlist.

### `GET /api/cms/penempatan?klinikId=` · `PATCH /api/cms/penempatan/[id]` (`mulai`, `selesai`, `bobot`, `persetujuanKlinik`) · `DELETE /api/cms/penempatan/[id]`

### `GET /api/cms/laporan?klinikId=&dari=2026-11-01&sampai=2026-11-30`
Rekap dari `log_tayang` (prototipe: data contoh).
```json
{ "ok": true, "data": {
  "ringkasan": { "totalTayang": 1840, "totalDetik": 41200 },
  "perKonten": [ { "kontenId": "uuid", "judul": "...", "sponsor": "Contoh Bank",
                   "tayang": 420, "detik": 12600 } ],
  "perHari":   [ { "tanggal": "2026-11-01", "tayang": 61 } ]
}}
```

---

## 5. Event Real-time (Supabase, dibaca langsung oleh browser dengan anon key)

| Channel / tabel | Event | Filter | Dipakai oleh | Tindakan klien |
|---|---|---|---|---|
| `panggilan` | INSERT | `klinik_id=eq.<id>` | TV, remote | TV: masukkan ke antrean kartu, lalu ambil ulang snapshot |
| `status_poli` | INSERT/UPDATE | `klinik_id=eq.<id>` | TV, QR, remote | Perbarui angka per poli (atau ambil ulang snapshot) |
| `klinik` | UPDATE | `id=eq.<id>` | TV | Kalau `playlist_versi` atau warna berubah → ambil ulang snapshot |

Contoh langganan di TV:
```ts
supabase.channel(`tv-${klinikId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'panggilan', filter: `klinik_id=eq.${klinikId}` }, onPanggilan)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'status_poli', filter: `klinik_id=eq.${klinikId}` }, muatUlang)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'klinik', filter: `id=eq.${klinikId}` }, muatUlang)
  .subscribe((status) => setStatusRealtime(status));
```
Kalau `status !== 'SUBSCRIBED'` selama > 10 detik → polling `GET /tampilan` setiap 5 detik.

---

## 6. Endpoint Fase MVP (belum dibuat)
- `POST /api/layar/heartbeat` `{ layarId }` setiap 60 detik (F-106)
- `POST /api/layar/log-tayang` `{ layarId, item: [{ kontenId, mulaiPada, durasiDetik }] }` batch (F-103)
- `/api/palsigunung-2dmin/...` untuk peran `admin_klinik` (F-102)
