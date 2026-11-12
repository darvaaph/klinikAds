// WCAG 2.x contrast ratio, used to validate a klinik's warnaUtama against white text.

export const KONTRAS_MINIMUM = 4.5;

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Warna tidak valid: ${hex}`);
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colors, from 1 to 21. */
export function kontras(warnaA: string, warnaB: string): number {
  const [terang, gelap] = [luminance(warnaA), luminance(warnaB)].sort((a, b) => b - a);
  return (terang + 0.05) / (gelap + 0.05);
}

export function kontrasCukup(warna: string, latar = "#FFFFFF"): boolean {
  return kontras(warna, latar) >= KONTRAS_MINIMUM;
}
