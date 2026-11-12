"use client";

import { useEffect, useRef } from "react";

/**
 * Modal built on the native <dialog>: focus trapping, Esc to close and the
 * backdrop come from the browser.
 */
export function Dialog({
  terbuka,
  onTutup,
  judul,
  children,
}: {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
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
      aria-labelledby="judul-dialog"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      {terbuka && (
        <div className="flex flex-col gap-5 p-5">
          <h2 id="judul-dialog" className="text-xl font-bold">
            {judul}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
