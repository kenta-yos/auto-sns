import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./index";

/**
 * API ルートで使う認証ガード
 * CVE-2025-29927 対策として Next.js Middleware に加え
 * 各 API ルートでも二重チェックする
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = await verifyToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return auth;
}
