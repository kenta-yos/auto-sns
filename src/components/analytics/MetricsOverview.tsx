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

const secondaryCards = [
  { key: "totalPosts", label: "投稿数", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
  { key: "totalLikes", label: "いいね", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  { key: "totalReposts", label: "リポスト", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { key: "totalReplies", label: "リプライ", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
] as const;

export default function MetricsOverview({ summary }: Props) {
  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Hero: Followers */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border text-center">
        <p className="text-4xl font-bold text-blue-600 tracking-tight">
          {summary.followersCount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-1">フォロワー</p>
        <p className="text-xs text-gray-400 mt-0.5">
          フォロー中: {summary.followsCount.toLocaleString()}
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {secondaryCards.map((card) => (
          <div
            key={card.key}
            className={`${card.bg} ${card.border} border p-4 rounded-2xl text-center`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>
              {summary[card.key].toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
