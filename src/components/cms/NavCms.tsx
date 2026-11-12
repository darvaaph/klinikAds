"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/klien";

const MENU = [
  { href: "/cms/klinik", label: "Klinik" },
  { href: "/cms/konten", label: "Konten" },
  { href: "/cms/penempatan", label: "Penempatan" },
  { href: "/cms/laporan", label: "Laporan" },
  { href: "/cms/mockup-admin-klinik", label: "Mockup Admin Klinik" },
];

export function NavCms() {
  const pathname = usePathname();
  const router = useRouter();

  async function keluar() {
    await api("/api/cms/logout", { method: "POST" });
    router.push("/cms/login");
    router.refresh();
  }

  return (
    <nav
      aria-label="Menu CMS"
      className="flex shrink-0 flex-col gap-1 border-slate-200 bg-white p-3 md:w-60 md:border-r md:p-4"
    >
      <div className="mb-2 px-2 md:mb-6">
        <p className="text-lg font-bold text-slate-900">LayarKlinik</p>
        <p className="text-sm text-slate-600">CMS admin pusat</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {MENU.map((m) => {
          const aktif = pathname === m.href;
          return (
            <li key={m.href} className="shrink-0">
              <Link
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-base whitespace-nowrap ${
                  aktif
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={keluar}
        className="mt-2 rounded-lg px-3 py-2.5 text-left text-base text-slate-700 hover:bg-slate-100 md:mt-auto"
      >
        Keluar
      </button>
    </nav>
  );
}
