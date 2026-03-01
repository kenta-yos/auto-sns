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
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center text-gray-500">
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border animate-fade-in-up">
      <h3 className="text-base font-semibold mb-3">
        投稿別エンゲージメント
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "none",
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
