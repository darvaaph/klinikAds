import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PantauAntrian } from "@/components/pantau/PantauAntrian";
import { store } from "@/lib/data/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pantau antrian · LayarKlinik" };

export default async function HalamanPantau({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const klinik = store().klinik.find((k) => k.slug === slug);
  if (!klinik) notFound();

  return (
    <div
      className="min-h-dvh bg-slate-50"
      style={{ "--warna-klinik": klinik.warnaUtama } as React.CSSProperties}
    >
      <PantauAntrian slug={slug} namaKlinik={klinik.nama} />
    </div>
  );
}
