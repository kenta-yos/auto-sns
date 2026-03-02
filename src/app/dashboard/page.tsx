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

type Post = {
  id: string;
  status: string;
  scheduledAt: string | null;
};

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-20 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
      <div className="skeleton h-52" />
      <div className="skeleton h-52" />
    </div>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function formatScheduleDate(dateStr: string): string {
  const d = new Date(dateStr);
  const jst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const month = jst.getMonth() + 1;
  const day = jst.getDate();
  const weekday = WEEKDAYS[jst.getDay()];
  const hours = String(jst.getHours()).padStart(2, "0");
  const minutes = String(jst.getMinutes()).padStart(2, "0");
  return `${month}/${day}(${weekday}) ${hours}:${minutes}`;
}

function formatTodayShort(): string {
  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return `${jst.getMonth() + 1}/${jst.getDate()}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [analyticsRes, postsRes] = await Promise.all([
        fetch(`/api/analytics/bluesky?days=${days}`),
        fetch("/api/posts"),
      ]);
      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setData(json);
      }
      if (postsRes.ok) {
        const allPosts: Post[] = await postsRes.json();
        setScheduledPosts(
          allPosts.filter((p) => p.status === "scheduled")
        );
      }
      setLoading(false);
    }
    fetchData();
  }, [days]);

  if (loading) return <DashboardSkeleton />;

  const latestScheduledDate = scheduledPosts.length > 0
    ? scheduledPosts.reduce((latest, p) => {
        if (!p.scheduledAt) return latest;
        return !latest || new Date(p.scheduledAt) > new Date(latest)
          ? p.scheduledAt
          : latest;
      }, null as string | null)
    : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">ダッシュボード</h1>
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 bg-white/60 backdrop-blur border-0 rounded-xl text-sm h-10 shadow-sm"
          >
            <option value={7}>過去7日</option>
            <option value={30}>過去30日</option>
            <option value={90}>過去90日</option>
          </select>
          <Link
            href="/dashboard/compose"
            className="btn-primary px-5 h-10 text-sm flex items-center justify-center tap-highlight"
          >
            新規投稿
          </Link>
        </div>
      </div>

      {/* Scheduled Posts Card */}
      {(() => {
        if (scheduledPosts.length === 0) {
          return (
            <div className="rounded-2xl border-l-4 border-orange-400 bg-orange-50/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-orange-700">予約投稿がありません</p>
                  <p className="text-xs text-orange-600/70 mt-0.5">投稿を作成して予約しましょう</p>
                </div>
                <Link
                  href="/dashboard/compose"
                  className="btn-primary px-4 h-9 text-sm flex items-center justify-center tap-highlight"
                >
                  作成 →
                </Link>
              </div>
            </div>
          );
        }

        const now = Date.now();
        const lastMs = latestScheduledDate ? new Date(latestScheduledDate).getTime() : now;
        const diffMs = lastMs - now;
        const THRESHOLD_48H = 172800000;
        const isWarning = diffMs < THRESHOLD_48H;

        if (isWarning) {
          const hoursLeft = Math.max(0, Math.round(diffMs / 3600000));
          return (
            <div className="rounded-2xl border-l-4 border-orange-400 bg-orange-50/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-orange-700">
                    残り約{hoursLeft}時間 ・ {scheduledPosts.length}件
                  </p>
                  <p className="text-xs text-orange-600/70 mt-0.5">48時間を切っています</p>
                </div>
                <Link
                  href="/dashboard/compose"
                  className="btn-primary px-4 h-9 text-sm flex items-center justify-center tap-highlight"
                >
                  追加 →
                </Link>
              </div>
            </div>
          );
        }

        const daysAhead = Math.floor(diffMs / 86400000);
        return (
          <div className="rounded-2xl border-l-4 border-blue-400 bg-blue-50/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-700">
                  今日 {formatTodayShort()} → 最終 {latestScheduledDate ? formatScheduleDate(latestScheduledDate) : ""}
                </p>
                <p className="text-xs text-blue-600/70 mt-0.5">
                  {daysAhead}日先まで確保 ・ {scheduledPosts.length}件
                </p>
              </div>
              <Link
                href="/dashboard/compose"
                className="btn-primary px-4 h-9 text-sm flex items-center justify-center tap-highlight"
              >
                追加 →
              </Link>
            </div>
          </div>
        );
      })()}

      {data ? (
        <>
          <MetricsOverview summary={data.summary} />
          <EngagementChart data={data.postMetrics} />
          <FollowerGrowthChart data={data.profileMetrics} />
        </>
      ) : (
        <div className="card p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-gray-800 font-semibold mb-1">まだデータがありません</p>
          <p className="text-sm text-gray-500 mb-5">
            最初の投稿を作成して分析を始めましょう
          </p>
          <Link
            href="/dashboard/compose"
            className="btn-primary inline-flex items-center justify-center px-6 h-11 text-sm tap-highlight"
          >
            最初の投稿を作成
          </Link>
        </div>
      )}
    </div>
  );
}
