import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  body: z.string().min(1).optional(),
  platforms: z.array(z.enum(["x", "bluesky"])).min(1).optional(),
  scheduledAt: z.string().nullable().optional(),
  status: z.enum(["draft", "scheduled"]).optional(),
});

// GET: 個別投稿取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, auth.userId)))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PATCH: 投稿更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, auth.userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }

  if (existing.status !== "draft" && existing.status !== "scheduled") {
    return NextResponse.json(
      { error: "この投稿は編集できません" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.body !== undefined) updates.body = parsed.data.body;
  if (parsed.data.platforms !== undefined)
    updates.platforms = parsed.data.platforms;
  if (parsed.data.scheduledAt !== undefined)
    updates.scheduledAt = parsed.data.scheduledAt
      ? new Date(parsed.data.scheduledAt)
      : null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [updated] = await db
    .update(posts)
    .set(updates)
    .where(eq(posts.id, id))
    .returning();

  return NextResponse.json(updated);
}

// DELETE: 投稿削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, auth.userId)));

  return NextResponse.json({ success: true });
}
