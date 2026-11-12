import type { ButtonHTMLAttributes } from "react";

type Varian = "utama" | "kedua" | "bahaya" | "teks";

const GAYA: Record<Varian, string> = {
  utama: "bg-klinik text-white hover:brightness-110 active:brightness-95",
  kedua: "border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100",
  bahaya: "border-2 border-red-700 bg-white text-red-800 hover:bg-red-50 active:bg-red-100",
  teks: "text-slate-700 underline-offset-4 hover:underline",
};

/** Touch-friendly button: at least 56 px tall (PRD F-003), clear disabled state. */
export function Button({
  varian = "utama",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-lg font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-klinik disabled:cursor-not-allowed disabled:opacity-45 ${GAYA[varian]} ${className}`}
      {...props}
    />
  );
}
