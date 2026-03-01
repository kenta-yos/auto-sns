"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayTemplates } from "@/lib/templates";

const PLATFORMS = [
  { id: "x", label: "X (Twitter)", maxLength: 280 },
  { id: "bluesky", label: "Bluesky", maxLength: 280 },
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
  const [templateOpen, setTemplateOpen] = useState(true);

  const currentDay = allDays.find((d) => d.date === selectedDay);

  function selectTemplate(templateBody: string, hashtags: string) {
    const fullText = hashtags ? `${templateBody}\n\n${hashtags}` : templateBody;
    setBody(fullText);
    setTemplateOpen(false);
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

  const charRatio = body.length / maxLength;

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
          scheduledAt: scheduleMode && scheduledAt ? scheduledAt + "+09:00" : null,
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
    <div className="space-y-4 animate-fade-in">
      {/* テンプレート選択（折りたたみ式） */}
      <div className="card p-5">
        <button
          onClick={() => setTemplateOpen(!templateOpen)}
          className="w-full flex items-center justify-between min-h-[44px] tap-highlight"
        >
          <h2 className="text-sm font-semibold text-gray-700">
            テンプレートから選択
          </h2>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${templateOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {templateOpen && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/80 border-0 rounded-xl text-sm h-11 shadow-sm"
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
              <div className="space-y-2">
                {currentDay.templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => selectTemplate(t.body, t.hashtags)}
                    className="w-full text-left p-4 bg-gray-50/60 rounded-2xl hover:bg-blue-50 transition tap-highlight min-h-[44px]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-600">
                        {t.option}
                      </span>
                      <span className="text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded-full shadow-sm">
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
        )}
      </div>

      {/* 投稿エディタ */}
      <div className="card p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* プラットフォーム選択 */}
        <div className="flex gap-2 mb-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`flex-1 h-11 rounded-xl text-sm font-medium transition tap-highlight ${
                platforms.includes(p.id)
                  ? "btn-primary"
                  : "bg-gray-100/80 text-gray-600"
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
          rows={6}
          className="w-full px-4 py-3 bg-gray-50/60 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
        />
        <div className="flex justify-between text-sm mt-1.5 mb-4">
          <span
            className={
              charRatio > 1
                ? "text-red-500 font-semibold"
                : charRatio >= 0.9
                  ? "text-yellow-500 font-medium"
                  : "text-gray-400"
            }
          >
            {body.length} / {maxLength}
          </span>
          {body.length > maxLength && (
            <span className="text-red-500 font-medium">文字数オーバー</span>
          )}
        </div>

        {/* スケジュール（トグルスイッチ） */}
        <div className="mb-5">
          <button
            onClick={() => setScheduleMode(!scheduleMode)}
            className="flex items-center justify-between w-full min-h-[44px] tap-highlight"
          >
            <span className="text-sm text-gray-700">スケジュール投稿</span>
            <span
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                scheduleMode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  scheduleMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
          {scheduleMode && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-3 w-full px-3 py-2 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm"
            />
          )}
        </div>

        {/* アクションボタン（縦並び） */}
        <div className="space-y-2">
          {!scheduleMode && (
            <button
              onClick={() => handleSave(true)}
              disabled={
                loading ||
                !body.trim() ||
                platforms.length === 0 ||
                body.length > maxLength
              }
              className="btn-primary w-full h-12 tap-highlight"
            >
              {loading ? "投稿中..." : "今すぐ投稿"}
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={loading || !body.trim() || platforms.length === 0}
            className="w-full h-12 bg-gray-100/80 rounded-[14px] hover:bg-gray-200/80 disabled:opacity-50 transition font-medium tap-highlight"
          >
            {scheduleMode ? "スケジュール登録" : "下書き保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
