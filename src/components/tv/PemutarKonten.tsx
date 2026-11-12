"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buatStatusRotasi, pilihBerikutnya, sidikPlaylist } from "@/lib/playlist";
import type { Tampilan } from "@/types/api";

type Item = Tampilan["playlist"][number];
type Putaran = { langkah: number; sekarang: Item | null; berikut: Item | null };

// A playing video that stops reporting progress for this long is treated as stuck.
const BATAS_MACET_MS = 10_000;

/**
 * Rotates images and videos in the 16:9 area (ARCH §2.3). Videos are always muted
 * (ads have no sound; only queue calls do). Images show for `durasiDetik`, videos
 * play to the end. Anything that fails to load, refuses to play, or stalls is
 * skipped. The next item is preloaded in a hidden element.
 */
export function PemutarKonten({
  playlist,
  dijeda = false,
  onTayang,
}: {
  playlist: Tampilan["playlist"];
  /** Called with the item now on screen (for the sponsor strip below the video). */
  onTayang?: (item: Item | null) => void;
  /** While true (call card on screen), videos pause and the image timer stops. */
  dijeda?: boolean;
}) {
  const dijedaRef = useRef(dijeda);
  dijedaRef.current = dijeda;

  const sidik = sidikPlaylist(playlist);
  // Rebuilt only when the playlist's contents change, not on every 2 s poll.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daftar = useMemo(() => playlist, [sidik]);

  // Rotation state lives in refs: React may call render-phase code twice in dev,
  // and picking an item mutates the rotation.
  const rotasi = useRef(buatStatusRotasi());
  const posisi = useRef<Putaran>({ langkah: 0, sekarang: null, berikut: null });
  const [putaran, setPutaran] = useState<Putaran>(posisi.current);

  useEffect(() => {
    rotasi.current = buatStatusRotasi();
    const sekarang = pilihBerikutnya(daftar, rotasi.current, null);
    const berikut = pilihBerikutnya(daftar, rotasi.current, sekarang?.kontenId ?? null);
    posisi.current = { langkah: posisi.current.langkah + 1, sekarang, berikut };
    setPutaran(posisi.current);
  }, [daftar]);

  /** Advance from step `dari`. A second trigger for the same step (ended + error) is ignored. */
  const lanjut = useCallback(
    (dari: number) => {
      const p = posisi.current;
      if (p.langkah !== dari) return;
      const berikut = pilihBerikutnya(daftar, rotasi.current, p.berikut?.kontenId ?? null);
      posisi.current = { langkah: p.langkah + 1, sekarang: p.berikut, berikut };
      setPutaran(posisi.current);
    },
    [daftar],
  );

  const { langkah, sekarang, berikut } = putaran;

  const onTayangRef = useRef(onTayang);
  onTayangRef.current = onTayang;
  useEffect(() => onTayangRef.current?.(sekarang), [sekarang]);

  // Images: advance after durasiDetik. A pause restarts the image's full duration.
  useEffect(() => {
    if (sekarang?.tipe !== "gambar" || dijeda) return;
    const id = setTimeout(() => lanjut(langkah), sekarang.durasiDetik * 1000);
    return () => clearTimeout(id);
  }, [sekarang, langkah, lanjut, dijeda]);

  // Videos: pause/resume around call cards.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (dijeda) video.pause();
    else video.play().catch(() => lanjut(posisi.current.langkah));
  }, [dijeda, lanjut]);

  // Videos: start explicitly (skip if the browser refuses) and watch for stalls.
  useEffect(() => {
    const video = videoRef.current;
    if (sekarang?.tipe !== "video" || !video) return;
    if (!dijedaRef.current) video.play().catch(() => lanjut(langkah));
    let terakhir = Date.now();
    const catat = () => (terakhir = Date.now());
    video.addEventListener("timeupdate", catat);
    const id = setInterval(() => {
      if (!video.paused && Date.now() - terakhir > BATAS_MACET_MS) lanjut(langkah);
    }, 2000);
    return () => {
      video.removeEventListener("timeupdate", catat);
      clearInterval(id);
    };
  }, [sekarang, langkah, lanjut]);

  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[20px] bg-tv-media">
      {!sekarang && (
        <div className="flex h-full items-center justify-center text-[32px] font-semibold text-[#C9D6D8]">
          Belum ada konten untuk ditayangkan
        </div>
      )}

      {sekarang?.tipe === "video" && (
        <video
          key={langkah}
          ref={videoRef}
          src={sekarang.url}
          className="h-full w-full object-contain"
          muted
          playsInline
          preload="auto"
          onEnded={() => lanjut(langkah)}
          onError={() => lanjut(langkah)}
        />
      )}

      {sekarang?.tipe === "gambar" && (
        // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps the TV bundle small
        <img
          key={langkah}
          src={sekarang.url}
          alt=""
          className="h-full w-full object-contain"
          onError={() => lanjut(langkah)}
        />
      )}

      {sekarang?.kategori === "iklan_sponsor" && (
        <div className="absolute top-6 left-6 rounded-lg bg-black/60 px-4 py-1 text-[28px] font-semibold text-white">
          Iklan
        </div>
      )}

      {/* Preload the next item so it starts without a black gap. */}
      {berikut && berikut.kontenId !== sekarang?.kontenId && (
        <div hidden aria-hidden>
          {berikut.tipe === "video" ? (
            <video src={berikut.url} preload="auto" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={berikut.url} alt="" />
          )}
        </div>
      )}
    </div>
  );
}
