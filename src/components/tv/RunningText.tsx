/** Footer ticker. Text is rendered as plain text, never HTML (ARCH §7). */
export function RunningText({ teks }: { teks: string[] }) {
  return (
    <footer className="flex h-16 shrink-0 items-center overflow-hidden rounded-2xl border-2 border-tv-garis bg-tv-kartu">
      <div className="flex h-full shrink-0 items-center bg-klinik px-6 text-[28px] font-bold text-white">
        INFO
      </div>
      <div className="flex-1 overflow-hidden pl-8">
        {teks.length > 0 && (
          <div className="tv-ticker flex w-max gap-[120px] text-[32px] whitespace-nowrap text-tv-teks">
            {/* Two identical halves: the animation shifts by -50% and loops. */}
            {[...teks, ...teks].map((t, i) => (
              <span key={i} aria-hidden={i >= teks.length}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
