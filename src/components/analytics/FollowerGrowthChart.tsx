"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ProfileMetric = {
  followersCount: number;
  followsCount: number;
  postsCount: number;
  collectedAt: string;
};

type Props = {
  data: ProfileMetric[];
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "short",
    day: "numeric",
  });
}

export default function FollowerGrowthChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border text-center text-gray-500">
        フォロワーデータがありません
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.collectedAt),
    フォロワー: d.followersCount,
    フォロー中: d.followsCount,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">
        フォロワー推移 (Bluesky)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="フォロワー"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="フォロー中"
            stroke="#9ca3af"
            strokeWidth={1}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
