import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, postPlatformResults } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  body: z.string().min(1, "投稿内容を入力してください"),
  platforms: z.array(z.enum(["x", "bluesky"])).min(1, "プラットフォームを選択してください"),
  scheduledAt: z.string().nullable().optional(),
});

// GET: 投稿一覧
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, auth.userId))
    .orderBy(desc(posts.createdAt));

  // 各投稿のプラットフォーム結果を取得
  const postsWithResults = await Promise.all(
    allPosts.map(async (post) => {
      const results = await db
        .select()
        .from(postPlatformResults)
        .where(eq(postPlatformResults.postId, post.id));
      return { ...post, results };
    })
  );

  return NextResponse.json(postsWithResults);
}

// POST: 投稿作成
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { body: postBody, platforms, scheduledAt } = parsed.data;

  const status = scheduledAt ? "scheduled" : "draft";

  const [post] = await db
    .insert(posts)
    .values({
      userId: auth.userId,
      body: postBody,
      platforms,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    })
    .returning();

  return NextResponse.json(post, { status: 201 });
}
