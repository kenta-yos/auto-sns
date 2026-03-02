import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公開パス
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const auth = await verifyToken(token);
  if (!auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
