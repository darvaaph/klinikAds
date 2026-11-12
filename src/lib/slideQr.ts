import "server-only";
import QRCode from "qrcode";

/** Escape text for use inside SVG markup. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * 1920×1080 "Pantau antrian dari HP" slide with a QR code pointing at the public
 * /q/<slug> page (T-018). Built per request so the QR always matches the address
 * the TV is using (laptop IP on site, Vercel URL later). Server-only.
 */
export async function buatSlideQr({
  namaKlinik,
  warna,
  url,
}: {
  namaKlinik: string;
  warna: string;
  url: string;
}): Promise<string> {
  const qr = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#13262B", light: "#FFFFFF" },
  });
  // Nest the QR's own <svg> at a fixed position and size inside the slide.
  const qrDiPosisi = qr.replace("<svg ", '<svg x="1250" y="250" width="500" height="500" ');
  const font = "Segoe UI, Roboto, Arial, sans-serif";
  const alamat = url.replace(/^https?:\/\//, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#FFFFFF"/>
  <rect x="1120" width="800" height="1080" fill="${esc(warna)}"/>
  <text font-family="${font}" font-weight="700" fill="${esc(warna)}">
    <tspan x="140" y="300" font-size="112">Pantau antrian</tspan>
    <tspan x="140" y="430" font-size="112">dari HP</tspan>
  </text>
  <text font-family="${font}" font-size="56" fill="#13262B">
    <tspan x="140" y="590">1. Buka kamera HP</tspan>
    <tspan x="140" y="680">2. Arahkan ke kode QR</tspan>
    <tspan x="140" y="770">3. Ketik nomor antrian Anda</tspan>
  </text>
  <text x="140" y="900" font-family="${font}" font-size="44" fill="#4A5F65">Tanpa aplikasi, tanpa data pribadi.</text>
  <rect x="1210" y="210" width="580" height="580" rx="36" fill="#FFFFFF"/>
  ${qrDiPosisi}
  <text x="1500" y="880" text-anchor="middle" font-family="${font}" font-size="44" font-weight="600" fill="#FFFFFF">${esc(namaKlinik)}</text>
  <text x="1500" y="950" text-anchor="middle" font-family="${font}" font-size="34" fill="#FFFFFF" opacity="0.9">${esc(alamat)}</text>
</svg>`;
}
