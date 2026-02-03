/**
 * Email Sender Service テスト (REQ-EML-001〜006)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sendArticlesEmail,
  sendEmptyNotificationEmail,
  sendFailureNotificationEmail,
} from "../email-sender";
import type { Article } from "@prisma/client";

// nodemailerをモック
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: mockSendMail,
      })),
    },
  };
});

// 環境変数をモック
const originalEnv = process.env;

describe("Email Sender Service", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSendMail.mockReset();
    process.env = {
      ...originalEnv,
      GMAIL_USER: "test@example.com",
      GMAIL_APP_PASSWORD: "test-password",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("sendArticlesEmail - 成功ケース", () => {
    it("単一記事のメール送信が成功する", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト本文",
        summary: "これはテスト記事の要約です。",
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await sendArticlesEmail("recipient@example.com", [article]);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("recipient@example.com");
      expect(callArgs.subject).toContain("1件");
      expect(callArgs.html).toContain("テスト記事");
      expect(callArgs.html).toContain("これはテスト記事の要約です。");
      expect(callArgs.html).toContain("https://example.com/article1");
    });

    it("複数記事のメール送信が成功する", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const articles: Article[] = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "本文1",
          summary: "要約1",
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "article-2",
          url: "https://example.com/article2",
          title: "記事2",
          rawContent: "本文2",
          summary: "要約2",
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await sendArticlesEmail("recipient@example.com", articles);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain("2件");
      expect(callArgs.html).toContain("記事1");
      expect(callArgs.html).toContain("記事2");
    });
  });

  describe("sendArticlesEmail - エラーケース", () => {
    it("記事が0件の場合はエラーを返す", async () => {
      const result = await sendArticlesEmail("recipient@example.com", []);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No articles to send");
    });

    it("環境変数が設定されていない場合はエラーを返す", async () => {
      process.env.GMAIL_USER = "";
      process.env.GMAIL_APP_PASSWORD = "";

      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト本文",
        summary: "要約",
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await sendArticlesEmail("recipient@example.com", [article]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("GMAIL_USER or GMAIL_APP_PASSWORD is not configured");
    });
  });

  describe("sendArticlesEmail - リトライロジック (REQ-EML-005)", () => {
    it("3回リトライ後に失敗する", async () => {
      mockSendMail
        .mockRejectedValueOnce(new Error("SMTP Error"))
        .mockRejectedValueOnce(new Error("SMTP Error"))
        .mockRejectedValueOnce(new Error("SMTP Error"));

      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト本文",
        summary: "要約",
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const startTime = Date.now();
      const result = await sendArticlesEmail("recipient@example.com", [article]);
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP Error");
      expect(mockSendMail).toHaveBeenCalledTimes(3);
      // 指数バックオフ（1s, 2s）の合計時間を確認（3回目のリトライは実行されないため、約3秒）
      // 実際の遅延: 1回目失敗後1秒待機 → 2回目失敗後2秒待機 → 3回目失敗 = 合計約3秒
      expect(endTime - startTime).toBeGreaterThanOrEqual(2500);
      // 上限はCI等の遅い環境を考慮して60秒まで許容
      expect(endTime - startTime).toBeLessThan(60000);
    });

    it("2回目のリトライで成功する", async () => {
      mockSendMail
        .mockRejectedValueOnce(new Error("SMTP Error"))
        .mockResolvedValueOnce({ messageId: "test-id" });

      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト本文",
        summary: "要約",
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await sendArticlesEmail("recipient@example.com", [article]);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendEmptyNotificationEmail - 成功ケース", () => {
    it("0件時通知メールが送信される", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const result = await sendEmptyNotificationEmail("recipient@example.com");

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("recipient@example.com");
      expect(callArgs.subject).toContain("新規記事なし");
      expect(callArgs.html).toContain("本日は新規記事が収集されませんでした");
    });
  });

  describe("sendFailureNotificationEmail - 成功ケース", () => {
    it("失敗通知メールが送信される", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const errors = [
        {
          type: "scraping_failed",
          sourceUrl: "https://example.com/source",
          message: "Connection timeout",
        },
        {
          type: "summarization_failed",
          articleUrl: "https://example.com/article",
          message: "API error",
        },
      ];

      const result = await sendFailureNotificationEmail("recipient@example.com", errors);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("recipient@example.com");
      expect(callArgs.subject).toContain("エラー通知");
      expect(callArgs.subject).toContain("2件");
      expect(callArgs.html).toContain("scraping_failed");
      expect(callArgs.html).toContain("summarization_failed");
      expect(callArgs.html).toContain("https://example.com/source");
      expect(callArgs.html).toContain("https://example.com/article");
    });
  });
});
