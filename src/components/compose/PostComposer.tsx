"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayTemplates } from "@/lib/templates";

const PLATFORMS = [
  { id: "x", label: "X (Twitter)", maxLength: 280 },
  { id: "bluesky", label: "Bluesky", maxLength: 300 },
] as const;

type Props = {
  allDays: DayTemplates[];
  todayDate: string | null;
};

export default function PostComposer({ allDays, todayDate }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["bluesky"]);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // テンプレート選択
  const [selectedDay, setSelectedDay] = useState<string>(todayDate || "");

  const currentDay = allDays.find((d) => d.date === selectedDay);

  function selectTemplate(templateBody: string, hashtags: string) {
    const fullText = hashtags ? `${templateBody}\n\n${hashtags}` : templateBody;
    setBody(fullText);
  }

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const maxLength = Math.min(
    ...platforms.map(
      (id) => PLATFORMS.find((p) => p.id === id)?.maxLength ?? 300
    )
  );

  async function handleSave(publish: boolean) {
    setError("");
    setLoading(true);

    try {
      const createRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          platforms,
          scheduledAt: scheduleMode && scheduledAt ? scheduledAt : null,
        }),
      });

      const post = await createRes.json();
      if (!createRes.ok) {
        setError(post.error || "作成に失敗しました");
        return;
      }

      if (publish) {
        const pubRes = await fetch("/api/posts/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id }),
        });

        const pubData = await pubRes.json();
        if (!pubRes.ok) {
          setError(pubData.error || "投稿に失敗しました");
          return;
        }

        const failures = pubData.results.filter(
          (r: { success: boolean }) => !r.success
        );
        if (failures.length > 0) {
          setError(
            `一部のプラットフォームで失敗: ${failures
              .map(
                (f: { platform: string; error: string }) =>
                  `${f.platform}: ${f.error}`
              )
              .join(", ")}`
          );
          return;
        }
      }

      router.push("/dashboard/posts");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* テンプレート選択 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          テンプレートから選択
        </h2>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
        >
          <option value="">日付を選択...</option>
          {allDays.map((day) => (
            <option key={day.date} value={day.date}>
              {day.date} ({day.dayOfWeek})
              {day.date === todayDate ? " ← 今日" : ""}
            </option>
          ))}
        </select>

        {currentDay && (
          <div className="space-y-3">
            {currentDay.templates.map((t, i) => (
              <button
                key={i}
                onClick={() => selectTemplate(t.body, t.hashtags)}
                className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600">
                    {t.option}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t.theme}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{t.body}</p>
                <p className="text-xs text-gray-400 mt-1">{t.hashtags}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 投稿エディタ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* プラットフォーム選択 */}
        <div className="flex gap-3 mb-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                platforms.includes(p.id)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* テキストエリア */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="投稿内容を入力...またはテンプレートから選択"
          rows={8}
          className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1 mb-4">
          <span>
            {body.length} / {maxLength}
          </span>
          {body.length > maxLength && (
            <span className="text-red-500">文字数オーバー</span>
          )}
        </div>

        {/* スケジュール */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={scheduleMode}
              onChange={(e) => setScheduleMode(e.target.checked)}
            />
            スケジュール投稿
          </label>
          {scheduleMode && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-2 px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          {!scheduleMode && (
            <button
              onClick={() => handleSave(true)}
              disabled={
                loading ||
                !body.trim() ||
                platforms.length === 0 ||
                body.length > maxLength
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? "投稿中..." : "今すぐ投稿"}
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={loading || !body.trim() || platforms.length === 0}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {scheduleMode ? "スケジュール登録" : "下書き保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
