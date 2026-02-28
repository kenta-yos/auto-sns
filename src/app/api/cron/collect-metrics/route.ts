import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  posts,
  postPlatformResults,
  platformCredentials,
  blueskyPostMetrics,
  blueskyProfileMetrics,
} from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { decrypt } from "@/lib/encryption";
import {
  getBlueskyPostMetrics,
  getBlueskyProfileMetrics,
  type BlueskyCredentials,
} from "@/lib/platforms/bluesky";

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  // Bluesky の認証情報を取得（最初に見つかったもの）
  const [cred] = await db
    .select()
    .from(platformCredentials)
    .where(eq(platformCredentials.platform, "bluesky"))
    .limit(1);

  if (!cred) {
    return NextResponse.json(
      { error: "Bluesky credentials not configured" },
      { status: 400 }
    );
  }

  const credentials = JSON.parse(
    decrypt(cred.encrypted as { iv: string; authTag: string; ciphertext: string })
  ) as BlueskyCredentials;

  const collected = { postMetrics: 0, profileMetrics: 0, errors: [] as string[] };

  // 1. 過去30日の Bluesky 投稿のメトリクス収集
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const blueskyResults = await db
    .select()
    .from(postPlatformResults)
    .where(
      and(
        eq(postPlatformResults.platform, "bluesky"),
        eq(postPlatformResults.success, 1),
        gte(postPlatformResults.publishedAt, thirtyDaysAgo)
      )
    );

  for (const result of blueskyResults) {
    if (!result.platformPostId) continue;
    try {
      const metrics = await getBlueskyPostMetrics(
        credentials,
        result.platformPostId
      );

      await db.insert(blueskyPostMetrics).values({
        postId: result.postId,
        platformPostUri: result.platformPostId,
        likeCount: metrics.likeCount,
        repostCount: metrics.repostCount,
        replyCount: metrics.replyCount,
      });

      collected.postMetrics++;
    } catch (e) {
      collected.errors.push(
        `Post ${result.postId}: ${e instanceof Error ? e.message : "Unknown"}`
      );
    }
  }

  // 2. プロフィールメトリクス収集
  try {
    const profileMetrics = await getBlueskyProfileMetrics(credentials);
    await db.insert(blueskyProfileMetrics).values({
      followersCount: profileMetrics.followersCount,
      followsCount: profileMetrics.followsCount,
      postsCount: profileMetrics.postsCount,
    });
    collected.profileMetrics = 1;
  } catch (e) {
    collected.errors.push(
      `Profile: ${e instanceof Error ? e.message : "Unknown"}`
    );
  }

  return NextResponse.json({
    ...collected,
    collectedAt: new Date().toISOString(),
  });
}
