import { NextResponse, type NextRequest } from "next/server";
import { bacaSesiAdmin, COOKIE_ADMIN } from "@/lib/session";

// CMS pages need the admin cookie; API routes check it themselves (wajibAdmin).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesi = await bacaSesiAdmin(req.cookies.get(COOKIE_ADMIN)?.value);

  if (pathname === "/cms/login") {
    return sesi ? NextResponse.redirect(new URL("/cms/konten", req.url)) : NextResponse.next();
  }
  if (!sesi) return NextResponse.redirect(new URL("/cms/login", req.url));
  if (pathname === "/cms" || pathname === "/cms/") {
    return NextResponse.redirect(new URL("/cms/konten", req.url));
  }
  return NextResponse.next();
}

// Node.js runtime: jose's JWE code uses APIs the Edge runtime lacks (we only verify JWS).
export const config = { matcher: ["/cms", "/cms/:path*"], runtime: "nodejs" };
