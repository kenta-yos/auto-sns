"use client";

import { useState, useEffect } from "react";

type PlatformStatus = {
  configured: boolean;
  updatedAt: string | null;
};

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState(true);

  // X credentials
  const [xApiKey, setXApiKey] = useState("");
  const [xApiSecret, setXApiSecret] = useState("");
  const [xAccessToken, setXAccessToken] = useState("");
  const [xAccessSecret, setXAccessSecret] = useState("");

  // Bluesky credentials
  const [bsIdentifier, setBsIdentifier] = useState("");
  const [bsPassword, setBsPassword] = useState("");

  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    const res = await fetch("/api/settings/credentials");
    const data = await res.json();
    setStatuses(data);
    setLoading(false);
  }

  async function saveCredentials(
    platform: string,
    credentials: Record<string, string>
  ) {
    setMessage("");
    const res = await fetch("/api/settings/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, credentials }),
    });

    if (res.ok) {
      setMessage(`${platform} の認証情報を保存しました`);
      fetchStatuses();
    } else {
      setMessage("保存に失敗しました");
    }
  }

  async function testConnection(
    platform: string,
    credentials: Record<string, string>
  ) {
    setTestResult("");
    const res = await fetch("/api/settings/credentials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, credentials }),
    });

    const data = await res.json();
    if (data.success) {
      setTestResult(
        `接続成功: ${data.username || data.handle}`
      );
    } else {
      setTestResult(`接続失敗: ${data.error}`);
    }
  }

  async function deleteCredentials(platform: string) {
    if (!confirm(`${platform} の認証情報を削除しますか？`)) return;
    const res = await fetch("/api/settings/credentials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (res.ok) {
      setMessage(`${platform} の認証情報を削除しました`);
      fetchStatuses();
    }
  }

  if (loading)
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-24" />
        <div className="skeleton h-64" />
        <div className="skeleton h-48" />
      </div>
    );

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold tracking-tight">設定</h1>

      {message && (
        <div className="p-3.5 bg-blue-50/80 text-blue-700 rounded-2xl text-sm">
          {message}
        </div>
      )}
      {testResult && (
        <div
          className={`p-3.5 rounded-2xl text-sm ${
            testResult.startsWith("接続成功")
              ? "bg-green-50/80 text-green-700"
              : "bg-red-50/80 text-red-700"
          }`}
        >
          {testResult}
        </div>
      )}

      {/* X (Twitter) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${statuses.x?.configured ? "bg-green-500" : "bg-gray-300"}`} />
            <h2 className="text-lg font-semibold">X (Twitter)</h2>
          </div>
          {statuses.x?.configured && (
            <span className="text-xs text-green-600 font-medium bg-green-50/80 px-2.5 py-1 rounded-full">接続済み</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">API Key</label>
            <input
              type="password"
              value={xApiKey}
              onChange={(e) => setXApiKey(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="API Key"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">API Secret</label>
            <input
              type="password"
              value={xApiSecret}
              onChange={(e) => setXApiSecret(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="API Secret"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Access Token</label>
            <input
              type="password"
              value={xAccessToken}
              onChange={(e) => setXAccessToken(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Access Token"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Access Secret</label>
            <input
              type="password"
              value={xAccessSecret}
              onChange={(e) => setXAccessSecret(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Access Secret"
            />
          </div>
        </div>
        <div className="space-y-2 mt-5">
          <button
            onClick={() =>
              saveCredentials("x", {
                apiKey: xApiKey,
                apiSecret: xApiSecret,
                accessToken: xAccessToken,
                accessSecret: xAccessSecret,
              })
            }
            className="btn-primary w-full h-12 text-sm tap-highlight"
          >
            保存
          </button>
          <div className="flex gap-2">
            <button
              onClick={() =>
                testConnection("x", {
                  apiKey: xApiKey,
                  apiSecret: xApiSecret,
                  accessToken: xAccessToken,
                  accessSecret: xAccessSecret,
                })
              }
              className="flex-1 h-11 text-sm bg-gray-100/80 rounded-[14px] hover:bg-gray-200/80 transition tap-highlight font-medium"
            >
              接続テスト
            </button>
            {statuses.x?.configured && (
              <button
                onClick={() => deleteCredentials("x")}
                className="flex-1 h-11 text-sm text-red-500 bg-red-50/80 rounded-[14px] hover:bg-red-100/80 transition tap-highlight font-medium"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bluesky */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${statuses.bluesky?.configured ? "bg-green-500" : "bg-gray-300"}`} />
            <h2 className="text-lg font-semibold">Bluesky</h2>
          </div>
          {statuses.bluesky?.configured && (
            <span className="text-xs text-green-600 font-medium bg-green-50/80 px-2.5 py-1 rounded-full">接続済み</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              ハンドル (例: user.bsky.social)
            </label>
            <input
              type="text"
              value={bsIdentifier}
              onChange={(e) => setBsIdentifier(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="your-handle.bsky.social"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              アプリパスワード
            </label>
            <input
              type="password"
              value={bsPassword}
              onChange={(e) => setBsPassword(e.target.value)}
              className="w-full px-3.5 bg-gray-50/60 border-0 rounded-xl text-sm h-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="App Password"
            />
          </div>
        </div>
        <div className="space-y-2 mt-5">
          <button
            onClick={() =>
              saveCredentials("bluesky", {
                identifier: bsIdentifier,
                password: bsPassword,
              })
            }
            className="btn-primary w-full h-12 text-sm tap-highlight"
          >
            保存
          </button>
          <div className="flex gap-2">
            <button
              onClick={() =>
                testConnection("bluesky", {
                  identifier: bsIdentifier,
                  password: bsPassword,
                })
              }
              className="flex-1 h-11 text-sm bg-gray-100/80 rounded-[14px] hover:bg-gray-200/80 transition tap-highlight font-medium"
            >
              接続テスト
            </button>
            {statuses.bluesky?.configured && (
              <button
                onClick={() => deleteCredentials("bluesky")}
                className="flex-1 h-11 text-sm text-red-500 bg-red-50/80 rounded-[14px] hover:bg-red-100/80 transition tap-highlight font-medium"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
