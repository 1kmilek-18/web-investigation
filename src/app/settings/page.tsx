"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import type { EmptySendBehavior } from "@prisma/client";
import { fetchWithTimeout } from "@/lib/utils";

interface SettingsData {
  dailySendTime: string;
  recipientEmail: string;
  emptySendBehavior: EmptySendBehavior;
  costLimitMonthly: number | null;
  costWarningRatio: number;
}

const DEFAULT_SETTINGS_STATE: SettingsData = {
  dailySendTime: "09:00",
  recipientEmail: "",
  emptySendBehavior: "skip",
  costLimitMonthly: null,
  costWarningRatio: 0.8,
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS_STATE);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const res = await fetchWithTimeout("/api/settings");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "読み込みに失敗しました");
        setSettings(DEFAULT_SETTINGS_STATE);
        return;
      }
      setSettings({
        dailySendTime: data.dailySendTime ?? DEFAULT_SETTINGS_STATE.dailySendTime,
        recipientEmail: data.recipientEmail ?? "",
        emptySendBehavior:
          data.emptySendBehavior ?? DEFAULT_SETTINGS_STATE.emptySendBehavior,
        costLimitMonthly: data.costLimitMonthly ?? null,
        costWarningRatio:
          data.costWarningRatio ?? DEFAULT_SETTINGS_STATE.costWarningRatio,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "タイムアウトしました。しばらくしてから再読み込みしてください。"
          : "読み込みに失敗しました。ネットワークとAPIを確認してください。";
      setFetchError(message);
      setSettings(DEFAULT_SETTINGS_STATE);
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`エラー: ${error.error || error.details?.join(", ")}`);
        return;
      }

      alert("設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Settings className="h-8 w-8" />
            <span>配信設定</span>
          </h1>
        </div>
        <div className="text-center py-8 space-y-2">
          <p className="text-destructive">{fetchError}</p>
          <Button variant="outline" onClick={() => fetchSettings()}>
            再読み込み
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Settings className="h-8 w-8" />
          <span>配信設定</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          メール配信の設定を変更できます
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本設定</CardTitle>
            <CardDescription>メール配信の基本設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="dailySendTime">配信時刻</Label>
              <Input
                id="dailySendTime"
                type="time"
                value={settings.dailySendTime}
                onChange={(e) =>
                  setSettings({ ...settings, dailySendTime: e.target.value })
                }
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                24時間形式（例: 09:00）
              </p>
            </div>

            <div>
              <Label htmlFor="recipientEmail">受信メールアドレス</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={settings.recipientEmail}
                onChange={(e) =>
                  setSettings({ ...settings, recipientEmail: e.target.value })
                }
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="emptySendBehavior">0件時の動作</Label>
              <Select
                value={settings.emptySendBehavior}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    emptySendBehavior: value as EmptySendBehavior,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">メールを送信しない</SelectItem>
                  <SelectItem value="sendNotification">
                    通知メールを送信
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>コスト管理</CardTitle>
            <CardDescription>月次コスト上限と警告設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="costLimitMonthly">月次コスト上限（USD）</Label>
              <Input
                id="costLimitMonthly"
                type="number"
                step="0.01"
                min="0"
                value={settings.costLimitMonthly ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    costLimitMonthly:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
                placeholder="未設定"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                上限に達すると要約処理がスキップされます
              </p>
            </div>

            <div>
              <Label htmlFor="costWarningRatio">警告閾値</Label>
              <Input
                id="costWarningRatio"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.costWarningRatio}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    costWarningRatio: parseFloat(e.target.value),
                  })
                }
              />
              <p className="mt-1 text-sm text-muted-foreground">
                0.8 = 上限の80%で警告（0〜1の範囲）
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
