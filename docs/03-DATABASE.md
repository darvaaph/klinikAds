# Database: LayarKlinik (Prototipe)

**Versi:** 1.0
**Tanggal:** 2026-11-11
**DBMS:** PostgreSQL (Supabase)
**Terkait:** `01-PRD.md`, `02-ARCHITECTURE.md`

---

## 1. Ringkasan Entitas

| Entitas | Fungsi | Publik (anon bisa baca)? |
|---|---|---|
| `klinik` | Identitas klinik: slug, nama, warna, logo | Ya (kolom aman saja, lewat view) |
| `poli` | Poli/loket per klinik: kode huruf, ruang | Ya |
| `tiket_antrian` | Satu nomor antrian per hari | **Tidak** (ada `penjamin`) |
| `penghitung_nomor` | Nomor terakhir per poli per hari | Tidak |
| `status_poli` | Ringkasan aman per poli untuk TV/QR: nomor dipanggil, berikutnya, jumlah menunggu | Ya (dipakai Realtime) |
| `panggilan` | Event panggilan (baru/ulang) untuk memicu kartu di TV | Ya (tanpa data sensitif) |
| `sponsor` | Pengiklan | Tidak |
| `konten` | Video/gambar/running text | Ya (lewat `v_playlist`) |
| `penempatan` | Konten X tayang di klinik Y pada rentang tanggal tertentu | Ya (lewat `v_playlist`) |
| `layar` | Perangkat TV per klinik | Tidak |
| `log_tayang` | Bukti tayang (prototipe: data contoh) | Tidak |
| `percobaan_pin` | Pembatasan percobaan login PIN | Tidak |

## 2. Diagram Relasi

```
klinik 1──* poli 1──* tiket_antrian 1──* panggilan
  │          │  └──1 status_poli
  │          └──* penghitung_nomor (per tanggal)
  ├──* layar 1──* log_tayang *──1 konten
  ├──* penempatan *──1 konten *──0..1 sponsor
  └──* konten (milik klinik, pemilik='klinik')
```

## 3. Tipe Enum

```sql
create type status_tiket as enum ('menunggu','dipanggil','dilayani','selesai','tidak_hadir');
create type alasan_prioritas as enum ('lansia','ibu_hamil','disabilitas','darurat');
create type jenis_penjamin as enum ('bpjs','umum','asuransi_lain');   -- disimpan, TIDAK pernah tampil
create type jenis_panggilan as enum ('baru','ulang');
create type tipe_konten as enum ('video','gambar','teks_berjalan');
create type kategori_konten as enum ('iklan_sponsor','edukasi','promo_klinik','info');
create type pemilik_konten as enum ('pusat','klinik');
create type status_persetujuan as enum ('menunggu','disetujui','ditolak');
create type mode_tampilan as enum ('otomatis','kartu','daftar');
```

## 4. Tabel

