import { db } from "@/lib/db";
import {
  posts,
  postPlatformResults,
  platformCredentials,
  type PostImage,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { postToX, type XCredentials } from "./x";
import { postToBluesky, type BlueskyCredentials } from "./bluesky";

/**
 * 投稿を各プラットフォームに送信する共通処理
 * API の即時投稿と cron のスケジュール投稿の両方で使用
 */
export async function publishPost(postId: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) throw new Error("Post not found");

  // ステータスを publishing に更新
  await db
    .update(posts)
    .set({ status: "publishing", updatedAt: new Date() })
    .where(eq(posts.id, postId));

  const platforms = post.platforms as string[];
  const results: { platform: string; success: boolean; error?: string }[] = [];

  for (const platform of platforms) {
    try {
      // 認証情報取得
      const [cred] = await db
        .select()
        .from(platformCredentials)
        .where(eq(platformCredentials.userId, post.userId))
        .then((rows) =>
          rows.filter(
            (r) => r.platform === platform
          )
        );

      if (!cred) {
        throw new Error(`${platform} の認証情報が設定されていません`);
      }

      const decrypted = JSON.parse(
        decrypt(cred.encrypted as { iv: string; authTag: string; ciphertext: string })
      );

      let result: { id?: string; uri?: string; url: string };

      if (platform === "x") {
        const xResult = await postToX(decrypted as XCredentials, post.body);
        result = { id: xResult.id, url: xResult.url };
      } else if (platform === "bluesky") {
        const bsResult = await postToBluesky(
          decrypted as BlueskyCredentials,
          post.body,
          (post.images as PostImage[] | null) ?? undefined
        );
        result = { id: bsResult.uri, uri: bsResult.uri, url: bsResult.url };
      } else {
        throw new Error(`Unknown platform: ${platform}`);
      }

      await db.insert(postPlatformResults).values({
        postId: post.id,
        platform: platform as "x" | "bluesky",
        success: 1,
        platformPostId: result.id || result.uri || null,
        platformUrl: result.url,
        publishedAt: new Date(),
      });

      results.push({ platform, success: true });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";

      await db.insert(postPlatformResults).values({
        postId: post.id,
        platform: platform as "x" | "bluesky",
        success: 0,
        error: errorMsg,
      });

      results.push({ platform, success: false, error: errorMsg });
    }
  }

  // 全プラットフォーム成功なら published、一つでも失敗なら failed
  // 投稿完了後は画像データをDBから削除
  const allSuccess = results.every((r) => r.success);
  await db
    .update(posts)
    .set({
      status: allSuccess ? "published" : "failed",
      images: null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  return results;
}
