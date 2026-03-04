"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DayTemplates } from "@/lib/templates";
import { compressImage, type CompressedImage } from "@/lib/image-compress";
import { weightedLength, MAX_WEIGHT } from "@/lib/text-utils";

const PLATFORMS = [
  { id: "x", label: "X (Twitter)", maxWeight: MAX_WEIGHT },
  { id: "bluesky", label: "Bluesky", maxWeight: 300 },
] as const;

function getDefault48h(): string {
  const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const jst = new Date(future.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");
  const h = String(jst.getHours()).padStart(2, "0");
  const min = String(jst.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

type Props = {
  allDays: DayTemplates[];
  todayDate: string | null;
};

export default function PostComposer({ allDays, todayDate }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["bluesky"]);
  const [scheduleMode, setScheduleMode] = useState(true);
  const [scheduledAt, setScheduledAt] = useState(getDefault48h());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 画像
  const [images, setImages] = useState<(CompressedImage & { previewUrl: string })[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setImageLoading(true);
    setError("");

    try {
      const remaining = 4 - images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      const compressed = await Promise.all(
        toProcess.map(async (file) => {
          const result = await compressImage(file);
          const previewUrl = `data:${result.mimeType};base64,${result.data}`;
          return { ...result, previewUrl };
        })
      );

      setImages((prev) => [...prev, ...compressed].slice(0, 4));
    } catch {
      setError("画像の処理に失敗しました");
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)}KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  const maxWeight = Math.min(
    ...platforms.map(
      (id) => PLATFORMS.find((p) => p.id === id)?.maxWeight ?? 300
    )
  );

  const currentWeight = weightedLength(body);
  const charRatio = currentWeight / maxWeight;

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
          images: images.length > 0
            ? images.map((img) => ({ data: img.data, mimeType: img.mimeType, alt: "" }))
            : undefined,
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
            {currentWeight} / {maxWeight}
          </span>
          {currentWeight > maxWeight && (
            <span className="text-red-500 font-medium">文字数オーバー</span>
          )}
        </div>

        {/* 画像添付 */}
        <div className="mb-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4 || imageLoading}
            className="flex items-center gap-2 h-11 px-4 bg-gray-50/60 rounded-xl text-sm text-gray-600 hover:bg-gray-100/80 transition tap-highlight disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            {imageLoading ? "処理中..." : `画像を追加 (${images.length}/4)`}
          </button>

          {images.length > 0 && (
            <div className={`mt-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.previewUrl}
                    alt={`添付画像 ${i + 1}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                    {formatSize(img.sizeBytes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/70 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
                currentWeight > maxWeight
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
