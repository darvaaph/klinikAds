import { cookies } from "next/headers";
import { berhasil } from "@/lib/respons";
import { COOKIE_ADMIN } from "@/lib/session";

export async function POST() {
  (await cookies()).delete(COOKIE_ADMIN);
  return berhasil(null);
}
