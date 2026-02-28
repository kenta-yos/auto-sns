"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MetricsOverview from "@/components/analytics/MetricsOverview";
import EngagementChart from "@/components/analytics/EngagementChart";
import FollowerGrowthChart from "@/components/analytics/FollowerGrowthChart";

type AnalyticsData = {
  postMetrics: Array<{
    body: string;
    likeCount: number;
    repostCount: number;
    replyCount: number;
    postCreatedAt: string;
  }>;
  profileMetrics: Array<{
    followersCount: number;
    followsCount: number;
    postsCount: number;
    collectedAt: string;
  }>;
  summary: {
    totalLikes: number;
    totalReposts: number;
    totalReplies: number;
    totalPosts: number;
    followersCount: number;
    followsCount: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch(`/api/analytics/bluesky?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    }
    fetchData();
  }, [days]);

  if (loading) return <div className="text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={7}>過去7日</option>
            <option value={30}>過去30日</option>
            <option value={90}>過去90日</option>
          </select>
          <Link
            href="/dashboard/compose"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            新規投稿
          </Link>
        </div>
      </div>

      {data ? (
        <>
          <MetricsOverview summary={data.summary} />
          <EngagementChart data={data.postMetrics} />
          <FollowerGrowthChart data={data.profileMetrics} />
        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center text-gray-500">
          <p>まだデータがありません</p>
          <Link
            href="/dashboard/compose"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            最初の投稿を作成する
          </Link>
        </div>
      )}
    </div>
  );
}
