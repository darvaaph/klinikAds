"use client";

import { useEffect, useRef } from "react";

// Keys a TV remote's OK/center button can send, depending on the device.
const TOMBOL_OK = new Set(["Enter", "NumpadEnter", " ", "Select", "MediaPlayPause"]);

/**
 * "Tekan OK untuk mulai" (PRD F-002). Browsers only allow sound after a user
 * gesture. Any OK press starts the player, even if the button lost focus; the
 * button is also focused (with retries, since the canvas is hidden until scaled).
 */
export function LayarMulai({ onMulai, namaKlinik }: { onMulai: () => void; namaKlinik: string }) {
  const tombol = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fokus = () => {
      if (document.activeElement !== tombol.current) tombol.current?.focus();
    };
    const id = setInterval(fokus, 300);
    fokus();

    const tekan = (e: KeyboardEvent) => {
      if (!TOMBOL_OK.has(e.key)) return;
      e.preventDefault();
      onMulai();
    };
    window.addEventListener("keydown", tekan);
    return () => {
      clearInterval(id);
      window.removeEventListener("keydown", tekan);
    };
  }, [onMulai]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-10 bg-[#0E1A1C] text-white">
      <div className="text-[40px] font-bold">{namaKlinik}</div>
      <button
        ref={tombol}
        type="button"
        onClick={onMulai}
        className="rounded-[28px] bg-klinik px-20 py-10 text-[64px] font-bold text-white ring-tv-penanda outline-none focus:ring-[10px]"
      >
        Tekan OK untuk mulai
      </button>
      <div className="max-w-[1200px] text-center text-[32px] text-[#C9D6D8]">
        Tombol ini mengaktifkan suara panggilan antrian. Cukup sekali setiap TV dinyalakan.
      </div>
    </div>
  );
}
