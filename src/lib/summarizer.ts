/**
 * Summarizer Service (REQ-SUM-001〜004, REQ-COT-001)
 * SDD 4.2: Claude API連携による要約生成、リトライロジック、並列/バッチ処理
 * TSK-SUM-002: Summarizer Service 基本実装
 * TSK-SUM-003: リトライロジック実装
 * TSK-SUM-004: 並列/バッチ要約処理実装
 * TSK-SUM-007: API使用量メトリクス記録
 */

import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Article } from "@prisma/client";

const MAX_CONCURRENT_SUMMARIZATIONS = 5; // REQ-SUM-004: 最大5並列
/** 最大試行回数（合計3回）。REQ-SUM-003, CODE_REVIEW §6.4: summarizer と email-sender で統一 */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // REQ-SUM-003: 指数バックオフ（1s, 2s, 4s）

// Claude API クライアント初期化
// 環境変数が設定されていない場合は後でエラーを出す
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

/**
 * 単一記事の要約を生成
 * @param article 要約対象の記事
 * @returns 要約テキストとAPI使用量（失敗時はnull）
 */
async function summarizeSingleArticle(
  article: Article
): Promise<{ summary: string; tokensUsed: { input: number; output: number } } | null> {
  // APIキーの確認
  if (!anthropic || !process.env.ANTHROPIC_API_KEY) {
    const errorMsg = "ANTHROPIC_API_KEY is not configured";
    logger.error("ANTHROPIC_API_KEY is not configured");
    throw new Error(errorMsg);
  }

  const prompt = `以下の生産技術×デジタル関連の技術記事を300字以内で要約してください。

タイトル: ${article.title || "タイトルなし"}

本文:
${article.rawContent.substring(0, 10000)}${article.rawContent.length > 10000 ? "..." : ""}

要約:`;

  let lastError: Error | null = null;

  // リトライロジック（REQ-SUM-003）
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Attempting to summarize article", { articleId: article.id, attempt, maxRetries: MAX_RETRIES });
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const summary = response.content[0];
      if (summary.type === "text") {
        // TSK-SUM-007: API使用量を取得
        const tokensUsed = {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        };
        return {
          summary: summary.text.trim(),
          tokensUsed,
        };
      }

      throw new Error("Unexpected response format from Claude API");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // エラーの詳細をログ出力
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : String(error);
      
      logger.error("Summarize attempt failed", { articleId: article.id, attempt, maxRetries: MAX_RETRIES, error: errorDetails });
      
      // 最後の試行でない場合は待機してリトライ
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1];
        logger.info("Retry after delay", { articleId: article.id, attempt, delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 全リトライ失敗
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  const errorName = lastError instanceof Error ? lastError.name : "UnknownError";
  logger.error("Failed to summarize article after retries", {
    error: errorMessage,
    errorName,
    articleId: article.id,
    articleUrl: article.url,
    articleTitle: article.title,
  });
  return null;
}

/**
 * Claude APIのコストを計算（USD）
 * モデル: claude-sonnet-4-5-20250929
 * 入力: $3.00 / 1M tokens
 * 出力: $15.00 / 1M tokens
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MILLION = 3.0;
  const OUTPUT_COST_PER_MILLION = 15.0;
  return (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION + (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
}

/**
 * 単一記事の要約を生成してDBに保存
 * @param article 要約対象の記事
 * @param jobRunId ジョブ実行ID（メトリクス記録用）
 * @returns 成功時はtrue、失敗時はfalse
 */
async function summarizeAndSaveArticle(
  article: Article,
  jobRunId: string
): Promise<{ success: boolean; error?: string; tokensUsed?: { input: number; output: number } }> {
  try {
    // 要約生成
    const result = await summarizeSingleArticle(article);
    
    if (!result) {
      return {
        success: false,
        error: "Failed to generate summary after retries",
      };
    }

    const { summary, tokensUsed } = result;

    // DBに保存（REQ-SUM-002）
    await prisma.article.update({
      where: { id: article.id },
      data: { summary },
    });

    // TSK-SUM-007: API使用量メトリクス記録（REQ-COT-001, REQ-MET-001）
    const costUsd = calculateCost(tokensUsed.input, tokensUsed.output);
    
    await Promise.all([
      // 入力トークン数
      prisma.metric.create({
        data: {
          runId: jobRunId,
          metricType: "api_tokens_input",
          value: tokensUsed.input,
        },
      }),
      // 出力トークン数
      prisma.metric.create({
        data: {
          runId: jobRunId,
          metricType: "api_tokens_output",
          value: tokensUsed.output,
        },
      }),
      // コスト（USD）
      prisma.metric.create({
        data: {
          runId: jobRunId,
          metricType: "api_cost_usd",
          value: costUsd,
        },
      }),
    ]);

    return { success: true, tokensUsed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error summarizing and saving article", { articleId: article.id, error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 複数記事の要約を並列処理で実行（REQ-SUM-004）
 * @param articles 要約対象の記事配列
 * @param jobRunId ジョブ実行ID（メトリクス記録用）
 * @returns 要約成功数とエラー配列
 */
export async function summarizeArticles(
  articles: Article[],
  jobRunId: string
): Promise<{
  articlesSummarized: number;
  errors: Array<{ articleId: string; articleUrl: string; error: string }>;
}> {
  if (articles.length === 0) {
    return { articlesSummarized: 0, errors: [] };
  }

  const limit = pLimit(MAX_CONCURRENT_SUMMARIZATIONS);
  const errors: Array<{ articleId: string; articleUrl: string; error: string }> = [];
  let successCount = 0;

  logger.info("Starting summarization", { count: articles.length, maxConcurrent: MAX_CONCURRENT_SUMMARIZATIONS });

  // 並列処理で要約実行
  const results = await Promise.allSettled(
    articles.map((article) =>
      limit(async () => {
        const result = await summarizeAndSaveArticle(article, jobRunId);
        if (result.success) {
          successCount++;
          logger.info("Successfully summarized article", { articleId: article.id, url: article.url });
        } else {
          errors.push({
            articleId: article.id,
            articleUrl: article.url,
            error: result.error || "Unknown error",
          });
          logger.error("Failed to summarize article", { articleId: article.id, url: article.url, error: result.error });
        }
      })
    )
  );

  // Promise.allSettledのエラーも記録
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const article = articles[index];
      errors.push({
        articleId: article.id,
        articleUrl: article.url,
        error: result.reason?.message || String(result.reason),
      });
    }
  });

  logger.info("Summarization completed", { successCount, total: articles.length });

  return {
    articlesSummarized: successCount,
    errors,
  };
}
