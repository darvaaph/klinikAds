"use client";

import { useEffect, useState } from "react";

export const KANVAS_LEBAR = 1920;
export const KANVAS_TINGGI = 1080;

/**
 * Renders children on a fixed 1920×1080 canvas scaled to fit the window,
 * with black letterbox bars on the leftover sides (ARCH §2.3).
 */
export function ScaleToFit({ children }: { children: React.ReactNode }) {
  const [skala, setSkala] = useState<number | null>(null);

  useEffect(() => {
    const hitung = () =>
      setSkala(Math.min(window.innerWidth / KANVAS_LEBAR, window.innerHeight / KANVAS_TINGGI));
    hitung();
    window.addEventListener("resize", hitung);
    return () => window.removeEventListener("resize", hitung);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: KANVAS_LEBAR,
          height: KANVAS_TINGGI,
          transform: `translate(-50%, -50%) scale(${skala ?? 1})`,
          // Hidden until measured, so the TV never flashes an unscaled frame.
          visibility: skala === null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}
