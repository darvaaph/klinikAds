import type { Metadata } from "next";
import { LoginAdmin } from "@/components/cms/LoginAdmin";

export const metadata: Metadata = { title: "Masuk CMS · LayarKlinik" };

export default function HalamanLoginCms() {
  return <LoginAdmin />;
}