```sql
create table klinik (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  nama            text not null,
  warna_utama     text not null default '#0B5563' check (warna_utama ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url        text,
  mode_tampilan   mode_tampilan not null default 'otomatis',
  pin_remote_hash text not null,                         -- bcrypt
  playlist_versi  integer not null default 1,            -- dinaikkan tiap konten/penempatan berubah → TV ambil ulang
  dibuat_pada     timestamptz not null default now()
);

create table poli (
  id          uuid primary key default gen_random_uuid(),
  klinik_id   uuid not null references klinik(id) on delete cascade,
  nama        text not null,                 -- 'Poli Umum'
  kode_huruf  char(1) not null check (kode_huruf ~ '^[A-Z]$'),
  ruang       text not null,                 -- 'Ruang 1' / 'Loket Obat'
  urutan      smallint not null default 0,
  aktif       boolean not null default true,
  unique (klinik_id, kode_huruf)
);

create table tiket_antrian (
  id                uuid primary key default gen_random_uuid(),
  klinik_id         uuid not null references klinik(id) on delete cascade,
  poli_id           uuid not null references poli(id) on delete cascade,
  tanggal           date not null default (now() at time zone 'Asia/Jakarta')::date,
  nomor_urut        integer not null check (nomor_urut > 0),
  kode              text not null,                       -- 'A-014'
  status            status_tiket not null default 'menunggu',
  prioritas         boolean not null default false,
  alasan_prioritas  alasan_prioritas,
  penjamin          jenis_penjamin,                      -- opsional; RAHASIA
  jumlah_panggil    smallint not null default 0,
  dibuat_pada       timestamptz not null default now(),
  dipanggil_pada    timestamptz,
  selesai_pada      timestamptz,
  unique (poli_id, tanggal, nomor_urut),
  check (prioritas = (alasan_prioritas is not null))     -- prioritas wajib beralasan
);
create index idx_tiket_antri on tiket_antrian (poli_id, tanggal, status, prioritas desc, dibuat_pada);

create table penghitung_nomor (
  poli_id   uuid not null references poli(id) on delete cascade,
  tanggal   date not null,
  terakhir  integer not null default 0,
  primary key (poli_id, tanggal)
);

create table status_poli (
  poli_id          uuid primary key references poli(id) on delete cascade,
  klinik_id        uuid not null references klinik(id) on delete cascade,
  kode_dipanggil   text,             -- 'A-013' atau null
  dipanggil_prioritas boolean not null default false,
  kode_berikutnya  text,
  jumlah_menunggu  integer not null default 0,
  diperbarui_pada  timestamptz not null default now()
);

create table panggilan (
  id          uuid primary key default gen_random_uuid(),
  klinik_id   uuid not null references klinik(id) on delete cascade,
  poli_id     uuid not null references poli(id) on delete cascade,
  tiket_id    uuid not null references tiket_antrian(id) on delete cascade,
  kode        text not null,         -- disalin supaya TV tidak perlu baca tiket
  jenis       jenis_panggilan not null default 'baru',
  dibuat_pada timestamptz not null default now()
);
create index idx_panggilan_klinik on panggilan (klinik_id, dibuat_pada desc);

create table sponsor (
  id        uuid primary key default gen_random_uuid(),
  nama      text not null,
  kategori  text not null,            -- 'bank','farmasi_otc','fmcg','penunjang_medis'
  kontak    text,
  logo_url  text                      -- opsional, tampil di strip "Dipersembahkan oleh" di TV
);

create table konten (
  id                uuid primary key default gen_random_uuid(),
  judul             text not null,
  tipe              tipe_konten not null,
  kategori          kategori_konten not null,
  pemilik           pemilik_konten not null default 'pusat',
  klinik_pemilik_id uuid references klinik(id) on delete cascade,   -- wajib jika pemilik='klinik'
  sponsor_id        uuid references sponsor(id),
  file_path         text,                 -- path di bucket 'konten' (video/gambar)
  teks              text,                 -- untuk teks_berjalan (≤ 140 karakter)
  durasi_detik      smallint not null default 10 check (durasi_detik between 5 and 120),
  produk_obat_suplemen boolean not null default false,
  izin_edar_bpom    text,
  aktif             boolean not null default true,
  dibuat_pada       timestamptz not null default now(),
  check (pemilik <> 'klinik' or klinik_pemilik_id is not null),
  check (not produk_obat_suplemen or izin_edar_bpom is not null),
  check ((tipe = 'teks_berjalan') = (teks is not null)),
  check (tipe = 'teks_berjalan' or file_path is not null)
);

create table penempatan (
  id                 uuid primary key default gen_random_uuid(),
  konten_id          uuid not null references konten(id) on delete cascade,
  klinik_id          uuid not null references klinik(id) on delete cascade,
  mulai              date not null,
  selesai            date not null check (selesai >= mulai),
  bobot              smallint not null default 1 check (bobot between 1 and 10),
  persetujuan_klinik status_persetujuan not null default 'disetujui',  -- prototipe: auto-setuju
  catatan            text,
  unique (konten_id, klinik_id, mulai)
);

create table layar (
  id                    uuid primary key default gen_random_uuid(),
  klinik_id             uuid not null references klinik(id) on delete cascade,
  nama                  text not null,      -- 'TV Ruang Tunggu Utama'
  terakhir_online_pada  timestamptz
);

create table log_tayang (
  id            bigint generated always as identity primary key,
  layar_id      uuid references layar(id) on delete set null,
  klinik_id     uuid not null references klinik(id) on delete cascade,
  konten_id     uuid not null references konten(id) on delete cascade,
  mulai_pada    timestamptz not null,
  durasi_detik  smallint not null
);
create index idx_log_tayang_rekap on log_tayang (klinik_id, konten_id, mulai_pada);

create table percobaan_pin (
  kunci         text primary key,          -- 'remote:<slug>:<ip>' atau 'admin:<ip>'
  gagal         smallint not null default 0,
  terkunci_sampai timestamptz
);
```

