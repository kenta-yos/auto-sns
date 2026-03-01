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
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center text-gray-500">
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border animate-fade-in-up">
      <h3 className="text-base font-semibold mb-3">
        フォロワー推移
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "none",
            }}
          />
          <Line
            type="monotone"
            dataKey="フォロワー"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="フォロー中"
            stroke="#d1d5db"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
