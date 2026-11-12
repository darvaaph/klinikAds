"use client";

import { useEffect, useRef } from "react";

/**
 * Right-hand drawer on the native <dialog> (focus trap, Esc, backdrop from the browser).
 * Used in the CMS so add/edit forms don't push the list down the page.
 */
export function PanelSamping({
  terbuka,
  onTutup,
  judul,
  keterangan,
  children,
}: {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (terbuka && !d.open) d.showModal();
    if (!terbuka && d.open) d.close();
  }, [terbuka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => e.target === ref.current && onTutup()}
      aria-labelledby="judul-panel"
      className="mt-0 mr-0 mb-0 ml-auto h-dvh max-h-dvh w-full max-w-xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40"
    >
      {terbuka && (
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h2 id="judul-panel" className="text-xl font-bold">
                {judul}
              </h2>
              {keterangan && <p className="text-sm text-slate-600">{keterangan}</p>}
            </div>
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup panel"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>
          <div className="flex-1 px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