## 5. Fungsi (RPC) — Inti Antrian

Semua fungsi dibuat `security definer`, hanya dieksekusi oleh service role (`revoke execute ... from anon, authenticated`).

```sql
-- Hitung ulang ringkasan aman satu poli
create or replace function segarkan_status_poli(p_poli_id uuid) returns void
language plpgsql security definer as $$
declare v_klinik uuid; v_hari date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select klinik_id into v_klinik from poli where id = p_poli_id;
  insert into status_poli (poli_id, klinik_id, kode_dipanggil, dipanggil_prioritas,
                           kode_berikutnya, jumlah_menunggu, diperbarui_pada)
  select p_poli_id, v_klinik,
    (select kode from tiket_antrian where poli_id=p_poli_id and tanggal=v_hari and status='dipanggil'
       order by dipanggil_pada desc limit 1),
    coalesce((select prioritas from tiket_antrian where poli_id=p_poli_id and tanggal=v_hari and status='dipanggil'
       order by dipanggil_pada desc limit 1), false),
    (select kode from tiket_antrian where poli_id=p_poli_id and tanggal=v_hari and status='menunggu'
       order by prioritas desc, dibuat_pada asc limit 1),
    (select count(*) from tiket_antrian where poli_id=p_poli_id and tanggal=v_hari and status='menunggu'),
    now()
  on conflict (poli_id) do update set
    kode_dipanggil=excluded.kode_dipanggil, dipanggil_prioritas=excluded.dipanggil_prioritas,
    kode_berikutnya=excluded.kode_berikutnya, jumlah_menunggu=excluded.jumlah_menunggu,
    diperbarui_pada=excluded.diperbarui_pada;
end $$;

-- Ambil nomor baru (aman untuk panggilan bersamaan)
create or replace function ambil_nomor(p_poli_id uuid, p_penjamin jenis_penjamin default null,
                                       p_alasan alasan_prioritas default null)
returns tiket_antrian language plpgsql security definer as $$
declare v_hari date := (now() at time zone 'Asia/Jakarta')::date;
        v_no int; v_poli poli; v_tiket tiket_antrian;
begin
  select * into v_poli from poli where id = p_poli_id and aktif;
  if not found then raise exception 'POLI_TIDAK_DITEMUKAN'; end if;

  insert into penghitung_nomor (poli_id, tanggal, terakhir) values (p_poli_id, v_hari, 1)
  on conflict (poli_id, tanggal) do update set terakhir = penghitung_nomor.terakhir + 1
  returning terakhir into v_no;                      -- baris terkunci → nomor unik

  insert into tiket_antrian (klinik_id, poli_id, tanggal, nomor_urut, kode, prioritas, alasan_prioritas, penjamin)
  values (v_poli.klinik_id, p_poli_id, v_hari, v_no,
          v_poli.kode_huruf || '-' || lpad(v_no::text, 3, '0'),
          p_alasan is not null, p_alasan, p_penjamin)
  returning * into v_tiket;

  perform segarkan_status_poli(p_poli_id);
  return v_tiket;
end $$;

-- Panggil berikutnya
create or replace function panggil_berikutnya(p_poli_id uuid)
returns panggilan language plpgsql security definer as $$
declare v_hari date := (now() at time zone 'Asia/Jakarta')::date;
        v_tiket tiket_antrian; v_p panggilan;
begin
  perform 1 from poli where id = p_poli_id for update;            -- kunci per poli

  update tiket_antrian set status='dilayani'
   where poli_id=p_poli_id and tanggal=v_hari and status='dipanggil';

  select * into v_tiket from tiket_antrian
   where poli_id=p_poli_id and tanggal=v_hari and status='menunggu'
   order by prioritas desc, dibuat_pada asc
   limit 1 for update skip locked;
  if not found then raise exception 'ANTRIAN_KOSONG'; end if;

  update tiket_antrian set status='dipanggil', dipanggil_pada=now(), jumlah_panggil=jumlah_panggil+1
   where id = v_tiket.id;

  insert into panggilan (klinik_id, poli_id, tiket_id, kode, jenis)
  values (v_tiket.klinik_id, p_poli_id, v_tiket.id, v_tiket.kode, 'baru') returning * into v_p;

  perform segarkan_status_poli(p_poli_id);
  return v_p;
end $$;

-- Panggil ulang nomor yang sedang dipanggil
create or replace function panggil_ulang(p_poli_id uuid)
returns panggilan language plpgsql security definer as $$
declare v_hari date := (now() at time zone 'Asia/Jakarta')::date;
        v_tiket tiket_antrian; v_p panggilan;
begin
  select * into v_tiket from tiket_antrian
   where poli_id=p_poli_id and tanggal=v_hari and status='dipanggil'
   order by dipanggil_pada desc limit 1 for update;
  if not found then raise exception 'BELUM_ADA_PANGGILAN'; end if;
  update tiket_antrian set jumlah_panggil=jumlah_panggil+1 where id=v_tiket.id;
  insert into panggilan (klinik_id, poli_id, tiket_id, kode, jenis)
  values (v_tiket.klinik_id, p_poli_id, v_tiket.id, v_tiket.kode, 'ulang') returning * into v_p;
  return v_p;
end $$;

-- Tandai tidak hadir / selesai
create or replace function ubah_status_tiket(p_tiket_id uuid, p_status status_tiket)
returns void language plpgsql security definer as $$
declare v_poli uuid;
begin
  if p_status not in ('tidak_hadir','selesai') then raise exception 'STATUS_TIDAK_VALID'; end if;
  update tiket_antrian set status=p_status, selesai_pada=now() where id=p_tiket_id returning poli_id into v_poli;
  if v_poli is null then raise exception 'TIKET_TIDAK_DITEMUKAN'; end if;
  perform segarkan_status_poli(v_poli);
end $$;

-- Jadikan tiket menunggu sebagai prioritas (alasan wajib)
create or replace function set_prioritas(p_tiket_id uuid, p_alasan alasan_prioritas)
returns void language plpgsql security definer as $$
declare v_poli uuid;
begin
  update tiket_antrian set prioritas=true, alasan_prioritas=p_alasan
   where id=p_tiket_id and status='menunggu' returning poli_id into v_poli;
  if v_poli is null then raise exception 'TIKET_TIDAK_MENUNGGU'; end if;
  perform segarkan_status_poli(v_poli);
end $$;

-- Reset demo: hapus tiket hari ini di satu klinik
create or replace function reset_demo(p_klinik_id uuid) returns void
language plpgsql security definer as $$
declare v_hari date := (now() at time zone 'Asia/Jakarta')::date; r record;
begin
  delete from tiket_antrian where klinik_id=p_klinik_id and tanggal=v_hari;
  delete from penghitung_nomor where tanggal=v_hari and poli_id in (select id from poli where klinik_id=p_klinik_id);
  for r in select id from poli where klinik_id=p_klinik_id loop perform segarkan_status_poli(r.id); end loop;
end $$;

-- Naikkan versi playlist saat penempatan berubah
create or replace function versi_dari_penempatan() returns trigger
language plpgsql security definer as $$
begin
  update klinik set playlist_versi = playlist_versi + 1
   where id in (coalesce(new.klinik_id, old.klinik_id), coalesce(old.klinik_id, new.klinik_id));
  return null;
end $$;
create trigger trg_penempatan_versi after insert or update or delete on penempatan
  for each row execute function versi_dari_penempatan();

-- Naikkan versi playlist semua klinik yang menayangkan konten yang berubah
create or replace function versi_dari_konten() returns trigger
language plpgsql security definer as $$
begin
  update klinik set playlist_versi = playlist_versi + 1
   where id in (select klinik_id from penempatan where konten_id = coalesce(new.id, old.id));
  return null;
end $$;
create trigger trg_konten_versi after update or delete on konten
  for each row execute function versi_dari_konten();
```

