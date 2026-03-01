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
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                {formatJST(post.createdAt)}
              </span>
            </div>

            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-3">{post.body}</p>

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
                  className="btn-primary h-10 px-5 text-sm tap-highlight"
                >
                  今すぐ投稿
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
          </div>
        );
      })}
    </div>
  );
}
