/**
 * Cron Handler 統合テスト (TSK-SUM-009)
 * Cron Handlerと要約機能の統合テスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runDailyJob, hasRunningJob } from "../cron-handler";
import { prisma } from "@/lib/prisma";
import { checkCostLimitFromSettings } from "@/lib/cost-manager";

// モック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobRun: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    source: {
      findMany: vi.fn(),
    },
    article: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cost-manager", () => ({
  checkCostLimitFromSettings: vi.fn(),
}));

vi.mock("@/lib/scraper", () => ({
  scrapeAll: vi.fn(),
}));

vi.mock("@/lib/summarizer", () => ({
  summarizeArticles: vi.fn(),
}));

describe("Cron Handler - 要約機能統合", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runDailyJob - 要約統合", () => {
    it("収集完了後に要約が自動実行される", async () => {
      const jobRunId = "job-run-1";
      const mockJobRun = {
        id: jobRunId,
        status: "running" as const,
        articlesCollected: 0,
        articlesSummarized: 0,
        startedAt: new Date(),
        finishedAt: null,
        errors: null,
      };

      const mockSources = [
        { id: "source-1", url: "https://example.com", type: "list" as const },
      ];

      const mockArticles = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "内容1",
          summary: null,
          sourceId: "source-1",
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { scrapeAll } = await import("@/lib/scraper");
      const { summarizeArticles } = await import("@/lib/summarizer");

      vi.mocked(prisma.jobRun.create).mockResolvedValue(mockJobRun as any);
      vi.mocked(prisma.source.findMany).mockResolvedValue(mockSources as any);
      vi.mocked(scrapeAll).mockResolvedValue({
        totalCollected: 1,
        allErrors: [],
      });
      vi.mocked(prisma.jobRun.findUnique).mockResolvedValue({
        status: "running",
      } as any);
      vi.mocked(checkCostLimitFromSettings).mockResolvedValue({
        allowed: true,
        currentCost: 0.1,
        limit: 10,
        warningThresholdReached: false,
        settings: {
          costLimitMonthly: 10,
          costWarningRatio: 0.8,
        },
      });
      vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles as any);
      vi.mocked(summarizeArticles).mockResolvedValue({
        articlesSummarized: 1,
        errors: [],
      });
      vi.mocked(prisma.jobRun.update).mockResolvedValue({
        ...mockJobRun,
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: 1,
        articlesSummarized: 1,
      } as any);

      const result = await runDailyJob();

      expect(result.status).toBe("completed");
      if (result.status === "completed") {
        expect(result.articlesCollected).toBe(1);
        expect(result.errors).toHaveLength(0);
      }
      expect(summarizeArticles).toHaveBeenCalledWith(mockArticles, jobRunId);
      expect(prisma.jobRun.update).toHaveBeenCalledWith({
        where: { id: jobRunId },
        data: expect.objectContaining({
          status: "completed",
          articlesCollected: 1,
          articlesSummarized: 1,
        }),
      });
    });

    it("summary=nullの記事のみが要約対象になる", async () => {
      const jobRunId = "job-run-1";
      const mockJobRun = {
        id: jobRunId,
        status: "running" as const,
        articlesCollected: 0,
        articlesSummarized: 0,
        startedAt: new Date(),
        finishedAt: null,
        errors: null,
      };

      const mockArticles = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "内容1",
          summary: null, // 要約なし
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "article-2",
          url: "https://example.com/article2",
          title: "記事2",
          rawContent: "内容2",
          summary: "既存の要約", // 既に要約あり
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { scrapeAll } = await import("@/lib/scraper");
      const { summarizeArticles } = await import("@/lib/summarizer");

      vi.mocked(prisma.jobRun.create).mockResolvedValue(mockJobRun as any);
      vi.mocked(prisma.source.findMany).mockResolvedValue([]);
      vi.mocked(scrapeAll).mockResolvedValue({
        totalCollected: 2,
        allErrors: [],
      });
      vi.mocked(prisma.jobRun.findUnique).mockResolvedValue({
        status: "running",
      } as any);
      vi.mocked(checkCostLimitFromSettings).mockResolvedValue({
        allowed: true,
        currentCost: 0.1,
        limit: 10,
        warningThresholdReached: false,
        settings: {
          costLimitMonthly: 10,
          costWarningRatio: 0.8,
        },
      });
      // summary=nullの記事のみを返す
      vi.mocked(prisma.article.findMany).mockResolvedValue([mockArticles[0]] as any);
      vi.mocked(summarizeArticles).mockResolvedValue({
        articlesSummarized: 1,
        errors: [],
      });
      vi.mocked(prisma.jobRun.update).mockResolvedValue({
        ...mockJobRun,
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: 2,
        articlesSummarized: 1,
      } as any);

      await runDailyJob();

      // summary=nullの記事のみがfindManyで取得される
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          summary: null,
        },
        orderBy: { collectedAt: "desc" },
      });
      // 要約対象は1件のみ
      expect(summarizeArticles).toHaveBeenCalledWith([mockArticles[0]], jobRunId);
    });

    it("要約失敗がJobRun.errorsに記録される", async () => {
      const jobRunId = "job-run-1";
      const mockJobRun = {
        id: jobRunId,
        status: "running" as const,
        articlesCollected: 0,
        articlesSummarized: 0,
        startedAt: new Date(),
        finishedAt: null,
        errors: null,
      };

      const mockArticles = [
        {
          id: "article-1",
          url: "https://example.com/article1",
          title: "記事1",
          rawContent: "内容1",
          summary: null,
          sourceId: null,
          collectedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { scrapeAll } = await import("@/lib/scraper");
      const { summarizeArticles } = await import("@/lib/summarizer");

      vi.mocked(prisma.jobRun.create).mockResolvedValue(mockJobRun as any);
      vi.mocked(prisma.source.findMany).mockResolvedValue([]);
      vi.mocked(scrapeAll).mockResolvedValue({
        totalCollected: 1,
        allErrors: [],
      });
      vi.mocked(prisma.jobRun.findUnique).mockResolvedValue({
        status: "running",
      } as any);
      vi.mocked(checkCostLimitFromSettings).mockResolvedValue({
        allowed: true,
        currentCost: 0.1,
        limit: 10,
        warningThresholdReached: false,
        settings: {
          costLimitMonthly: 10,
          costWarningRatio: 0.8,
        },
      });
      vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles as any);
      vi.mocked(summarizeArticles).mockResolvedValue({
        articlesSummarized: 0,
        errors: [
          {
            articleId: "article-1",
            articleUrl: "https://example.com/article1",
            error: "要約失敗",
          },
        ],
      });
      vi.mocked(prisma.jobRun.update).mockResolvedValue({
        ...mockJobRun,
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: 1,
        articlesSummarized: 0,
      } as any);

      const result = await runDailyJob();

      expect(result.status).toBe("completed");
      if (result.status === "completed") {
        expect(result.articlesCollected).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          type: "summarization_failed",
          articleId: "article-1",
          articleUrl: "https://example.com/article1",
          message: "要約失敗",
        });
      }
    });

    it("コスト上限到達時は要約をスキップする", async () => {
      const jobRunId = "job-run-1";
      const mockJobRun = {
        id: jobRunId,
        status: "running" as const,
        articlesCollected: 0,
        articlesSummarized: 0,
        startedAt: new Date(),
        finishedAt: null,
        errors: null,
      };

      const { scrapeAll } = await import("@/lib/scraper");
      const { summarizeArticles } = await import("@/lib/summarizer");

      vi.mocked(prisma.jobRun.create).mockResolvedValue(mockJobRun as any);
      vi.mocked(prisma.source.findMany).mockResolvedValue([]);
      vi.mocked(scrapeAll).mockResolvedValue({
        totalCollected: 1,
        allErrors: [],
      });
      vi.mocked(prisma.jobRun.findUnique).mockResolvedValue({
        status: "running",
      } as any);
      // コスト上限到達
      vi.mocked(checkCostLimitFromSettings).mockResolvedValue({
        allowed: false,
        reason: "limit_reached",
        currentCost: 10.5,
        limit: 10,
        warningThresholdReached: false,
        settings: {
          costLimitMonthly: 10,
          costWarningRatio: 0.8,
        },
      });
      vi.mocked(prisma.jobRun.update).mockResolvedValue({
        ...mockJobRun,
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: 1,
        articlesSummarized: 0,
      } as any);

      const result = await runDailyJob();

      expect(result.status).toBe("completed");
      if (result.status === "completed") {
        expect(result.articlesCollected).toBe(1);
        // 要約はスキップされた
        expect(summarizeArticles).not.toHaveBeenCalled();
        // エラーにコスト上限が記録される
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
          type: "cost_limit_reached",
        });
      }
    });
  });

  describe("hasRunningJob", () => {
    it("実行中のジョブがある場合はtrueを返す", async () => {
      vi.mocked(prisma.jobRun.findFirst).mockResolvedValue({
        id: "job-1",
        status: "running",
      } as any);

      const result = await hasRunningJob();
      expect(result).toBe(true);
    });

    it("実行中のジョブがない場合はfalseを返す", async () => {
      vi.mocked(prisma.jobRun.findFirst).mockResolvedValue(null);

      const result = await hasRunningJob();
      expect(result).toBe(false);
    });
  });
});