## 6. View Publik

```sql
create view v_tampilan_poli as
select p.id as poli_id, p.klinik_id, p.nama, p.kode_huruf, p.ruang, p.urutan,
       s.kode_dipanggil, s.dipanggil_prioritas, s.kode_berikutnya, s.jumlah_menunggu, s.diperbarui_pada
from poli p left join status_poli s on s.poli_id = p.id
where p.aktif;

create view v_playlist as
select pe.klinik_id, k.id as konten_id, k.judul, k.tipe, k.kategori, k.file_path, k.teks,
       k.durasi_detik, pe.bobot
from penempatan pe join konten k on k.id = pe.konten_id
where k.aktif
  and pe.persetujuan_klinik = 'disetujui'
  and (now() at time zone 'Asia/Jakarta')::date between pe.mulai and pe.selesai;
```

## 7. Row Level Security

```sql
alter table klinik enable row level security;          -- dst untuk SEMUA tabel
-- Anon hanya boleh SELECT tabel/view berikut:
create policy anon_baca_status on status_poli for select to anon using (true);
create policy anon_baca_panggilan on panggilan for select to anon using (true);
create policy anon_baca_poli on poli for select to anon using (aktif);
-- klinik: buat view v_klinik_publik (id, slug, nama, warna_utama, logo_url, mode_tampilan, playlist_versi)
--         TANPA pin_remote_hash, lalu grant select ke anon pada view itu saja.
-- tiket_antrian, penghitung_nomor, sponsor, layar, log_tayang, percobaan_pin: TIDAK ada policy anon.
```

