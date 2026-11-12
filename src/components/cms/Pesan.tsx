/** Inline success/error message for CMS forms. */
export function Pesan({ jenis, children }: { jenis: "ok" | "galat"; children: React.ReactNode }) {
  return (
    <p
      role={jenis === "galat" ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-base ${
        jenis === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
      }`}
    >
      {children}
    </p>
  );
}

export const kelasInput =
  "min-h-11 w-full rounded-lg border-2 border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-slate-900 focus:outline-none";
export const kelasLabel = "text-sm font-semibold text-slate-800";
