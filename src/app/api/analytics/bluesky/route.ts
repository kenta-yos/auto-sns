import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  blueskyPostMetrics,
  blueskyProfileMetrics,
  posts,
  postPlatformResults,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { desc, eq, and, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  // 各投稿の最新メトリクス
  const postMetrics = await db
    .select()
    .from(blueskyPostMetrics)
    .where(gte(blueskyPostMetrics.collectedAt, since))
    .orderBy(desc(blueskyPostMetrics.collectedAt));

  // 投稿URIごとに最新のスナップショットだけ取得
  const latestByUri = new Map<
    string,
    {
      platformPostUri: string;
      likeCount: number;
      repostCount: number;
      replyCount: number;
      collectedAt: Date;
      postId: string;
    }
  >();

  for (const m of postMetrics) {
    if (!latestByUri.has(m.platformPostUri)) {
      latestByUri.set(m.platformPostUri, m);
    }
  }

  // 投稿情報を紐付け
  const enriched = await Promise.all(
    Array.from(latestByUri.values()).map(async (m) => {
      const [post] = await db
        .select({ body: posts.body, createdAt: posts.createdAt })
        .from(posts)
        .where(eq(posts.id, m.postId))
        .limit(1);

      const [result] = await db
        .select({ platformUrl: postPlatformResults.platformUrl })
        .from(postPlatformResults)
        .where(
          and(
            eq(postPlatformResults.postId, m.postId),
            eq(postPlatformResults.platform, "bluesky")
          )
        )
        .limit(1);

      return {
        ...m,
        body: post?.body?.substring(0, 60) || "",
        postCreatedAt: post?.createdAt,
        platformUrl: result?.platformUrl,
      };
    })
  );

  // プロフィール推移
  const profileMetrics = await db
    .select()
    .from(blueskyProfileMetrics)
    .where(gte(blueskyProfileMetrics.collectedAt, since))
    .orderBy(blueskyProfileMetrics.collectedAt);

  // サマリー
  const totalLikes = Array.from(latestByUri.values()).reduce(
    (sum, m) => sum + m.likeCount,
    0
  );
  const totalReposts = Array.from(latestByUri.values()).reduce(
    (sum, m) => sum + m.repostCount,
    0
  );
  const totalReplies = Array.from(latestByUri.values()).reduce(
    (sum, m) => sum + m.replyCount,
    0
  );

  const latestProfile = profileMetrics[profileMetrics.length - 1];

  return NextResponse.json({
    postMetrics: enriched,
    profileMetrics: profileMetrics.map((p) => ({
      ...p,
      collectedAt: p.collectedAt.toISOString(),
    })),
    summary: {
      totalLikes,
      totalReposts,
      totalReplies,
      totalPosts: latestProfile?.postsCount ?? 0,
      followersCount: latestProfile?.followersCount ?? 0,
      followsCount: latestProfile?.followsCount ?? 0,
    },
  });
}
