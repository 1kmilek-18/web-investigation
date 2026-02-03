/**
 * 日次ジョブ実行ロジック (REQ-SCH-002〜004, REQ-MET-001)
 * Phase 1: 収集のみ。Phase 2 で要約、Phase 3 でメールを追加。
 * TSK-SUM-006: コスト管理統合（月次上限チェック）
 * TSK-EML-001: メール送信統合（Phase 3実装）
 * TSK-REV-016: JobRun.errors は Prisma.InputJsonValue で型安全に永続化
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { SETTINGS_ID } from "@/lib/constants";
import { checkCostLimitFromSettings } from "@/lib/cost-manager";
import {
  sendArticlesEmail,
  sendEmptyNotificationEmail,
  sendFailureNotificationEmail,
} from "@/lib/email-sender";
import { scrapeAll } from "@/lib/scraper";
import { summarizeArticles } from "@/lib/summarizer";

export type RunDailyJobResult =
  | { status: "completed"; jobRunId: string; articlesCollected: number; articlesSummarized: number; errors: unknown[] }
  | { status: "stopped"; jobRunId: string }
  | { status: "failed"; jobRunId: string; error: string };

/** JobRun.errors 用の型安全な JSON 変換（REQ-REV-016） */
function toJsonErrors(errors: unknown[]): Prisma.InputJsonValue {
  return errors as Prisma.InputJsonValue;
}

/** ジョブ実行のクールダウン（直近の完了からこの秒数以内は新規ジョブを開始しない） */
const JOB_COOLDOWN_SECONDS = 180; // 3分

/** 直近完了ジョブからクールダウン中か */
export async function isJobInCooldown(): Promise<{ inCooldown: boolean; remainingSeconds: number }> {
  const lastJob = await prisma.jobRun.findFirst({
    where: { status: { in: ["completed", "stopped", "failed"] } },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });
  if (!lastJob?.finishedAt) return { inCooldown: false, remainingSeconds: 0 };
  const elapsed = (Date.now() - lastJob.finishedAt.getTime()) / 1000;
  if (elapsed >= JOB_COOLDOWN_SECONDS) return { inCooldown: false, remainingSeconds: 0 };
  return { inCooldown: true, remainingSeconds: Math.ceil(JOB_COOLDOWN_SECONDS - elapsed) };
}

