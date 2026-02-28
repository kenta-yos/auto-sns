import { BskyAgent, RichText } from "@atproto/api";

export interface BlueskyCredentials {
  identifier: string; // handle or DID
  password: string; // app password
}

async function createAgent(credentials: BlueskyCredentials): Promise<BskyAgent> {
  const agent = new BskyAgent({ service: "https://bsky.social" });
  await agent.login({
    identifier: credentials.identifier,
    password: credentials.password,
  });
  return agent;
}

export async function postToBluesky(
  credentials: BlueskyCredentials,
  text: string
): Promise<{ uri: string; cid: string; url: string }> {
  const agent = await createAgent(credentials);

  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  const res = await agent.post({
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  });

  // handle から URL を組み立て
  const handle = credentials.identifier.replace(/^@/, "");
  const rkey = res.uri.split("/").pop();
  const url = `https://bsky.app/profile/${handle}/post/${rkey}`;

  return {
    uri: res.uri,
    cid: res.cid,
    url,
  };
}

export async function testBlueskyConnection(
  credentials: BlueskyCredentials
): Promise<{ success: boolean; handle?: string; error?: string }> {
  try {
    const agent = await createAgent(credentials);
    const profile = await agent.getProfile({
      actor: agent.session!.did,
    });
    return { success: true, handle: profile.data.handle };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function getBlueskyPostMetrics(
  credentials: BlueskyCredentials,
  uri: string
): Promise<{
  likeCount: number;
  repostCount: number;
  replyCount: number;
}> {
  const agent = await createAgent(credentials);

  const thread = await agent.getPostThread({ uri, depth: 0 });
  const threadView = thread.data.thread;

  if (threadView.$type !== "app.bsky.feed.defs#threadViewPost") {
    throw new Error("Could not fetch post thread");
  }

  const postView = threadView as { post: { likeCount?: number; repostCount?: number; replyCount?: number } };

  return {
    likeCount: postView.post.likeCount ?? 0,
    repostCount: postView.post.repostCount ?? 0,
    replyCount: postView.post.replyCount ?? 0,
  };
}

export async function getBlueskyProfileMetrics(
  credentials: BlueskyCredentials
): Promise<{
  followersCount: number;
  followsCount: number;
  postsCount: number;
}> {
  const agent = await createAgent(credentials);
  const profile = await agent.getProfile({
    actor: agent.session!.did,
  });

  return {
    followersCount: profile.data.followersCount ?? 0,
    followsCount: profile.data.followsCount ?? 0,
    postsCount: profile.data.postsCount ?? 0,
  };
}
