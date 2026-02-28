"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PostMetric = {
  body: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  postCreatedAt: string;
};

type Props = {
  data: PostMetric[];
};

export default function EngagementChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border text-center text-gray-500">
        エンゲージメントデータがありません
      </div>
    );
  }

  const chartData = data
    .slice(0, 20)
    .reverse()
    .map((d) => ({
      name: d.body.substring(0, 20) + (d.body.length > 20 ? "…" : ""),
      いいね: d.likeCount,
      リポスト: d.repostCount,
      リプライ: d.replyCount,
    }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">
        投稿別エンゲージメント (Bluesky)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="いいね" fill="#ec4899" />
          <Bar dataKey="リポスト" fill="#8b5cf6" />
          <Bar dataKey="リプライ" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
