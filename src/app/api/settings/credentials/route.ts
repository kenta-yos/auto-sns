import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformCredentials } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { encrypt, decrypt } from "@/lib/encryption";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { testXConnection, type XCredentials } from "@/lib/platforms/x";
import {
  testBlueskyConnection,
  type BlueskyCredentials,
} from "@/lib/platforms/bluesky";

const saveSchema = z.object({
  platform: z.enum(["x", "bluesky"]),
  credentials: z.record(z.string(), z.string()),
});

const testSchema = z.object({
  platform: z.enum(["x", "bluesky"]),
  credentials: z.record(z.string(), z.string()),
});

// GET: 保存済みのプラットフォーム一覧（認証情報自体は返さない）
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const creds = await db
    .select({
      platform: platformCredentials.platform,
      updatedAt: platformCredentials.updatedAt,
    })
    .from(platformCredentials)
    .where(eq(platformCredentials.userId, auth.userId));

  // 各プラットフォームのマスク情報を返す
  const result: Record<string, { configured: boolean; updatedAt: Date | null }> = {
    x: { configured: false, updatedAt: null },
    bluesky: { configured: false, updatedAt: null },
  };

  for (const c of creds) {
    result[c.platform] = { configured: true, updatedAt: c.updatedAt };
  }

  return NextResponse.json(result);
}

// POST: 認証情報を保存
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { platform, credentials } = parsed.data;
  const encrypted = encrypt(JSON.stringify(credentials));

  // upsert
  const existing = await db
    .select()
    .from(platformCredentials)
    .where(
      and(
        eq(platformCredentials.userId, auth.userId),
        eq(platformCredentials.platform, platform)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(platformCredentials)
      .set({ encrypted, updatedAt: new Date() })
      .where(eq(platformCredentials.id, existing[0].id));
  } else {
    await db.insert(platformCredentials).values({
      userId: auth.userId,
      platform,
      encrypted,
    });
  }

  return NextResponse.json({ success: true });
}

// PUT: 接続テスト
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { platform, credentials } = parsed.data;

  if (platform === "x") {
    const result = await testXConnection(credentials as unknown as XCredentials);
    return NextResponse.json(result);
  } else {
    const result = await testBlueskyConnection(
      credentials as unknown as BlueskyCredentials
    );
    return NextResponse.json(result);
  }
}

// DELETE: 認証情報を削除
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { platform } = await req.json();
  if (!["x", "bluesky"].includes(platform)) {
    return NextResponse.json({ error: "不正なプラットフォーム" }, { status: 400 });
  }

  // 復号してユーザー名を取得したい場合のために残す
  await db
    .delete(platformCredentials)
    .where(
      and(
        eq(platformCredentials.userId, auth.userId),
        eq(platformCredentials.platform, platform)
      )
    );

  return NextResponse.json({ success: true });
}