/** 既に実行中のジョブがあるか */
export async function hasRunningJob(): Promise<boolean> {
  // stopping状態のジョブが長時間残っている場合は、強制的に完了状態にする
  const stoppingJob = await prisma.jobRun.findFirst({
    where: { status: "stopping" },
    orderBy: { startedAt: "desc" },
  });
  
  if (stoppingJob) {
    const now = Date.now();
    const startedAt = stoppingJob.startedAt.getTime();
    const elapsedMinutes = (now - startedAt) / 1000 / 60;
    
    // 10分以上経過しているstopping状態のジョブは強制的に完了状態にする
    if (elapsedMinutes > 10) {
      logger.warn("Found stale stopping job, marking as stopped", { elapsedMinutes: elapsedMinutes.toFixed(1), jobRunId: stoppingJob.id });
      await prisma.jobRun.update({
        where: { id: stoppingJob.id },
        data: { 
          status: "stopped",
          finishedAt: new Date(),
        },
      });
    } else {
      return true; // まだ停止処理中
    }
  }
  
  const running = await prisma.jobRun.findFirst({
    where: { status: "running" },
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
  const jobStartTime = Date.now();
  const MAX_JOB_TIME_MS = process.env.TEST_MODE === "true" ? 120000 : 600000; // テストモード時は2分、通常は10分

  try {
    const sources = await prisma.source.findMany({ orderBy: { createdAt: "asc" } });
    
    // テストモード時はソース数を制限
    const sourcesToProcess = process.env.TEST_MODE === "true" 
      ? sources.slice(0, 2) // テストモード時は最大2ソース
      : sources;
    
    if (process.env.TEST_MODE === "true" && sources.length > 2) {
      logger.info("TEST_MODE: Processing only first 2 sources", { totalSources: sources.length });
    }
    
    const { totalCollected, allErrors } = await scrapeAll(sourcesToProcess);
    
    // タイムアウトチェック
    if (Date.now() - jobStartTime > MAX_JOB_TIME_MS) {
      logger.warn("Job timeout exceeded", { maxMs: MAX_JOB_TIME_MS });
      allErrors.push({
        sourceUrl: "system",
        message: `Job timeout: exceeded ${MAX_JOB_TIME_MS}ms`,
      });
    }

    // 停止要求が来ていたら次のフェーズに進まない (REQ-JOB-002)
    const current = await prisma.jobRun.findUnique({
      where: { id: jobRunId },
      select: { status: true },
    });
    if (current?.status === "stopping") {
      await prisma.jobRun.update({
        where: { id: jobRunId },
        data: { status: "stopped", finishedAt: new Date(), errors: toJsonErrors(allErrors) },
      });
      return { status: "stopped", jobRunId };
    }

    // TSK-SUM-006: コスト管理チェック（要約処理前）
    // SDD 4.2 Cron Handler 5-a: コスト管理チェック
    logger.info("Checking cost limits");
    const costCheck = await checkCostLimitFromSettings();
    logger.info("Cost check result", { allowed: costCheck.allowed, currentCost: costCheck.currentCost, limit: costCheck.limit });
    
    if (!costCheck.allowed) {
      // 上限到達時は要約をスキップ
      logger.info("Cost limit reached, skipping summarization", { currentCost: costCheck.currentCost, limit: costCheck.limit });
      
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
          errors: updatedErrors.length > 0 ? toJsonErrors(updatedErrors) : undefined,
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
      logger.warn("Cost warning threshold reached", { currentCost: costCheck.currentCost, limit: costCheck.limit, ratio: costCheck.settings.costWarningRatio });
    }

    // TSK-SUM-005: Summarizer Service呼び出し（Phase 2実装）
    // 新規記事またはsummary=nullの記事を要約対象とする（REQ-SUM-001）
    logger.info("Searching for articles with summary=null");
    const articlesToSummarize = await prisma.article.findMany({
      where: {
        summary: null, // 要約未生成の記事のみ
      },
      orderBy: { collectedAt: "desc" },
    });

    logger.info("Found articles to summarize", { count: articlesToSummarize.length });

    let articlesSummarized = 0;
    const summaryErrors: Array<{ articleId: string; articleUrl: string; error: string }> = [];

    if (articlesToSummarize.length > 0) {
      logger.info("Starting summarization", { count: articlesToSummarize.length });
      try {
        const result = await summarizeArticles(articlesToSummarize, jobRunId);
        articlesSummarized = result.articlesSummarized;
        summaryErrors.push(...result.errors);
        logger.info("Summarization completed", { summarized: articlesSummarized, total: articlesToSummarize.length });
        if (summaryErrors.length > 0) {
          logger.error("Summarization errors occurred", { count: summaryErrors.length });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Summarization failed", { error: errorMessage });
        summaryErrors.push({
          articleId: "unknown",
          articleUrl: "unknown",
          error: errorMessage,
        });
      }
    } else {
      logger.info("No articles to summarize (all articles already have summaries)");
    }

    // 収集エラーと要約エラーを統合
    const allJobErrors: Array<{
      type: string;
      message: string;
      sourceUrl?: string;
      articleUrl?: string;
      articleId?: string;
    }> = [
      ...allErrors.map((e) => ({
        type: "scraping_failed",
        message: e.message,
        sourceUrl: e.sourceUrl,
        articleUrl: undefined,
      })),
      ...summaryErrors.map((e) => ({
        type: "summarization_failed",
        message: e.error,
        sourceUrl: undefined,
        articleUrl: e.articleUrl,
        articleId: e.articleId,
      })),
    ];

    // 停止要求が来ていたらメール送信フェーズに進まない (REQ-JOB-002)
    const currentBeforeEmail = await prisma.jobRun.findUnique({
      where: { id: jobRunId },
      select: { status: true },
    });
    if (currentBeforeEmail?.status === "stopping") {
      await prisma.jobRun.update({
        where: { id: jobRunId },
        data: { status: "stopped", finishedAt: new Date(), errors: allJobErrors.length > 0 ? toJsonErrors(allJobErrors) : undefined },
      });
      return { status: "stopped", jobRunId };
    }

    // TSK-EML-001: メール送信処理（Phase 3実装）
    // REQ-EML-001: ジョブ完了時に、その日のジョブで収集・要約された記事をメール送信
    const emailErrors: Array<{ type: string; message: string; sourceUrl?: string; articleUrl?: string }> = [];
    
    try {
      // Settingsから設定を取得
      const settings = await prisma.settings.findUnique({
        where: { id: SETTINGS_ID },
      });

      if (!settings || !settings.recipientEmail) {
        logger.info("No recipient email configured, skipping email sending");
      } else {
        // その日のジョブで収集・要約された記事を取得（REQ-EML-001）
        // ジョブ開始日を JST の「日」で切り出し（CODE_REVIEW §5.2: タイムゾーン明示）
        const jstOffsetMs = 9 * 60 * 60 * 1000;
        const jobStartMs = jobRun.startedAt.getTime();
        const jstDate = new Date(jobStartMs + jstOffsetMs);
        const y = jstDate.getUTCFullYear();
        const m = jstDate.getUTCMonth();
        const d = jstDate.getUTCDate();
        const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - jstOffsetMs);
        const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - jstOffsetMs);

        const articlesForEmail = await prisma.article.findMany({
          where: {
            collectedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            summary: {
              not: null, // 要約が存在する記事のみ
            },
          },
          orderBy: { collectedAt: "desc" },
        });

        logger.info("Found articles to send via email", { count: articlesForEmail.length });

        // REQ-EML-004: emptySendBehavior設定に応じた処理
        // 空メールと失敗通知の重複を防ぐ: エラーがある場合は空メールを送らない（失敗通知のみ送る）
        // 要約失敗時も空メールを送らない（totalCollected>0 なら「収集できず」は誤り）
        const shouldSendEmpty =
          articlesForEmail.length === 0 &&
          totalCollected === 0 &&
          allJobErrors.length === 0 &&
          settings.emptySendBehavior === "sendNotification";

        if (articlesForEmail.length === 0) {
          if (shouldSendEmpty) {
            logger.info("No articles collected, sending empty notification email");
            const emailResult = await sendEmptyNotificationEmail(settings.recipientEmail);
            if (!emailResult.success) {
              emailErrors.push({
                type: "email_delivery_failed",
                message: `Failed to send empty notification email: ${emailResult.error}`,
              });
            }
          } else if (allJobErrors.length > 0) {
            logger.info("Errors occurred, skipping empty notification (failure notification will be sent)");
          } else if (totalCollected > 0) {
            logger.info("Articles collected but none summarized, skipping empty notification");
          } else {
            logger.info("No articles collected, skipping email (emptySendBehavior=skip)");
          }
        } else {
          // REQ-EML-001, REQ-EML-002, REQ-EML-003: 記事配信メール送信
          logger.info("Sending email with articles", { count: articlesForEmail.length });
          const emailResult = await sendArticlesEmail(settings.recipientEmail, articlesForEmail);
          if (!emailResult.success) {
            emailErrors.push({
              type: "email_delivery_failed",
              message: `Failed to send articles email: ${emailResult.error}`,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Email sending failed", { error: errorMessage });
      emailErrors.push({
        type: "email_delivery_failed",
        message: errorMessage,
      });
    }

    // REQ-EML-006: 失敗通知メール送信（エラーが1件以上ある場合）
    const finalErrors = [...allJobErrors, ...emailErrors];
    if (finalErrors.length > 0) {
      try {
        const settings = await prisma.settings.findUnique({
          where: { id: SETTINGS_ID },
        });
        if (settings && settings.recipientEmail) {
          logger.info("Sending failure notification email", { errorCount: finalErrors.length });
          await sendFailureNotificationEmail(
            settings.recipientEmail,
            finalErrors.map((e) => ({
              sourceUrl: e.sourceUrl,
              articleUrl: e.articleUrl,
              type: e.type,
              message: e.message,
            }))
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Failed to send failure notification email", { error: errorMessage });
        // 失敗通知メールの送信失敗はログのみ（無限ループを避ける）
      }
    }

    await prisma.jobRun.update({
      where: { id: jobRunId },
      data: {
        status: "completed",
        finishedAt: new Date(),
        articlesCollected: totalCollected,
        articlesSummarized,
        errors: finalErrors.length > 0 ? toJsonErrors(finalErrors) : undefined,
      },
    });
    return {
      status: "completed",
      jobRunId,
      articlesCollected: totalCollected,
      articlesSummarized,
      errors: finalErrors,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("runDailyJob failed", { error: errorMessage });
    await prisma.jobRun
      .update({
        where: { id: jobRunId },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errors: toJsonErrors([{ type: "job_failed", message: errorMessage }]),
        },
      })
      .catch((err) => logger.error("runDailyJob update failed", { error: err instanceof Error ? err.message : String(err) }));
    return { status: "failed", jobRunId, error: errorMessage };
  }
}
