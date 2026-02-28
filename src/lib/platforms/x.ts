import { TwitterApi } from "twitter-api-v2";

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export async function postToX(
  credentials: XCredentials,
  text: string
): Promise<{ id: string; url: string }> {
  const client = new TwitterApi({
    appKey: credentials.apiKey,
    appSecret: credentials.apiSecret,
    accessToken: credentials.accessToken,
    accessSecret: credentials.accessSecret,
  });

  const { data } = await client.v2.tweet(text);
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
