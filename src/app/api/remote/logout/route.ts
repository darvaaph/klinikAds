import { cookies } from "next/headers";
import { berhasil } from "@/lib/respons";
import { COOKIE_REMOTE } from "@/lib/session";

export async function POST() {
  (await cookies()).delete(COOKIE_REMOTE);
  return berhasil(null);
}
