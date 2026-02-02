/**
 * 日次ジョブ実行ロジック (REQ-SCH-002〜004, REQ-MET-001)
 * Phase 1: 収集のみ。Phase 2 で要約、Phase 3 でメールを追加。
 * TSK-SUM-006: コスト管理統合（月次上限チェック）
 */

import { prisma } from "@/lib/prisma";
import { checkCostLimitFromSettings } from "@/lib/cost-manager";

export type RunDailyJobResult =
  | { status: "completed"; jobRunId: string; articlesCollected: number; articlesSummarized: number; errors: unknown[] }
  | { status: "stopped"; jobRunId: string }
  | { status: "failed"; jobRunId: string; error: string };

/** 既に実行中のジョブがあるか */
export async function hasRunningJob(): Promise<boolean> {
  const running = await prisma.jobRun.findFirst({
    where: { status: { in: ["running", "stopping"] } },
  });
  return !!running;
}

/**
 * 日次ジョブを実行する。呼び出し元で CRON_SECRET 検証・重複チェック済みであること。
 * JobRun を running で作成 → scrapeAll → 完了 or 停止時は stopped/completed で更新。
 */
export async function runDailyJob(): Promise<RunDailyJobResult> {
  const jobRun = await prisma.jobRun.create({
    data: {
      status: "running",
      articlesCollected: 0,
      articlesSummarized: 0,
    },
  });
  const jobRunId = jobRun.id;

  try {
    const sources = await prisma.source.findMany({ orderBy: { createdAt: "asc" } });
    const { scrapeAll } = await import("@/lib/scraper");
    const { totalCollected, allErrors } = await scrapeAll(sources);

    // 停止要求が来ていたら次のフェーズに進まない (REQ-JOB-002)
    const current = await prisma.jobRun.findUnique({
      where: { id: jobRunId },
      select: { status: true },
    });
    if (current?.status === "stopping") {
      await prisma.jobRun.update({
        where: { id: jobRunId },
        data: { status: "stopped", finishedAt: new Date(), errors: allErrors as object },
      });
      return { status: "stopped", jobRunId };
    }

    // TSK-SUM-006: コスト管理チェック（要約処理前）
    // SDD 4.2 Cron Handler 5-a: コスト管理チェック
    console.log(`[runDailyJob] Checking cost limits...`);
    const costCheck = await checkCostLimitFromSettings();
    console.log(`[runDailyJob] Cost check result: allowed=${costCheck.allowed}, currentCost=${costCheck.currentCost}, limit=${costCheck.limit}`);
    
    if (!costCheck.allowed) {
      // 上限到達時は要約をスキップ
      console.log(
        `[runDailyJob] Cost limit reached: ${costCheck.currentCost.toFixed(4)} USD >= ${costCheck.limit} USD. Skipping summarization.`
      );
      
      const costLimitError = {
        type: "cost_limit_reached",
        message: `Monthly cost limit reached: ${costCheck.currentCost.toFixed(4)} USD >= ${costCheck.limit} USD. Summarization skipped.`,
        currentCost: costCheck.currentCost,
        limit: costCheck.limit,
      };
      
      const updatedErrors = [
        ...allErrors,
        costLimitError,
      ];
      
      await prisma.jobRun.update({
        where: { id: jobRunId },
        data: {
          status: "completed",
          finishedAt: new Date(),
          articlesCollected: totalCollected,
          articlesSummarized: 0, // 要約スキップ
          errors: updatedErrors.length > 0 ? (updatedErrors as object) : undefined,
        },
      });
      
      return {
        status: "completed",
        jobRunId,
        articlesCollected: totalCollected,
        articlesSummarized: 0, // 要約スキップ
        errors: updatedErrors,
      };
    }

    // 警告閾値到達時のログ（通知メールはPhase 3で実装）
    if (costCheck.warningThresholdReached && costCheck.limit !== null) {
      console.warn(
        `[runDailyJob] Cost warning threshold reached: ${costCheck.currentCost.toFixed(4)} USD >= ${(costCheck.settings.costWarningRatio * 100).toFixed(0)}% of limit (${costCheck.limit} USD). Warning email will be sent in Phase 3.`
      );
    }

    // TSK-SUM-005: Summarizer Service呼び出し（Phase 2実装）
    // 新規記事またはsummary=nullの記事を要約対象とする（REQ-SUM-001）
    console.log(`[runDailyJob] Searching for articles with summary=null...`);
    const articlesToSummarize = await prisma.article.findMany({
      where: {
        summary: null, // 要約未生成の記事のみ
      },
      orderBy: { collectedAt: "desc" },
    });

    console.log(`[runDailyJob] Found ${articlesToSummarize.length} articles to summarize`);

    let articlesSummarized = 0;
    const summaryErrors: Array<{ articleId: string; articleUrl: string; error: string }> = [];

    if (articlesToSummarize.length > 0) {
      console.log(`[runDailyJob] Starting summarization for ${articlesToSummarize.length} articles...`);
      try {
        const { summarizeArticles } = await import("@/lib/summarizer");
        const result = await summarizeArticles(articlesToSummarize, jobRunId);
        articlesSummarized = result.articlesSummarized;
        summaryErrors.push(...result.errors);
        console.log(`[runDailyJob] Summarization completed: ${articlesSummarized}/${articlesToSummarize.length} articles summarized successfully`);
        if (summaryErrors.length > 0) {
          console.error(`[runDailyJob] Summarization errors: ${summaryErrors.length} errors occurred`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[runDailyJob] Summarization failed with error:`, errorMessage);
        summaryErrors.push({
          articleId: "unknown",
          articleUrl: "unknown",
          error: errorMessage,
        });
      }
    } else {
      console.log("[runDailyJob] No articles to summarize (all articles already have summaries)");
    }

    // 収集エラーと要約エラーを統合
    const allJobErrors = [
      ...allErrors,
      ...summaryErrors.map((e) => ({
        type: "summarization_failed",
        articleId: e.articleId,
        articleUrl: e.articleUrl,
        message: e.error,
      })),
    ];

    await prisma.jobRun.update({
      where: { id: jobRunId },
      data: {
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: totalCollected,
        articlesSummarized,
        errors: allJobErrors.length > 0 ? (allJobErrors as object) : undefined,
      },
    });
    return {
      status: "completed",
      jobRunId,
      articlesCollected: totalCollected,
      articlesSummarized,
      errors: allJobErrors,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[runDailyJob]", e);
    await prisma.jobRun
      .update({
        where: { id: jobRunId },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errors: [{ type: "job_failed", message: errorMessage }] as object,
        },
      })
      .catch((err) => console.error("[runDailyJob] update failed", err));
    return { status: "failed", jobRunId, error: errorMessage };
  }
}
