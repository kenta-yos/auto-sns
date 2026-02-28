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

const cards = [
  { key: "followersCount", label: "フォロワー", color: "text-blue-600" },
  { key: "totalPosts", label: "投稿数 (30日)", color: "text-green-600" },
  { key: "totalLikes", label: "いいね合計", color: "text-pink-600" },
  { key: "totalReposts", label: "リポスト合計", color: "text-purple-600" },
  { key: "totalReplies", label: "リプライ合計", color: "text-orange-600" },
  { key: "followsCount", label: "フォロー中", color: "text-gray-600" },
] as const;

export default function MetricsOverview({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-white p-4 rounded-xl shadow-sm border text-center"
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
