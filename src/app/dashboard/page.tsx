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

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero skeleton */}
      <div className="skeleton h-28 w-full rounded-2xl" />
      {/* 2x2 grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>
      {/* Chart skeletons */}
      <div className="skeleton h-52 rounded-2xl" />
      <div className="skeleton h-52 rounded-2xl" />
    </div>
  );
}

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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-xl text-sm h-10"
          >
            <option value={7}>過去7日</option>
            <option value={30}>過去30日</option>
            <option value={90}>過去90日</option>
          </select>
          <Link
            href="/dashboard/compose"
            className="px-4 h-10 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition font-medium flex items-center justify-center tap-highlight"
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
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-1">まだデータがありません</p>
          <p className="text-sm text-gray-500 mb-4">
            最初の投稿を作成して分析を始めましょう
          </p>
          <Link
            href="/dashboard/compose"
            className="inline-flex items-center justify-center px-5 h-11 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition tap-highlight"
          >
            最初の投稿を作成
          </Link>
        </div>
      )}
    </div>
  );
}
