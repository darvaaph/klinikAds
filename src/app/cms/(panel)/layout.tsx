import type { Metadata } from "next";
import { NavCms } from "@/components/cms/NavCms";

export const metadata: Metadata = { title: "CMS · LayarKlinik" };

// Auth is enforced in src/middleware.ts before these pages render.
export default function LayoutCms({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 md:flex-row">
      <NavCms />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        {/* One centred container for every CMS page, so headers line up across pages. */}
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
