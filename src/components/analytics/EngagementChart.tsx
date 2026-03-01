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
      <div className="card p-6 text-center text-gray-500">
        エンゲージメントデータがありません
      </div>
    );
  }

  const chartData = data
    .slice(0, 10)
    .reverse()
    .map((d, i) => ({
      name: `#${i + 1}`,
      いいね: d.likeCount,
      リポスト: d.repostCount,
      リプライ: d.replyCount,
    }));

  return (
    <div className="card p-5 animate-fade-in-up">
      <h3 className="text-base font-semibold mb-3">
        投稿別エンゲージメント
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "none",
              fontSize: 13,
            }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="いいね" fill="#ec4899" radius={[4, 4, 0, 0]} />
          <Bar dataKey="リポスト" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="リプライ" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