**Realtime:** tambahkan ke publikasi `supabase_realtime` hanya `status_poli`, `panggilan`, dan `klinik`. TV berlangganan dengan filter `klinik_id=eq.<id>` (untuk `klinik`: `id=eq.<id>`, membaca `playlist_versi`).

## 8. Data Contoh (`seed.sql`)
- **Klinik Pratama Palsigunung 2 (KPRJ Palsigunung 2)** (`palsigunung-2`, warna #0B5563): klinik pilot utama. Poli contoh: Umum (A, Ruang 1), Gigi (B, Ruang 2), Farmasi (C, Loket Obat). _Daftar poli, ruang, warna, dan logo asli: TBD sesuai wawancara, dan logo dipakai hanya dengan izin klinik._
- **Klinik Pratama Harapan** (`klinik-b`, warna #1F4E8C): 5 poli: Umum A, Gigi B, Farmasi C, KIA D, Laboratorium E. Menguji mode daftar.
- **Klinik Medika Bunda** (`klinik-c`, warna #2E6B3F): Umum A, KIA D.
- PIN remote demo: `246810` (ganti sebelum pitching).
- Konten: 3 video edukasi (bebas lisensi/milik sendiri), 2 gambar promo klinik, 1 gambar "QR pantau antrian", 2 gambar placeholder sponsor fiktif (jelas berlabel "Contoh"), 3 running text per klinik.
- `log_tayang`: ±2.000 baris acak 14 hari terakhir untuk halaman laporan.

> Jangan memakai logo atau merek sponsor sungguhan (bank, farmasi) di data contoh sebelum ada izin dari pemiliknya.

## 9. Catatan Migrasi ke Fase MVP
- Tambah `profil_pengguna (user_id → auth.users, peran, klinik_id)` dan ganti policy menjadi berbasis `auth.uid()`.
- `log_tayang` diisi oleh player sungguhan (batch tiap 60 detik).
- Kolom `slot` pada `penempatan` (`sponsor`/`klinik`) + rasio per klinik (F-104).
- Partisi atau arsip `log_tayang` per bulan kalau baris > 5 juta.
