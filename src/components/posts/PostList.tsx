"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { weightedLength, MAX_WEIGHT } from "@/lib/text-utils";

type PlatformResult = {
  platform: string;
  success: number;
  platformUrl: string | null;
  error: string | null;
  publishedAt: string | null;
};

type PostImageMeta = {
  mimeType: string;
  alt: string;
};

type Post = {
  id: string;
  body: string;
  platforms: string[];
  images: PostImageMeta[] | null;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  results: PlatformResult[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-200/60 text-gray-600" },
  scheduled: { label: "予約済み", color: "bg-yellow-100/80 text-yellow-700" },
  publishing: { label: "投稿中", color: "bg-blue-100/80 text-blue-700" },
  published: { label: "投稿済み", color: "bg-green-100/80 text-green-700" },
  failed: { label: "失敗", color: "bg-red-100/80 text-red-700" },
};

function formatJST(dateStr: string) {
  return new Date(dateStr).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

function formatShortJST(dateStr: string) {
  const d = new Date(dateStr);
  const jst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const month = jst.getMonth() + 1;
  const day = jst.getDate();
  const hours = String(jst.getHours()).padStart(2, "0");
  const minutes = String(jst.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function PostListSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-14 rounded-full" />
          </div>
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4 mb-4" />
          <div className="flex gap-2">
            <div className="skeleton h-10 w-24 rounded-xl" />
            <div className="skeleton h-10 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PostList() {
  const router = useRouter();
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPostsList(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("この投稿を削除しますか？")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPostsList((prev) => prev.filter((p) => p.id !== id));
  }

  async function handlePublish(id: string) {
    const res = await fetch("/api/posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
    if (res.ok) {
      fetchPosts();
    }
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditBody(post.body);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody }),
    });
    if (res.ok) {
      setPostsList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, body: editBody } : p))
      );
      setEditingId(null);
    }
    setEditSaving(false);
  }

  if (loading) return <PostListSkeleton />;

  if (postsList.length === 0)
    return (
      <div className="card p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-800 font-semibold mb-1">投稿はまだありません</p>
        <p className="text-sm text-gray-500">投稿を作成すると、ここに表示されます</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {postsList.map((post, index) => {
        const s = STATUS_LABELS[post.status] || STATUS_LABELS.draft;
        return (
          <div
            key={post.id}
            className="card p-5 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${s.color}`}
                >
                  {s.label}
                </span>
                {(post.platforms as string[]).map((p) => (
                  <span
                    key={p}
                    className="text-xs bg-gray-100/80 text-gray-500 px-2 py-1 rounded-full"
                  >
                    {p === "x" ? "X" : "Bluesky"}
                  </span>
                ))}
                {post.images && post.images.length > 0 && (
                  <span className="text-xs bg-blue-50/80 text-blue-500 px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                    {post.images.length}枚
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                {formatJST(post.createdAt)}
              </span>
            </div>

            {editingId === post.id ? (
              <div className="mb-3">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50/60 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-[15px] leading-relaxed shadow-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-sm ${
                      weightedLength(editBody) > MAX_WEIGHT
                        ? "text-red-500 font-semibold"
                        : weightedLength(editBody) >= MAX_WEIGHT * 0.9
                          ? "text-yellow-500 font-medium"
                          : "text-gray-400"
                    }`}
                  >
                    {weightedLength(editBody)} / {MAX_WEIGHT}
                  </span>
                  <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(post.id)}
                    disabled={editSaving || !editBody.trim() || weightedLength(editBody) > MAX_WEIGHT}
                    className="btn-primary h-9 px-4 text-sm tap-highlight"
                  >
                    {editSaving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="h-9 px-4 text-sm text-gray-500 bg-gray-100/80 rounded-[14px] hover:bg-gray-200/80 transition tap-highlight"
                  >
                    キャンセル
                  </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-3">{post.body}</p>
            )}

            {(() => {
              const publishedResult = post.results.find((r) => r.success && r.publishedAt);
              const publishedAt = publishedResult?.publishedAt;

              if (post.status === "scheduled" && post.scheduledAt) {
                return (
                  <p className="text-xs text-yellow-600 mb-2">
                    予約: {formatShortJST(post.scheduledAt)}
                  </p>
                );
              }
              if (post.status === "published" && post.scheduledAt && publishedAt) {
                return (
                  <p className="text-xs text-green-600 mb-2">
                    予約: {formatShortJST(post.scheduledAt)} → 投稿: {formatShortJST(publishedAt)}
                  </p>
                );
              }
              if (post.status === "published" && publishedAt) {
                return (
                  <p className="text-xs text-green-600 mb-2">
                    投稿: {formatShortJST(publishedAt)}
                  </p>
                );
              }
              return null;
            })()}

            {/* プラットフォーム結果 */}
            {post.results.length > 0 && (
              <div className="flex gap-2 mb-3">
                {post.results.map((r, i) => (
                  <div key={i} className="text-xs">
                    {r.success ? (
                      r.platformUrl ? (
                        <a
                          href={r.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {r.platform === "x" ? "X" : "Bluesky"} で表示
                        </a>
                      ) : (
                        <span className="text-green-600">
                          {r.platform} 成功
                        </span>
                      )
                    ) : (
                      <span className="text-red-600">
                        {r.platform === "x" ? "X" : "Bluesky"}: {r.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* アクション */}
            {editingId !== post.id && (
              <div className="flex gap-2">
                {(post.status === "draft" || post.status === "failed") && (
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="btn-primary h-10 px-5 text-sm tap-highlight"
                  >
                    今すぐ投稿
                  </button>
                )}
                {(post.status === "draft" || post.status === "scheduled") && (
                  <button
                    onClick={() => startEdit(post)}
                    className="h-10 px-4 text-sm text-blue-600 bg-blue-50/80 rounded-[14px] hover:bg-blue-100/80 transition tap-highlight"
                  >
                    編集
                  </button>
                )}
                {(post.status === "draft" || post.status === "scheduled") && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="h-10 px-4 text-sm text-red-500 bg-red-50/80 rounded-[14px] hover:bg-red-100/80 transition tap-highlight"
                  >
                    削除
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
