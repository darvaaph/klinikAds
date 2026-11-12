import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerTv } from "@/components/tv/PlayerTv";
import { ambilTampilan } from "@/lib/data/tampilan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Layar TV · LayarKlinik" };

export default async function HalamanTv({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const awal = ambilTampilan(slug);
  if (!awal) notFound();
  return <PlayerTv slug={slug} awal={awal} />;
}
