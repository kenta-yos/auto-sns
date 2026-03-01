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
        <div className="skeleton h-8 w-24 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold">設定</h1>

      {message && (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm">
          {message}
        </div>
      )}
      {testResult && (
        <div
          className={`p-3 rounded-xl text-sm ${
            testResult.startsWith("接続成功")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {testResult}
        </div>
      )}

      {/* X (Twitter) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {statuses.x?.configured && (
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            )}
            <h2 className="text-lg font-semibold">X (Twitter)</h2>
          </div>
          {statuses.x?.configured && (
            <span className="text-xs text-green-600 font-medium">接続済み</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">API Key</label>
            <input
              type="password"
              value={xApiKey}
              onChange={(e) => setXApiKey(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="API Key"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={xApiSecret}
              onChange={(e) => setXApiSecret(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="API Secret"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={xAccessToken}
              onChange={(e) => setXAccessToken(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="Access Token"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Access Secret
            </label>
            <input
              type="password"
              value={xAccessSecret}
              onChange={(e) => setXAccessSecret(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="Access Secret"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <button
            onClick={() =>
              saveCredentials("x", {
                apiKey: xApiKey,
                apiSecret: xApiSecret,
                accessToken: xAccessToken,
                accessSecret: xAccessSecret,
              })
            }
            className="w-full h-12 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium tap-highlight"
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
              className="flex-1 h-11 text-sm border rounded-xl hover:bg-gray-50 transition tap-highlight"
            >
              接続テスト
            </button>
            {statuses.x?.configured && (
              <button
                onClick={() => deleteCredentials("x")}
                className="flex-1 h-11 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition tap-highlight"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bluesky */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {statuses.bluesky?.configured && (
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            )}
            <h2 className="text-lg font-semibold">Bluesky</h2>
          </div>
          {statuses.bluesky?.configured && (
            <span className="text-xs text-green-600 font-medium">接続済み</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ハンドル (例: user.bsky.social)
            </label>
            <input
              type="text"
              value={bsIdentifier}
              onChange={(e) => setBsIdentifier(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="your-handle.bsky.social"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              アプリパスワード
            </label>
            <input
              type="password"
              value={bsPassword}
              onChange={(e) => setBsPassword(e.target.value)}
              className="w-full px-3 border rounded-xl text-sm h-11"
              placeholder="App Password"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <button
            onClick={() =>
              saveCredentials("bluesky", {
                identifier: bsIdentifier,
                password: bsPassword,
              })
            }
            className="w-full h-12 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium tap-highlight"
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
              className="flex-1 h-11 text-sm border rounded-xl hover:bg-gray-50 transition tap-highlight"
            >
              接続テスト
            </button>
            {statuses.bluesky?.configured && (
              <button
                onClick={() => deleteCredentials("bluesky")}
                className="flex-1 h-11 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition tap-highlight"
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
