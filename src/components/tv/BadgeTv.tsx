/** Yellow marker badge (#F2B134), used only for "DIPANGGIL"/"Prioritas" (ARCH §4.5). */
export function BadgeTv({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-tv-penanda px-3.5 py-0.5 text-[28px] leading-tight font-bold text-[#1D1606]">
      {children}
    </span>
  );
}
