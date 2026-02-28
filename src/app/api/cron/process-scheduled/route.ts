import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { publishPost } from "@/lib/platforms/publish";

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const now = new Date();

  // scheduled_at <= now() かつ status = "scheduled" の投稿を取得
  const scheduledPosts = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "scheduled"),
        lte(posts.scheduledAt, now)
      )
    );

  const results = [];

  for (const post of scheduledPosts) {
    try {
      const result = await publishPost(post.id);
      results.push({ postId: post.id, success: true, result });
    } catch (e) {
      results.push({
        postId: post.id,
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    processed: scheduledPosts.length,
    results,
    processedAt: now.toISOString(),
  });
}
