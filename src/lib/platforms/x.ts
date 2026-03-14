import { TwitterApi } from "twitter-api-v2";
import type { PostImage } from "@/lib/db/schema";

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export async function postToX(
  credentials: XCredentials,
  text: string,
  images?: PostImage[]
): Promise<{ id: string; url: string }> {
  const client = new TwitterApi({
    appKey: credentials.apiKey,
    appSecret: credentials.apiSecret,
    accessToken: credentials.accessToken,
    accessSecret: credentials.accessSecret,
  });

  // Upload images if provided
  let mediaIds: string[] | undefined;
  if (images && images.length > 0) {
    const v1Client = client.v1;
    mediaIds = await Promise.all(
      images.map(async (img) => {
        const buf = Buffer.from(img.data, "base64");
        return v1Client.uploadMedia(buf, { mimeType: img.mimeType });
      })
    );
  }

  const { data } = await client.v2.tweet({
    text,
    ...(mediaIds && mediaIds.length > 0
      ? { media: { media_ids: mediaIds as [string] | [string, string] | [string, string, string] | [string, string, string, string] } }
      : {}),
  });
  return {
    id: data.id,
    url: `https://x.com/i/status/${data.id}`,
  };
}

export async function testXConnection(
  credentials: XCredentials
): Promise<{ success: boolean; username?: string; error?: string }> {
  try {
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });
    const me = await client.v2.me();
    return { success: true, username: me.data.username };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
