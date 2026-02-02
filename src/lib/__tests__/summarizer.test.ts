/**
 * Summarizer Service ユニットテスト (TSK-SUM-008)
 * REQ-SUM-001〜004 のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { summarizeArticles } from "../summarizer";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { Article } from "@prisma/client";

// PrismaとAnthropicをモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      update: vi.fn(),
    },
    metric: {
      create: vi.fn(),
    },
  },
}));

// モック関数をモジュールスコープで定義
const mockMessagesCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", async () => {
  const actual = await vi.importActual("@anthropic-ai/sdk");
  const mockCreate = vi.fn();
  // グローバルにアクセス可能にする
  (globalThis as any).__mockMessagesCreate = mockCreate;
  
  class MockAnthropic {
    messages = {
      create: mockCreate,
    };
  }
  return {
    ...actual,
    default: MockAnthropic,
  };
});

// setTimeoutをモック（リトライの遅延をスキップ）
vi.useFakeTimers();

describe("Summarizer Service", () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    // グローバルからモック関数を取得
    mockCreate = (globalThis as any).__mockMessagesCreate;
    if (mockCreate) {
      mockCreate.mockClear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("summarizeArticles - 成功ケース", () => {
    it("単一記事の要約が成功する", async () => {
      vi.useRealTimers(); // このテストでは実際のタイマーを使用
      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "これはテスト記事の内容です。生産技術とデジタル化について説明しています。",
        summary: null,
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const jobRunId = "job-run-1";

      // Claude APIのモックレスポンス
      const mockResponse = {
        content: [
          {
            type: "text" as const,
            text: "テスト記事の要約です。",
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      mockCreate.mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.article.update).mockResolvedValue(article);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);

      const result = await summarizeArticles([article], jobRunId);

      expect(result.articlesSummarized).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: article.id },
        data: { summary: "テスト記事の要約です。" },
      });
      expect(prisma.metric.create).toHaveBeenCalledTimes(3); // input, output, cost
    });

    it("複数記事の要約が並列で成功する", async () => {
      vi.useRealTimers(); // このテストでは実際のタイマーを使用
      const articles: Article[] = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "記事1の内容",
          summary: null,
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "article-2",
          url: "https://example.com/article2",
          title: "記事2",
          rawContent: "記事2の内容",
          summary: null,
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const jobRunId = "job-run-1";

      const mockResponse = {
        content: [
          {
            type: "text" as const,
            text: "要約テキスト",
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      mockCreate.mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.article.update).mockResolvedValue({} as any);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);

      const result = await summarizeArticles(articles, jobRunId);

      expect(result.articlesSummarized).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(prisma.article.update).toHaveBeenCalledTimes(2);
    });

    it("空の記事配列の場合は何も実行しない", async () => {
      const result = await summarizeArticles([], "job-run-1");

      expect(result.articlesSummarized).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.article.update).not.toHaveBeenCalled();
    });
  });

  describe("summarizeArticles - リトライロジック (REQ-SUM-003)", () => {
    it("3回リトライ後に失敗する", async () => {
      vi.useFakeTimers(); // タイマーをモック
      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト内容",
        summary: null,
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const jobRunId = "job-run-1";

      // 3回失敗してから成功しない（4回目も失敗）
      mockCreate
        .mockRejectedValueOnce(new Error("API Error 1"))
        .mockRejectedValueOnce(new Error("API Error 2"))
        .mockRejectedValueOnce(new Error("API Error 3"))
        .mockRejectedValueOnce(new Error("API Error 4"));

      const promise = summarizeArticles([article], jobRunId);
      // タイマーを進めてリトライを完了させる
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.articlesSummarized).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].articleId).toBe(article.id);
      expect(result.errors[0].error).toContain("Failed to generate summary");
      expect(mockCreate).toHaveBeenCalledTimes(4); // 初回 + 3回リトライ
    });

    it("2回目のリトライで成功する", async () => {
      vi.useFakeTimers(); // タイマーをモック
      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト内容",
        summary: null,
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const jobRunId = "job-run-1";

      const mockResponse = {
        content: [
          {
            type: "text" as const,
            text: "要約成功",
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      // 1回目失敗、2回目成功
      mockCreate
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValue(mockResponse as any);

      vi.mocked(prisma.article.update).mockResolvedValue(article);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);

      const promise = summarizeArticles([article], jobRunId);
      // タイマーを進めてリトライを完了させる
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.articlesSummarized).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("summarizeArticles - 並列処理 (REQ-SUM-004)", () => {
    it("一部失敗時も他の記事の要約が継続される", async () => {
      vi.useFakeTimers(); // タイマーをモック
      const articles: Article[] = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "記事1の内容",
          summary: null,
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "article-2",
          url: "https://example.com/article2",
          title: "記事2",
          rawContent: "記事2の内容",
          summary: null,
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const jobRunId = "job-run-1";

      const mockSuccessResponse = {
        content: [
          {
            type: "text" as const,
            text: "要約成功",
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      // 記事1は成功、記事2は失敗
      mockCreate
        .mockResolvedValueOnce(mockSuccessResponse as any)
        .mockRejectedValue(new Error("API Error"));

      vi.mocked(prisma.article.update).mockResolvedValue({} as any);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);

      const promise = summarizeArticles(articles, jobRunId);
      // タイマーを進めてリトライを完了させる
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.articlesSummarized).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].articleId).toBe("article-2");
    });
  });

  describe("summarizeArticles - メトリクス記録 (TSK-SUM-007)", () => {
    it("API使用量がMetricsテーブルに記録される", async () => {
      vi.useRealTimers(); // このテストでは実際のタイマーを使用
      const article: Article = {
        id: "article-1",
        url: "https://example.com/article1",
        title: "テスト記事",
        rawContent: "テスト内容",
        summary: null,
        sourceId: null,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };

      const jobRunId = "job-run-1";

      const mockResponse = {
        content: [
          {
            type: "text" as const,
            text: "要約",
          },
        ],
        usage: {
          input_tokens: 150,
          output_tokens: 75,
        },
      };

      mockCreate.mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.article.update).mockResolvedValue(article);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);

      await summarizeArticles([article], jobRunId);

      // メトリクスが3回記録される（input, output, cost）
      expect(prisma.metric.create).toHaveBeenCalledTimes(3);
      
      const metricCalls = vi.mocked(prisma.metric.create).mock.calls;
      expect(metricCalls[0][0].data).toMatchObject({
        runId: jobRunId,
        metricType: "api_tokens_input",
        value: 150,
      });
      expect(metricCalls[1][0].data).toMatchObject({
        runId: jobRunId,
        metricType: "api_tokens_output",
        value: 75,
      });
      expect(metricCalls[2][0].data).toMatchObject({
        runId: jobRunId,
        metricType: "api_cost_usd",
      });
    });
  });
});
