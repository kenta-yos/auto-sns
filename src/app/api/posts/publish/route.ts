import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { eq, and } from "drizzle-orm";
import { publishPost } from "@/lib/platforms/publish";

// POST: 即時投稿
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId が必要です" }, { status: 400 });
  }

  // 投稿存在確認 + 所有者チェック
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, auth.userId)))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }

  if (post.status === "published" || post.status === "publishing") {
    return NextResponse.json(
      { error: "この投稿はすでに投稿済みまたは投稿中です" },
      { status: 400 }
    );
  }

  const results = await publishPost(postId);
  return NextResponse.json({ results });
}
