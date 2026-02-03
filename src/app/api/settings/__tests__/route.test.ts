/**
 * Settings API テスト (TSK-SET-001, TSK-SET-002)
 * REQ-SET-001〜004 のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, PUT } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Prismaをモック（CODE_REVIEW §5.1: findUnique + upsert）
vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/settings", () => {
    it("既存の設定を取得できる", async () => {
      const mockSettings = {
        id: "settings-1",
        dailySendTime: "09:00",
        recipientEmail: "test@example.com",
        emptySendBehavior: "skip" as const,
        costLimitMonthly: 10.0,
        costWarningRatio: 0.8,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.settings.findUnique).mockResolvedValue(mockSettings as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        dailySendTime: "09:00",
        recipientEmail: "test@example.com",
        emptySendBehavior: "skip",
        costLimitMonthly: 10.0,
        costWarningRatio: 0.8,
      });
    });

    it("設定が存在しない場合はデフォルト値を返す", async () => {
      vi.mocked(prisma.settings.findUnique).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        dailySendTime: "09:00",
        recipientEmail: "",
        emptySendBehavior: "skip",
        costLimitMonthly: null,
        costWarningRatio: 0.8,
      });
    });
  });

  describe("PUT /api/settings", () => {
    it("正常な設定で更新できる", async () => {
      const mockSettings = {
        id: "settings-1",
        dailySendTime: "10:00",
        recipientEmail: "updated@example.com",
        emptySendBehavior: "sendNotification" as const,
        costLimitMonthly: 20.0,
        costWarningRatio: 0.9,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.settings.upsert).mockResolvedValue(mockSettings as any);

      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          dailySendTime: "10:00",
          recipientEmail: "updated@example.com",
          emptySendBehavior: "sendNotification",
          costLimitMonthly: 20.0,
          costWarningRatio: 0.9,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        dailySendTime: "10:00",
        recipientEmail: "updated@example.com",
        emptySendBehavior: "sendNotification",
        costLimitMonthly: 20.0,
        costWarningRatio: 0.9,
      });
    });

    it("部分的な更新ができる", async () => {
      const mockSettings = {
        id: "settings-1",
        dailySendTime: "11:00",
        recipientEmail: "test@example.com",
        emptySendBehavior: "skip" as const,
        costLimitMonthly: 10.0,
        costWarningRatio: 0.8,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.settings.upsert).mockResolvedValue({
        ...mockSettings,
        dailySendTime: "11:00",
      } as any);

      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          dailySendTime: "11:00",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dailySendTime).toBe("11:00");
    });

    it("設定が存在しない場合は新規作成する", async () => {
      const mockSettings = {
        id: "settings-1",
        dailySendTime: "09:00",
        recipientEmail: "new@example.com",
        emptySendBehavior: "skip" as const,
        costLimitMonthly: null,
        costWarningRatio: 0.8,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.settings.upsert).mockResolvedValue(mockSettings as any);

      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          recipientEmail: "new@example.com",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipientEmail).toBe("new@example.com");
    });

    it("dailySendTimeのバリデーションエラー", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          dailySendTime: "25:00", // 無効な時刻
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.dailySendTime).toBeDefined();
    });

    it("recipientEmailのバリデーションエラー", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          recipientEmail: "invalid-email", // 無効なメールアドレス
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.recipientEmail).toBeDefined();
    });

    it("emptySendBehaviorのバリデーションエラー", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          emptySendBehavior: "invalid", // 無効な値
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.emptySendBehavior).toBeDefined();
    });

    it("costLimitMonthlyのバリデーションエラー（負の数）", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          costLimitMonthly: -10, // 負の数
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.costLimitMonthly).toBeDefined();
    });

    it("costWarningRatioのバリデーションエラー（範囲外）", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          costWarningRatio: 1.5, // 1より大きい
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details?.costWarningRatio).toBeDefined();
    });
  });
});
