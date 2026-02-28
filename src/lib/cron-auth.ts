import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron Job の CRON_SECRET を検証
 */
export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // OK
}
