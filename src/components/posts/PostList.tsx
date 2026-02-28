"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PlatformResult = {
  platform: string;
  success: number;
  platformUrl: string | null;
  error: string | null;
  publishedAt: string | null;
};

type Post = {
  id: string;
  body: string;
  platforms: string[];
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  results: PlatformResult[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-600" },
  scheduled: { label: "予約済み", color: "bg-yellow-100 text-yellow-700" },
  publishing: { label: "投稿中", color: "bg-blue-100 text-blue-700" },
  published: { label: "投稿済み", color: "bg-green-100 text-green-700" },
  failed: { label: "失敗", color: "bg-red-100 text-red-700" },
};

function formatJST(dateStr: string) {
  return new Date(dateStr).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

export default function PostList() {
  const router = useRouter();
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-gray-500">読み込み中...</div>;
  if (postsList.length === 0)
    return <div className="text-gray-500">投稿はまだありません</div>;

  return (
    <div className="space-y-4">
      {postsList.map((post) => {
        const s = STATUS_LABELS[post.status] || STATUS_LABELS.draft;
        return (
          <div
            key={post.id}
            className="bg-white p-5 rounded-xl shadow-sm border"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${s.color}`}
                >
                  {s.label}
                </span>
                {(post.platforms as string[]).map((p) => (
                  <span
                    key={p}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {p === "x" ? "X" : "Bluesky"}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {formatJST(post.createdAt)}
              </span>
            </div>

            <p className="text-sm whitespace-pre-wrap mb-3">{post.body}</p>

            {post.scheduledAt && post.status === "scheduled" && (
              <p className="text-xs text-yellow-600 mb-2">
                予約: {formatJST(post.scheduledAt)}
              </p>
            )}

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
            <div className="flex gap-2">
              {(post.status === "draft" || post.status === "failed") && (
                <button
                  onClick={() => handlePublish(post.id)}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  今すぐ投稿
                </button>
              )}
              {(post.status === "draft" || post.status === "scheduled") && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-xs px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
