"use client";

import { useState } from "react";

/**
 * File picker that replaces the browser's "Choose File / No file chosen" control:
 * a drop zone with a clear button, the chosen file's name, and the format rules.
 */
export function PilihFile({
  id,
  accept,
  aturan,
  namaFile,
  required,
  disabled,
  onPilih,
}: {
  id: string;
  accept: string;
  /** Format and size rules, e.g. "MP4 H.264, maks 50 MB". */
  aturan: string;
  namaFile: string | null;
  required?: boolean;
  disabled?: boolean;
  onPilih: (file: File | undefined) => void;
}) {
  const [diseret, setDiseret] = useState(false);

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setDiseret(true);
      }}
      onDragLeave={() => setDiseret(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDiseret(false);
        if (!disabled) onPilih(e.dataTransfer.files[0]);
      }}
      className={`flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-slate-900 ${
        diseret
          ? "border-slate-900 bg-slate-100"
          : "border-slate-300 bg-slate-50 hover:bg-slate-100"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="inline-flex min-h-10 items-center rounded-lg border-2 border-slate-300 bg-white px-4 text-base font-semibold text-slate-900">
        {namaFile ? "Ganti file" : "Pilih file"}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block truncate font-medium text-slate-900">
          {namaFile ?? "atau seret file ke sini"}
        </span>
        <span className="block text-slate-600">{aturan}</span>
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        required={required && !namaFile}
        disabled={disabled}
        onChange={(e) => onPilih(e.target.files?.[0])}
        className="sr-only"
      />
    </label>
  );
}
