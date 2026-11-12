# Uji Pertama di TV Sungguhan (T-014)

**Tanggal uji:** _diisi_ · **Penguji:** _diisi_ · **Lokasi:** _diisi_

Karena Supabase dan Vercel belum dipasang, TV membuka player dari laptop lewat Wi-Fi yang sama.

## Persiapan
1. Laptop dan TV tersambung ke Wi-Fi/hotspot yang **sama**.
2. Di laptop jalankan `pnpm dev`. Di terminal muncul baris **Network**, misalnya `http://192.168.1.23:3000`.
3. Kalau TV tidak bisa membuka alamat itu, izinkan Node.js di Windows Firewall (jaringan Private).
4. Di TV pasang **Fully Kiosk Browser** (atau Chrome). Start URL: `http://<IP-laptop>:3000/tv/palsigunung-2`.
5. Matikan overscan di pengaturan gambar TV: pilih **Screen Fit / Just Scan / 16:9 Original**.
6. Tekan **OK** di remote TV pada layar "Tekan OK untuk mulai".
7. Dari HP buka `http://<IP-laptop>:3000/remote/palsigunung-2`, PIN demo ada di `docs/03-DATABASE.md` §8.

## Data perangkat
| Item | Hasil |
|---|---|
| Merek / model TV | |
| Versi Android TV | |
| Browser + versi Chromium (buka `chrome://version` atau info Fully Kiosk) | |
| Resolusi yang dilaporkan browser (`?debug=1` tersedia setelah T-012) | |

## Checklist
| # | Uji | Hasil (✅/❌) | Catatan |
|---|---|---|---|
| 1 | Player tampil penuh, tidak ada bagian terpotong di tepi layar | | |
| 2 | Teks terkecil (tanggal, running text) terbaca dari jarak 3 m | | |
| 3 | Tombol "Tekan OK untuk mulai" bisa ditekan dengan tombol OK remote TV | | |
| 4 | Panggil dari HP → angka di TV berubah ≤ 2 detik | | |
| 5 | Kartu panggilan muncul ±6 detik, video berhenti lalu lanjut | | |
| 6 | Chime terdengar | | |
| 7 | Suara TTS bahasa Indonesia tersedia dan terdengar (kalau tidak, hanya chime) | | |
| 8 | Video dan gambar bergiliran lancar (tidak patah-patah) | | |
| 9 | Running text bergerak halus | | |
| 10 | Pemakaian memori setelah 1 jam (Fully Kiosk → Device Info, atau Developer options) | | |

## Masalah yang ditemukan
_Kalau ada yang gagal, tulis di sini lalu buat task perbaikan **sebelum** lanjut ke Fase 3._
