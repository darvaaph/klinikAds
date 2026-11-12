import type { Tampilan } from "@/types/api";

type Item = Tampilan["playlist"][number];

const LABEL_KATEGORI: Record<Item["kategori"], string> = {
  iklan_sponsor: "Dipersembahkan oleh",
  edukasi: "Edukasi kesehatan",
  promo_klinik: "Promo klinik",
  info: "Informasi",
};

/**
 * Strip under the 16:9 area (design A, PRD F-001): "Dipersembahkan oleh <sponsor>"
 * while a sponsor ad plays, otherwise what kind of content this is and from which klinik.
 */
export function StripSponsor({ item, namaKlinik }: { item: Item | null; namaKlinik: string }) {
  if (!item) return <div className="flex-1" />;

  const sponsor = item.kategori === "iklan_sponsor";
  return (
    <div className="flex min-h-0 flex-1 items-center gap-4 rounded-[20px] bg-tv-kartu px-8">
      <span className="shrink-0 text-[28px] text-tv-teks-2">{LABEL_KATEGORI[item.kategori]}</span>
      <span
        className={`truncate text-[32px] font-bold ${sponsor ? "text-tv-teks" : "text-[var(--warna-klinik)]"}`}
      >
        {sponsor ? (item.sponsorNama ?? "Mitra sponsor") : namaKlinik}
      </span>
    </div>
  );
}
