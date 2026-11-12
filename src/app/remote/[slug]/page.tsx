import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LoginPin } from "@/components/remote/LoginPin";
import { RemoteApp } from "@/components/remote/RemoteApp";
import { store } from "@/lib/data/store";
import { bacaSesiRemote, COOKIE_REMOTE } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Remote antrian · LayarKlinik" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function HalamanRemote({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const klinik = store().klinik.find((k) => k.slug === slug);
  if (!klinik) notFound();

  const sesi = await bacaSesiRemote((await cookies()).get(COOKIE_REMOTE)?.value);
  const masuk = sesi?.slug === slug;

  return (
    <div
      className="min-h-dvh bg-slate-50"
      style={{ "--warna-klinik": klinik.warnaUtama } as React.CSSProperties}
    >
      {masuk ? (
        <RemoteApp slug={slug} namaKlinik={klinik.nama} />
      ) : (
        <LoginPin slug={slug} namaKlinik={klinik.nama} />
      )}
    </div>
  );
}
