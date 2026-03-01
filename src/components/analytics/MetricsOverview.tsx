"use client";

type Props = {
  summary: {
    totalLikes: number;
    totalReposts: number;
    totalReplies: number;
    totalPosts: number;
    followersCount: number;
    followsCount: number;
  };
};

const metricCards = [
  { key: "followersCount", label: "フォロワー", color: "text-blue-600", bg: "bg-blue-50/80" },
  { key: "followsCount", label: "フォロー中", color: "text-blue-600", bg: "bg-blue-50/80" },
  { key: "totalPosts", label: "投稿数", color: "text-pink-600", bg: "bg-pink-50/80" },
  { key: "totalLikes", label: "いいね", color: "text-purple-600", bg: "bg-purple-50/80" },
  { key: "totalReposts", label: "リポスト", color: "text-orange-600", bg: "bg-orange-50/80" },
  { key: "totalReplies", label: "リプライ", color: "text-green-600", bg: "bg-green-50/80" },
] as const;

export default function MetricsOverview({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
      {metricCards.map((card) => (
        <div
          key={card.key}
          className={`${card.bg} p-4 rounded-2xl text-center`}
        >
          <p className={`text-2xl font-bold ${card.color}`}>
            {summary[card.key].toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
